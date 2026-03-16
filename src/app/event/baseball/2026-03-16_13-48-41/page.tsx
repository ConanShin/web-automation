'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// --- Types ---
interface BallProps {
  position: { x: number; y: number; z: number }
  size: string
}

interface BatProps {
  isSwinging: boolean
}

interface ChanceIndicatorProps {
  count: number
}

interface StatusHeaderProps {
  score: number
  chances: number
}

interface SwingFeedbackProps {
  result?: string
}

interface GameArenaProps {
  onSwing: () => void
  ballPosition: { x: number; y: number; z: number }
  ballSize: string
  isSwinging: boolean
  swingResult?: string
}

// --- Components ---

const Ball = ({ position, size }: BallProps) => {
  return (
    <div
      className="absolute rounded-full bg-white border-2 border-slate-300 shadow-xl transition-all duration-75"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${position.z})`,
        width: size,
        height: size,
      }}
      role="img"
      aria-label="Baseball"
    />
  )
}

const Bat = ({ isSwinging }: BatProps) => {
  return (
    <div
      className={`absolute bottom-10 origin-bottom-left transition-transform duration-100 ease-out ${
        isSwinging ? 'rotate-[45deg]' : 'rotate-[-45deg]'
      } w-4 h-32 bg-amber-800 rounded-t-full border-2 border-amber-950`}
      role="img"
      aria-label="Baseball Bat"
    />
  )
}

const ChanceIndicator = ({ count }: ChanceIndicatorProps) => {
  return (
    <div className="flex gap-2" role="status" aria-label="Remaining chances indicator">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full ${
            i < count ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-slate-600'
          } border border-slate-700`}
        />
      ))}
    </div>
  )
}

const StatusHeader = ({ score, chances }: StatusHeaderProps) => {
  return (
    <div className="w-full justify-between items-center p-6 bg-slate-800 text-white shadow-lg flex" role="banner" aria-label="Game Status Header">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Score</span>
        <span className="text-3xl font-bold font-mono">{score.toLocaleString()}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">Chances</span>
        <ChanceIndicator count={chances} />
      </div>
    </div>
  )
}

const SwingFeedback = ({ result }: SwingFeedbackProps) => {
  if (!result) return null

  const colorClass = result.toLowerCase().includes('strike') ? 'text-red-500' : 'text-yellow-400'

  return (
    <div className="absolute top-1/4 transform -translate-y-1/2 justify-center items-center w-full pointer-events-none flex" role="alert" aria-label="Swing Result Feedback">
      <span className={`text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl ${colorClass} animate-bounce`}>
        {result}
      </span>
    </div>
  )
}

