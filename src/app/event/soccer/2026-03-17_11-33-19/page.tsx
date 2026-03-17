'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * SOCCER: Rhythm Penalty Challenge
 * A web-based rhythm penalty kick game.
 */

// --- Types ---

type GameState = 'idle' | 'approaching' | 'striking' | 'goal' | 'saved'
type GoalkeeperState = 'idle' | 'dive_left' | 'dive_right' | 'block' | 'catch'
type StrikerAnimation = 'idle' | 'windup' | 'kick_success' | 'kick_fail'

interface Feedback {
  timing?: string
  goal?: string
}

// --- Components ---

const TargetZone = () => (
  <div className="w-16 h-16 border-4 border-white/50 rounded-full" />
)

const ShrinkingRing = ({ scale }: { scale: number }) => (
  <div 
    className="absolute border-4 border-yellow-400 rounded-full transition-transform duration-100 ease-linear"
    style={{ 
      width: '100%', 
      height: '100%',
      transform: `scale(${scale})` 
    }}
  />
)

const RhythmIndicator = ({ scale }: { scale: number }) => (
  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 items-center justify-center w-48 h-48 flex">
    <TargetZone />
    <ShrinkingRing scale={scale} />
  </div>
)

const SoccerBall = ({ style }: { style: React.CSSProperties }) => (
  <div 
    style={style}
    className="absolute w-12 h-12 rounded-full bg-white shadow-xl z-30 flex items-center justify-center overflow-hidden border border-gray-200"
  >
    <div className="w-full h-full relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-sm transform rotate-45" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-sm transform rotate-45" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-sm transform rotate-45" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-sm transform rotate-45" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-black rounded-full" />
    </div>
  </div>
)

const Goalkeeper = ({ state }: { state: GoalkeeperState }) => {
  const getTransform = () => {
    switch (state) {
      case 'dive_left': return '-translate-x-40 translate-y-10 rotate-[-45deg]'
      case 'dive_right': return 'translate-x-20 translate-y-10 rotate-[45deg]'
      case 'block': return '-translate-x-1/2 scale-110 -translate-y-5'
      case 'catch': return '-translate-x-1/2 scale-90 translate-y-2'
      default: return '-translate-x-1/2'
    }
  }

  return (
    <div 
      className={`absolute bottom-[42%] left-1/2 w-20 h-28 transition-all duration-300 ease-out z-10 ${getTransform()}`}
    >
      <div className="w-full h-full bg-red-600 rounded-lg relative overflow-hidden flex flex-col items-center pt-2">
        <div className="w-8 h-8 bg-orange-200 rounded-full mb-1" />
        <div className="w-12 h-14 bg-red-700 rounded-sm" />
        <div className="absolute top-8 -left-2 w-4 h-12 bg-red-600 rounded-full origin-top rotate-[20deg]" />
        <div className="absolute top-8 -right-2 w-4 h-12 bg-red-600 rounded-full origin-top -rotate-[20deg]" />
        <div className="absolute bottom-2 -left-4 w-6 h-6 bg-white rounded-md" />
        <div className="absolute bottom-2 -right-4 w-6 h-6 bg-white rounded-md" />
      </div>
    </div>
  )
}

const Striker = ({ animation }: { animation: StrikerAnimation }) => {
  const getAnimationClass = () => {
    switch (animation) {
      case 'windup': return 'translate-y-2 scale-y-95'
      case 'kick_success': return '-translate-y-4 scale-110'
      case 'kick_fail': return 'translate-y-2 rotate-[10deg] opacity-80'
      default: return ''
    }
  }

  return (
    <div 
      className={`absolute bottom-12 left-1/2 -translate-x-1/2 w-36 h-52 z-20 transition-all duration-200 ${getAnimationClass()}`}
    >
      <div className="w-full h-full relative flex flex-col items-center">
        <div className="w-12 h-12 bg-orange-200 rounded-full mb-1" />
        <div className="w-20 h-24 bg-blue-600 rounded-md" />
        <div className="flex gap-4 -mt-2">
          <div className={`w-6 h-20 bg-blue-800 rounded-full origin-top transition-transform duration-200 ${animation === 'kick_success' ? '-rotate-[60deg]' : ''}`} />
          <div className="w-6 h-20 bg-blue-800 rounded-full" />
        </div>
      </div>
    </div>
  )
}

const StadiumBackground = () => (
  <div 
    className="absolute inset-0 bg-gradient-to-b from-sky-400 via-green-500 to-green-700"
    role="img"
    aria-label="Soccer stadium with a goal post"
  >
    <div className="absolute bottom-[40%] left-1/2 -translate-x-1/2 w-[60%] h-48 border-x-8 border-t-8 border-white rounded-t-sm shadow-2xl">
      <div className="w-full h-full opacity-20 bg-[linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>
    <div className="absolute bottom-0 left-0 w-full h-[40%] border-t-4 border-white opacity-40">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 border-4 border-white rounded-full -translate-y-1/2" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full border-x-4 border-white" />
    </div>
  </div>
)

const FeedbackHUD = ({ timing, goal }: Feedback) => (
  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-40">
    {timing && (
      <div className="text-4xl font-black italic text-yellow-300 drop-shadow-lg uppercase tracking-tighter animate-bounce">
        {timing}
      </div>
    )}
    {goal && (
      <div className="text-6xl font-black text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] uppercase animate-pulse">
        {goal}
      </div>
    )}
  </div>
)

