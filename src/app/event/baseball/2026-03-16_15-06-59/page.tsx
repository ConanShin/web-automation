'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// --- Types ---
type GameState = 'ready' | 'playing' | 'gameover'
type HitResult = 'homerun' | 'hit' | 'strike' | null

interface BallPosition {
  x: number
  y: number
}

// --- Components ---

const BaseballSprite = ({ scale }: { scale: number }) => (
  <div
    role="img"
    aria-label="Baseball"
    className="w-8 h-8 bg-white rounded-full border-2 border-slate-300 shadow-xl"
    style={{ transform: `scale(${scale})` }}
  />
)

const BatterSprite = ({ isSwinging }: { isSwinging: boolean }) => (
  <div className={`relative transition-transform duration-150 ${isSwinging ? 'rotate-[-45deg] scale-110' : 'rotate-0'}`}>
    <div className="w-12 h-24 bg-blue-600 rounded-t-lg relative">
      <div className="absolute -top-10 left-1 w-10 h-10 bg-orange-200 rounded-full" />
      <div 
        className={`absolute top-0 -right-8 w-4 h-24 bg-amber-800 rounded-full origin-bottom transition-transform duration-100 ${isSwinging ? '-rotate-90' : 'rotate-0'}`} 
      />
    </div>
  </div>
)

const PitcherSprite = ({ isPitching }: { isPitching: boolean }) => (
  <div className={`relative transition-all duration-300 ${isPitching ? 'scale-105' : 'scale-100'}`}>
    <div className="w-12 h-24 bg-red-700 rounded-t-lg relative">
      <div className="absolute -top-10 left-1 w-10 h-10 bg-orange-200 rounded-full" />
      <div className={`absolute top-4 -left-4 w-6 h-6 bg-amber-900 rounded-full transition-transform ${isPitching ? '-translate-y-4' : 'translate-y-0'}`} />
    </div>
  </div>
)

const TimingGuideline = () => (
  <div className="relative w-48 h-12 flex items-center justify-center">
    <div className="absolute w-full h-1 bg-white/20 rounded-full" />
    <div className="absolute w-12 h-12 border-4 border-yellow-400 rounded-full animate-pulse" />
    <div className="absolute w-16 h-1 bg-yellow-400/50" />
  </div>
)

const ScoreBoard = ({ score, combo }: { score: number, combo: number }) => (
  <div className="flex flex-col">
    <div className="text-sm font-bold uppercase tracking-widest text-emerald-200">Score</div>
    <div className="text-4xl font-black text-yellow-400">{score.toLocaleString()}</div>
    {combo > 1 && (
      <div className="mt-1 text-xl font-bold italic text-orange-400 animate-bounce">
        {combo} COMBO!
      </div>
    )}
  </div>
)

const LivesCounter = ({ lives }: { lives: number }) => (
  <div className="flex gap-2">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className={`w-8 h-8 rounded-full border-2 border-white shadow-md transition-all duration-300 ${
          i < lives ? 'bg-white scale-110' : 'bg-transparent opacity-30 scale-90'
        }`}
        role="img"
        aria-label={i < lives ? "Available Life" : "Lost Life"}
      />
    ))}
  </div>
)