const GameArena = ({
  onSwing,
  ballPosition,
  ballSize,
  isSwinging,
  swingResult,
}: GameArenaProps) => {
  return (
    <div
      className="relative flex-1 w-full bg-green-700 items-end justify-center perspective-1000 overflow-hidden flex cursor-pointer"
      onClick={onSwing}
      role="application"
      aria-label="Baseball Field"
    >
      {/* Field markings */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-800 to-green-600 opacity-50" />
      <div className="absolute top-[33%] left-0 right-0 h-2 bg-white/20" />
      <div className="absolute top-[33%] left-1/2 -translate-x-1/2 w-48 h-48 border-4 border-white/10 rounded-full" />
      
      {/* Dirt area */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-orange-900/40 rounded-[100%] blur-xl" />

      <Ball position={ballPosition} size={ballSize} />
      
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex justify-center items-center">
        <Bat isSwinging={isSwinging} />
      </div>

      <SwingFeedback result={swingResult} />
    </div>
  )
}

// --- Main Page Component ---

export default function Page() {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready')
  const [score, setScore] = useState(0)
  const [chances, setChances] = useState(3)
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 33, z: 0.1 })
  const [ballSize, setBallSize] = useState('20px')
  const [isSwinging, setIsSwinging] = useState(false)
  const [swingResult, setSwingResult] = useState<string | undefined>()
  
  const gameLoopRef = useRef<number>(null)
  const gameStateRef = useRef(gameState)
  const chancesRef = useRef(chances)

  // Sync refs with state for use in animation frame
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    chancesRef.current = chances
  }, [chances])

  const resetBall = useCallback(() => {
    setBallPosition({ x: 50, y: 33, z: 0.1 })
    setBallSize('20px')
  }, [])

  const startPitch = useCallback(() => {
    resetBall()
    setSwingResult(undefined)
  }, [resetBall])

  const handleSwing = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isSwinging) return

    setIsSwinging(true)
    setTimeout(() => setIsSwinging(false), 300)

    const timing = ballPosition.z
    let result = ''
    let points = 0

    // Timing check (z increases from 0.1 towards 2.0 when it reaches home)
    if (timing > 1.7 && timing < 2.3) {
      if (timing > 1.9 && timing < 2.1) {
        result = 'HOME RUN!'
        points = 1000
      } else if (timing > 1.8 && timing < 2.2) {
        result = '3 BASE HIT'
        points = 500
      } else {
        result = 'SINGLE'
        points = 100
      }
      setScore(s => s + points)
      setSwingResult(result)
      
      // Stop ball movement
      setBallPosition(prev => ({ ...prev, z: -2 })) 
      setTimeout(startPitch, 1500)
    } else {
      result = 'STRIKE'
      setSwingResult(result)
      setBallPosition(prev => ({ ...prev, z: -2 }))
      
      setChances(c => {
        const next = c - 1
        if (next <= 0) {
          setGameState('gameover')
          return 0
        }
        return next
      })
      
      if (chancesRef.current > 1) {
        setTimeout(startPitch, 1500)
      }
    }
  }, [isSwinging, ballPosition.z, startPitch])

  useEffect(() => {
    if (gameState === 'playing') {
      const update = () => {
        setBallPosition(prev => {
          if (prev.z === -2) return prev // Ball hit/strike handled
          
          if (prev.z > 2.5) {
            // Missed the ball (Strike)
            setSwingResult('STRIKE')
            setChances(c => {
              const next = c - 1
              if (next <= 0) {
                setGameState('gameover')
                return 0
              }
              return next
            })
            if (chancesRef.current > 1) {
              setTimeout(startPitch, 1000)
            }
            return { ...prev, z: -2 }
          }
          
          return {
            x: 50,
            y: 33 + (prev.z * 20),
            z: prev.z + 0.025
          }
        })
        gameLoopRef.current = requestAnimationFrame(update)
      }
      gameLoopRef.current = requestAnimationFrame(update)
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameState, startPitch])

  return (
    <div className="flex flex-col items-center justify-between h-screen w-full bg-slate-900 overflow-hidden relative" role="main" aria-label="Web-based Baseball Game Screen">
      <StatusHeader score={score} chances={chances} />
      
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <h1 className="text-7xl font-black text-white mb-4 drop-shadow-lg tracking-tighter">BASEBALL</h1>
          <p className="text-white/80 mb-10 text-xl font-medium">Tap the screen to swing when the ball arrives!</p>
          <button 
            onClick={() => {
              setGameState('playing')
              startPitch()
            }}
            className="px-16 py-5 bg-green-600 hover:bg-green-500 text-white text-3xl font-black rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(22,163,74,0.5)]"
          >
            PLAY BALL
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <h2 className="text-6xl font-black text-red-500 mb-2 tracking-tighter">GAME OVER</h2>
          <p className="text-3xl text-white mb-12 font-mono">Final Score: {score.toLocaleString()}</p>
          <button 
            onClick={() => {
              setScore(0)
              setChances(3)
              setGameState('playing')
              startPitch()
            }}
            className="px-16 py-5 bg-white hover:bg-slate-200 text-slate-900 text-3xl font-black rounded-full transition-all hover:scale-110 active:scale-95"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      <GameArena 
        onSwing={handleSwing}
        ballPosition={ballPosition}
        ballSize={ballSize}
        isSwinging={isSwinging}
        swingResult={swingResult}
      />
    </div>
  )
}