const GameOverlay = ({ title, buttonLabel, onButtonClick }: { title: string, buttonLabel: string, onButtonClick: (e: React.MouseEvent) => void }) => (
  <div className="absolute inset-0 bg-black/70 z-50 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
    <h1 className="text-5xl font-black text-yellow-400 mb-8 drop-shadow-lg uppercase">
      {title}
    </h1>
    <button 
      onClick={onButtonClick}
      className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold text-xl rounded-full shadow-2xl transition-transform active:scale-95"
    >
      {buttonLabel}
    </button>
  </div>
)

// --- Main Page ---

export default function Page() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [goalkeeperState, setGoalkeeperState] = useState<GoalkeeperState>('idle')
  const [strikerAnimation, setStrikerAnimation] = useState<StrikerAnimation>('idle')
  const [feedback, setFeedback] = useState<Feedback>({})
  const [ballStyle, setBallStyle] = useState<React.CSSProperties>({ bottom: '15%', left: '-10%' })
  const [ringScale, setRingScale] = useState(1.0)
  
  const ringInterval = useRef<NodeJS.Timeout | null>(null)
  const startTime = useRef<number>(0)

  const handleKick = useCallback((isAutoMiss = false) => {
    if (gameState !== 'approaching') return
    
    if (ringInterval.current) clearInterval(ringInterval.current)
    setGameState('striking')

    // Determine accuracy: Sweet spot is around scale 0.1 to 0.3
    let accuracy = 'MISS'
    if (!isAutoMiss) {
      if (ringScale >= 0.1 && ringScale <= 0.3) accuracy = 'PERFECT'
      else if (ringScale > 0 && ringScale <= 0.5) accuracy = 'GREAT'
    }

    if (accuracy === 'MISS') {
      setStrikerAnimation('kick_fail')
      setGoalkeeperState('block')
      setFeedback({ timing: 'MISS', goal: 'SAVED!' })
      setGameState('saved')
      setBallStyle({ 
        bottom: '45%', 
        left: '50%', 
        transform: 'translate(-50%, 0) scale(0.8)',
        transition: 'all 0.3s ease-out' 
      })
    } else {
      setStrikerAnimation('kick_success')
      setFeedback({ timing: accuracy, goal: 'GOAL!!' })
      const dive = Math.random() > 0.5 ? 'dive_left' : 'dive_right'
      setGoalkeeperState(dive)
      setGameState('goal')
      // Ball goes to corner
      const targetLeft = dive === 'dive_left' ? '75%' : '25%'
      setBallStyle({ 
        bottom: '55%', 
        left: targetLeft, 
        transform: 'translate(-50%, 0) scale(0.5)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
      })
    }
  }, [gameState, ringScale])

  const startGame = () => {
    setGameState('approaching')
    setGoalkeeperState('idle')
    setStrikerAnimation('idle')
    setFeedback({})
    setBallStyle({ bottom: '15%', left: '-10%' })
    setRingScale(1.0)
    startTime.current = Date.now()

    // Start ball movement after a short delay
    setTimeout(() => {
      setBallStyle({ 
        bottom: '15%', 
        left: '50%', 
        transition: 'left 2s linear, bottom 2s linear' 
      })
    }, 50)
  }

  // Ring shrink logic
  useEffect(() => {
    if (gameState === 'approaching') {
      ringInterval.current = setInterval(() => {
        const elapsed = Date.now() - startTime.current
        const duration = 2000 // Match ball travel time
        const newScale = Math.max(0, 1 - (elapsed / duration))
        setRingScale(newScale)
        
        if (elapsed >= duration) {
          // Auto-miss if no interaction
          handleKick(true)
        }
      }, 16)
    } else {
      if (ringInterval.current) clearInterval(ringInterval.current)
    }
    return () => {
      if (ringInterval.current) clearInterval(ringInterval.current)
    }
  }, [gameState, handleKick])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handleKick()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, ringScale])

  return (
    <div 
      className="relative w-full h-screen overflow-hidden select-none cursor-pointer"
      onClick={() => handleKick()}
    >
      <StadiumBackground />
      <Goalkeeper state={goalkeeperState} />
      <SoccerBall style={ballStyle} />
      <Striker animation={strikerAnimation} />
      
      {gameState === 'approaching' && (
        <RhythmIndicator scale={ringScale} />
      )}

      {(gameState === 'goal' || gameState === 'saved') && (
        <FeedbackHUD timing={feedback.timing} goal={feedback.goal} />
      )}

      {(gameState === 'idle' || gameState === 'goal' || gameState === 'saved') && (
        <GameOverlay 
          title={gameState === 'idle' ? "Rhythm Penalty" : feedback.goal === 'GOAL!!' ? "VICTORY!" : "DEFEAT"}
          buttonLabel={gameState === 'idle' ? "START" : "RETRY"}
          onButtonClick={(e) => {
            e.stopPropagation()
            startGame()
          }}
        />
      )}
      
      {/* Help Text */}
      {gameState === 'approaching' && (
        <div className="absolute bottom-10 w-full text-center text-white/50 text-xl font-bold animate-pulse pointer-events-none">
          TAP OR PRESS SPACE ON THE BEAT!
        </div>
      )}
    </div>
  )
}