const ResultModal = ({ isVisible, finalScore, bestScore, onRestart }: { isVisible: boolean, finalScore: number, bestScore: number, onRestart: () => void }) => {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-6 backdrop-blur-sm" role="dialog" aria-label="Game Over results">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
        <h2 className="text-4xl font-black text-emerald-950 mb-2">GAME OVER</h2>
        <div className="space-y-4 my-8">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Final Score</p>
            <p className="text-5xl font-black text-emerald-600">{finalScore.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xs font-bold text-emerald-800 uppercase">Personal Best</p>
            <p className="text-xl font-bold text-emerald-950">{bestScore.toLocaleString()}</p>
          </div>
        </div>
        <button
          onClick={onRestart}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-black text-xl rounded-2xl shadow-lg shadow-emerald-200"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function Page() {
  const [gameState, setGameState] = useState<GameState>('ready')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lives, setLives] = useState(3)
  const [bestScore, setBestScore] = useState(0)
  
  const [isPitching, setIsPitching] = useState(false)
  const [isSwinging, setIsSwinging] = useState(false)
  const [ballPosition, setBallPosition] = useState<BallPosition>({ x: 0, y: 50 })
  const [ballScale, setBallScale] = useState(0.2)
  const [showBall, setShowBall] = useState(false)
  const [feedback, setFeedback] = useState<HitResult>(null)

  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const ballProgressRef = useRef<number>(0)

  useEffect(() => {
    const saved = localStorage.getItem('baseball_best_score')
    if (saved) setBestScore(parseInt(saved, 10))
  }, [])

  const processResult = useCallback((result: HitResult) => {
    setFeedback(result)
    setShowBall(false)

    if (result === 'homerun') {
      setScore(s => s + 1000 + (combo * 100))
      setCombo(c => c + 1)
    } else if (result === 'hit') {
      setScore(s => s + 300 + (combo * 50))
      setCombo(c => c + 1)
    } else {
      setCombo(0)
      setLives(l => {
        const newLives = l - 1
        if (newLives <= 0) {
          setGameState('gameover')
        }
        return newLives
      })
    }
  }, [combo, lives])

  const gameLoop = useCallback(() => {
    const now = performance.now()
    const dt = now - lastTimeRef.current
    lastTimeRef.current = now

    ballProgressRef.current += dt / 1500

    if (ballProgressRef.current >= 1.2) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      processResult('strike')
      return
    }

    const progress = ballProgressRef.current
    setBallPosition({
      x: 0, 
      y: 50 + progress * 25
    })
    setBallScale(0.2 + progress * 2.8)

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [processResult])

  const startPitch = useCallback(() => {
    setIsPitching(true)
    setShowBall(false)
    ballProgressRef.current = 0
    
    setTimeout(() => {
      setShowBall(true)
      lastTimeRef.current = performance.now()
      gameLoop()
    }, 800)
  }, [gameLoop])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setCombo(0)
    setLives(3)
    setFeedback(null)
    startPitch()
  }

  useEffect(() => {
    if (gameState === 'playing' && !showBall && !feedback && lives > 0) {
      const timer = setTimeout(() => {
        startPitch()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [gameState, showBall, feedback, lives, startPitch])

  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > bestScore) {
        setBestScore(score)
        localStorage.setItem('baseball_best_score', score.toString())
      }
    }
  }, [gameState, score, bestScore])

  const handleSwing = () => {
    if (gameState !== 'playing' || isSwinging || !showBall) return

    setIsSwinging(true)
    setTimeout(() => setIsSwinging(false), 300)

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)

    const progress = ballProgressRef.current
    
    let result: HitResult = 'strike'
    if (progress >= 0.88 && progress <= 0.94) {
      result = 'homerun'
    } else if (progress >= 0.75 && progress <= 1.05) {
      result = 'hit'
    }

    processResult(result)
  }

  return (
    <div 
      className="relative w-full h-screen bg-emerald-900 overflow-hidden flex flex-col items-center justify-center font-sans text-white select-none"
      onClick={handleSwing}
    >
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20 pointer-events-none">
        <ScoreBoard score={score} combo={combo} />
        <LivesCounter lives={lives} />
      </div>
      
      {/* Ready Screen */}
      {gameState === 'ready' && (
        <div className="z-30 text-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-6xl font-black mb-8 italic tracking-tighter text-yellow-400 drop-shadow-lg">
            SWING RHYTHM
          </h1>
          <button 
            onClick={(e) => { e.stopPropagation(); startGame(); }}
            className="px-12 py-6 bg-white text-emerald-900 text-3xl font-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          >
            PLAY BALL
          </button>
        </div>
      )}

      {/* Pitching Area */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative">
          <PitcherSprite isPitching={isPitching} />
          {showBall && (
            <div 
              className="absolute transition-all duration-75 pointer-events-none"
              style={{
                left: `${ballPosition.x}%`,
                top: `${ballPosition.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <BaseballSprite scale={ballScale} />
            </div>
          )}
        </div>
      </div>

      {/* Hitting Zone */}
      <div className="absolute bottom-1/4 w-full flex flex-col items-center z-10">
        <TimingGuideline />
        <div className="mt-8">
          <BatterSprite isSwinging={isSwinging} />
        </div>
      </div>

      {/* Feedback Text */}
      {feedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-bounce">
          <div className={`text-6xl font-black italic px-8 py-4 rounded-2xl shadow-2xl transform -rotate-12 ${
            feedback === 'homerun' ? 'bg-yellow-400 text-emerald-900' :
            feedback === 'hit' ? 'bg-white text-emerald-900' :
            'bg-red-600 text-white'
          }`}>
            {feedback.toUpperCase()}!
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <ResultModal 
        isVisible={gameState === 'gameover'}
        finalScore={score}
        bestScore={bestScore}
        onRestart={startGame}
      />

      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-slate-800" />
        <div className="absolute top-1/3 left-0 w-full h-2/3 bg-emerald-800" />
        <div className="absolute bottom-0 w-full h-24 bg-amber-900/50" />
      </div>
    </div>
  )
}
