'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// --- Interfaces ---

interface BallState {
  status: 'idle' | 'pitching' | 'hit' | 'missed'
  progress: number // 0 to 1
  startTime: number
}

interface Feedback {
  text: string
  color: string
  id: number
}

// --- Components ---

const ChanceIndicator = ({ remaining }: { remaining: number }) => {
  return (
    <div className="flex gap-2" role="status" aria-label="Remaining chances">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 ${
            i < remaining ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gray-600/50'
          }`}
        >
          {i < remaining && <span className="text-[10px]">⚾</span>}
        </div>
      ))}
    </div>
  )
}

const BallAtom = ({ status, progress }: { status: string; progress: number }) => {
  if (status === 'idle') return null

  // Pitcher is at roughly 50,50 (center)
  // Batter is at roughly 70,80 (bottom-right area)
  // Let's refine the trajectory
  const startX = 50
  const startY = 45
  const endX = 70
  const endY = 85
  
  const left = startX + (endX - startX) * progress
  const top = startY + (endY - startY) * progress
  const scale = 0.2 + 1.8 * progress
  
  // If hit, it should fly away
  let displayLeft = left
  let displayTop = top
  let displayScale = scale
  let opacity = 1

  if (status === 'hit') {
    // Fly to top left/center
    displayTop = top - (progress * 100)
    displayLeft = left - (progress * 50)
    displayScale = scale * (1 - progress)
    opacity = 1 - progress
  } else if (status === 'missed') {
    opacity = 0.5
  }

  return (
    <div
      className="absolute w-10 h-10 bg-white rounded-full border-2 border-gray-300 shadow-lg pointer-events-none z-20"
      style={{
        left: `${displayLeft}%`,
        top: `${displayTop}%`,
        transform: `translate(-50%, -50%) scale(${displayScale})`,
        opacity
      }}
    >
      <div className="absolute inset-0 border-t-2 border-red-400 rounded-full opacity-30 transform rotate-45"></div>
      <div className="absolute inset-0 border-b-2 border-red-400 rounded-full opacity-30 transform -rotate-45"></div>
    </div>
  )
}

const BatterMolecule = ({ isSwinging }: { isSwinging: boolean }) => {
  return (
    <div className="absolute bottom-10 left-[70%] transform -translate-x-1/2 flex flex-col items-center z-10">
      <div className="relative">
        {/* Batter Body */}
        <div className="w-16 h-40 bg-blue-800 rounded-t-full border-2 border-blue-900 shadow-xl flex items-center justify-center">
          <div className="w-10 h-10 bg-pink-200 rounded-full mb-20 border-2 border-pink-300" />
        </div>
        
        {/* Bat */}
        <div 
          className="absolute bottom-24 -left-4 transition-transform duration-75 origin-bottom"
          style={{ 
            transform: isSwinging ? 'rotate(-110deg) translateX(-20px)' : 'rotate(-20deg)',
          }}
        >
          <div className="w-4 h-36 bg-amber-800 rounded-full origin-bottom shadow-lg border-x border-amber-900" />
        </div>
      </div>
    </div>
  )
}

const GameOverModal = ({ finalScore, isOpen, onRestart }: { finalScore: number; isOpen: boolean; onRestart: () => void }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-green-900 border-4 border-yellow-500 p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full animate-in zoom-in duration-300">
        <h2 className="text-5xl font-black text-yellow-500 mb-2 italic tracking-tighter">GAME OVER</h2>
        <div className="w-full h-1 bg-yellow-500/30 mb-8" />
        
        <div className="flex flex-col items-center mb-10">
          <span className="text-gray-400 uppercase tracking-widest text-sm mb-1">Final Score</span>
          <span className="text-6xl font-black text-white">{finalScore.toLocaleString()}</span>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 px-8 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-green-900 font-bold text-2xl rounded-xl transition-all shadow-lg active:scale-95"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

// --- Main Page Component ---

export default function Page() {
  const [score, setScore] = useState(0)
  const [chances, setChances] = useState(3)
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing')
  const [isSwinging, setIsSwinging] = useState(false)
  const [ball, setBall] = useState<BallState>({ status: 'idle', progress: 0, startTime: 0 })
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  
  const pitchInterval = useRef<NodeJS.Timeout | null>(null)
  const animationFrame = useRef<number | null>(null)
  
  const PITCH_DURATION = 1500 // 1.5 seconds for the ball to reach the batter
  const SWEET_SPOT = 0.85 // Progress at which it's a perfect hit

  const showFeedback = (text: string, color: string) => {
    setFeedback({ text, color, id: Date.now() })
    setTimeout(() => setFeedback(null), 1000)
  }

  const startPitch = useCallback(() => {
    if (gameState === 'gameOver') return
    
    setBall({
      status: 'pitching',
      progress: 0,
      startTime: Date.now()
    })
  }, [gameState])

  // Game Loop
  useEffect(() => {
    if (gameState === 'gameOver') return

    const update = () => {
      setBall(prev => {
        if (prev.status === 'idle') return prev
        
        const elapsed = Date.now() - prev.startTime
        const progress = Math.min(elapsed / PITCH_DURATION, 1)

        if (prev.status === 'pitching' && progress >= 1) {
          // Missed/Strike
          setChances(c => {
            const next = c - 1
            if (next <= 0) setGameState('gameOver')
            return next
          })
          showFeedback('STRIKE!', 'text-red-500')
          return { ...prev, status: 'missed', progress: 1 }
        }

        if ((prev.status === 'hit' || prev.status === 'missed') && progress >= 1) {
          // Ready for next pitch
          setTimeout(startPitch, 1000)
          return { status: 'idle', progress: 0, startTime: 0 }
        }

        return { ...prev, progress }
      })
      animationFrame.current = requestAnimationFrame(update)
    }

    animationFrame.current = requestAnimationFrame(update)
    
    // Initial pitch
    const timer = setTimeout(startPitch, 2000)

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
      clearTimeout(timer)
    }
  }, [gameState, startPitch])

  const handleSwing = () => {
    if (isSwinging || gameState === 'gameOver') return
    
    setIsSwinging(true)
    setTimeout(() => setIsSwinging(false), 200)

    if (ball.status === 'pitching') {
      const diff = Math.abs(ball.progress - SWEET_SPOT)
      
      if (diff < 0.05) {
        // Home Run
        setScore(s => s + 1000)
        showFeedback('HOME RUN!!', 'text-yellow-400')
        setBall(b => ({ ...b, status: 'hit', startTime: Date.now(), progress: 0 }))
      } else if (diff < 0.1) {
        // 3-Base
        setScore(s => s + 500)
        showFeedback('3-BASE HIT!', 'text-orange-400')
        setBall(b => ({ ...b, status: 'hit', startTime: Date.now(), progress: 0 }))
      } else if (diff < 0.15) {
        // 2-Base
        setScore(s => s + 200)
        showFeedback('2-BASE HIT', 'text-blue-400')
        setBall(b => ({ ...b, status: 'hit', startTime: Date.now(), progress: 0 }))
      } else if (diff < 0.2) {
        // 1-Base
        setScore(s => s + 100)
        showFeedback('1-BASE HIT', 'text-green-400')
        setBall(b => ({ ...b, status: 'hit', startTime: Date.now(), progress: 0 }))
      } else {
        // Strike anyway if too early/late but swung
        // Actually the auto-strike at progress 1 will handle it if we don't hit
      }
    }
  }

  const restartGame = () => {
    setScore(0)
    setChances(3)
    setGameState('playing')
    setBall({ status: 'idle', progress: 0, startTime: 0 })
    setTimeout(startPitch, 1000)
  }

  return (
    <main 
      className="relative h-screen w-full bg-green-900 overflow-hidden flex flex-col items-center justify-center font-sans text-white select-none"
      onClick={handleSwing}
      aria-label="Baseball Rhythm Game Page"
    >
      {/* Game Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-30">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-gray-300">Score</span>
          <span className="text-4xl font-black text-white drop-shadow-md">{score.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs uppercase tracking-widest text-gray-300">Chances</span>
          <ChanceIndicator remaining={chances} />
        </div>
      </header>

      {/* Game Play Area */}
      <div className="relative w-full max-w-4xl aspect-[16/9] bg-green-700 rounded-xl shadow-2xl overflow-hidden border-4 border-green-800 cursor-pointer">
        {/* Field Markings */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[150%] border-[20px] border-white rounded-full translate-y-1/2" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-32 h-32 border-4 border-white rounded-full" />
        </div>

        {/* Pitcher Mound */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-green-800 rounded-full border-2 border-green-900 shadow-inner flex items-center justify-center">
          <div className="w-16 h-2 bg-gray-300 rounded-full" />
        </div>

        {/* Components */}
        <BallAtom status={ball.status} progress={ball.progress} />
        <BatterMolecule isSwinging={isSwinging} />

        {/* Feedback Text */}
        {feedback && (
          <div 
            key={feedback.id}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black italic ${feedback.color} drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] animate-bounce z-40 pointer-events-none`}
          >
            {feedback.text}
          </div>
        )}

        {/* Timing Helper (Sweet Spot) */}
        <div className="absolute bottom-12 right-[15%] w-32 h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div 
            className="h-full bg-yellow-500/50 w-4 mx-auto"
            style={{ marginLeft: '80%' }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-10 text-gray-400 animate-pulse text-sm uppercase tracking-widest">
        Tap Screen to Swing!
      </div>

      <GameOverModal 
        finalScore={score} 
        isOpen={gameState === 'gameOver'} 
        onRestart={restartGame} 
      />
    </main>
  )
}
