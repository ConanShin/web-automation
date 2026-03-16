'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// --- Types ---
type GameState = 'READY' | 'PLAYING' | 'RESULT';
type PitchPhase = 'IDLE' | 'PITCHING' | 'SWINGING';
type HitResult = 'perfect' | 'good' | 'miss' | 'none';

interface BallPosition {
  x: number;
  y: number;
  scale: number;
}

// --- Components ---

const HitZoneGuide = ({ isActive, status = 'none' }: { isActive: boolean; status?: HitResult }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'perfect': return 'border-yellow-400 bg-yellow-400/20';
      case 'good': return 'border-blue-400 bg-blue-400/20';
      case 'miss': return 'border-red-400 bg-red-400/20';
      default: return 'border-white/50 bg-white/10';
    }
  };

  return (
    <div 
      className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-12 border-4 border-dashed rounded-full animate-pulse transition-colors duration-200 ${getStatusColor()}`}
    />
  );
};

const BallSprite = ({ position }: { position: BallPosition }) => {
  return (
    <div 
      className="absolute w-6 h-6 bg-white rounded-full shadow-lg border border-gray-300 transition-transform duration-75"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${position.scale})`,
        display: position.scale <= 0 ? 'none' : 'block'
      }}
    />
  );
};

const BattingTrigger = ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => {
  return (
    <div 
      className={`absolute inset-0 w-full h-full cursor-pointer z-20 active:bg-white/5 ${disabled ? 'pointer-events-none' : ''}`}
      onClick={onClick}
    />
  );
};

const ScoreBoard = ({ score, outCount }: { score: number; outCount: number }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
      <div className="flex flex-col">
        <span className="text-sm uppercase tracking-widest text-gray-300 font-medium">Score</span>
        <span className="text-4xl font-black text-white tabular-nums drop-shadow-md">{score.toLocaleString()}</span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-sm uppercase tracking-widest text-gray-300 mb-1 font-medium">Outs</span>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`w-6 h-6 rounded-full border-2 border-white/30 transition-all duration-300 ${i <= outCount ? 'bg-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]' : 'bg-transparent'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const GameOverlay = ({ status, finalScore, onStart }: { status: 'READY' | 'GAMEOVER'; finalScore?: number; onStart: () => void }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-8 z-30 backdrop-blur-md">
      <div className="text-center">
        <h1 className="text-7xl font-black italic tracking-tighter text-white mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          {status === 'READY' ? 'BASEBALL RHYTHM' : 'GAME OVER'}
        </h1>
        {status === 'GAMEOVER' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <p className="text-2xl text-yellow-400 font-bold uppercase tracking-[0.2em] mb-1">Final Score</p>
            <p className="text-6xl text-white font-black tabular-nums drop-shadow-lg">{finalScore?.toLocaleString()}</p>
          </div>
        )}
      </div>

      <button 
        onClick={onStart}
        className="group relative px-16 py-5 bg-white text-black text-3xl font-black uppercase tracking-widest rounded-full hover:bg-yellow-400 transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_15px_40px_rgba(255,255,255,0.2)] overflow-hidden"
      >
        <span className="relative z-10">{status === 'READY' ? 'Play Ball!' : 'Try Again'}</span>
        <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>

      {status === 'READY' && (
        <div className="text-gray-400 text-base max-w-sm text-center leading-relaxed font-medium">
          <p>Tap the screen when the ball hits the <span className="text-white">target zone</span>.</p>
          <p className="mt-3 text-white/40 italic">3 Strikes and you're out!</p>
        </div>
      )}
    </div>
  );
};

const GameStage = ({ 
  phase, 
  ballPosition, 
  hitStatus,
  isSwinging 
}: { 
  phase: PitchPhase; 
  ballPosition: BallPosition; 
  hitStatus: HitResult;
  isSwinging: boolean;
}) => {
  return (
    <div className="relative w-full max-w-5xl aspect-video bg-[#2D5A27] rounded-2xl border-[12px] border-[#C2B280] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Field Details */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3a7532_0%,#2D5A27_100%)] opacity-50" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#C2B280]/10 skew-x-12 origin-bottom pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#C2B280]/10 -skew-x-12 origin-bottom pointer-events-none" />
      
      {/* Pitcher Mound */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 bg-[#C2B280]/40 rounded-[100%] blur-sm" />
      
      {/* Pitcher Sprite */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] mb-4 transition-all duration-500 ${phase === 'PITCHING' ? 'scale-110 brightness-110' : 'scale-100'}`}>
        <div className="w-14 h-28 bg-blue-900 rounded-t-3xl relative shadow-xl">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-200 rounded-full" />
          <div className={`absolute top-12 right-[-10px] w-10 h-3 bg-blue-900 rounded-full origin-left transition-transform duration-300 ${phase === 'PITCHING' ? '-rotate-[135deg]' : 'rotate-45'}`} />
          <div className="absolute top-12 left-[-10px] w-10 h-3 bg-blue-900 rounded-full origin-right rotate-[-45deg]" />
        </div>
      </div>

      {/* Batter Sprite */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-150 ${isSwinging ? 'rotate-12 translate-x-8' : ''}`}>
        <div className="w-20 h-40 bg-red-900 rounded-t-[40px] relative shadow-2xl">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-orange-200 rounded-full" />
          {/* Bat */}
          <div className={`absolute top-14 left-0 w-3 h-32 bg-[#5D2E0C] rounded-full origin-bottom transition-transform duration-150 shadow-lg ${isSwinging ? '-rotate-[140deg] scale-110' : '-rotate-45'}`}>
            <div className="absolute top-0 w-full h-1/4 bg-[#8B4513] rounded-t-full" />
          </div>
        </div>
      </div>

      {/* Game Elements */}
      <HitZoneGuide isActive={phase === 'PITCHING'} status={hitStatus} />
      <BallSprite position={ballPosition} />

      {/* Feedback Text */}
      {hitStatus !== 'none' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="animate-bounce scale-150">
            <span className={`text-8xl font-black italic uppercase tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] ${
              hitStatus === 'perfect' ? 'text-yellow-400' : 
              hitStatus === 'good' ? 'text-blue-300' : 'text-red-600'
            }`}>
              {hitStatus === 'perfect' ? 'HOME RUN!' : hitStatus === 'good' ? 'HIT!' : 'STRIKE!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page ---

export default function Page() {
  const [gameState, setGameState] = useState<GameState>('READY');
  const [pitchPhase, setPitchPhase] = useState<PitchPhase>('IDLE');
  const [score, setScore] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [ballPosition, setBallPosition] = useState<BallPosition>({ x: 50, y: 50, scale: 0 });
  const [hitStatus, setHitStatus] = useState<HitResult>('none');
  const [isSwinging, setIsSwinging] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const PITCH_DURATION = 1400; // Slightly faster for more challenge

  const startPitch = useCallback(() => {
    if (outCount >= 3) return;
    
    setPitchPhase('PITCHING');
    setHitStatus('none');
    setIsSwinging(false);
    setBallPosition({ x: 50, y: 45, scale: 0.4 });
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / PITCH_DURATION;

      if (progress < 1.1) { // Allow slight over-travel for "too late" hits
        const y = 45 + progress * 40;
        const scale = 0.4 + progress * 2.8;
        setBallPosition({ x: 50, y, scale });
        gameLoopRef.current = requestAnimationFrame(animate);
      } else {
        handleHit('miss');
      }
    };
    
    gameLoopRef.current = requestAnimationFrame(animate);
  }, [outCount]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setOutCount(0);
    setHitStatus('none');
    startPitch();
  };

  const handleHit = useCallback((result?: HitResult) => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    let finalResult: HitResult = result || 'none';
    
    if (!result) {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / PITCH_DURATION;
      
      // Optimal hit zone is around progress 0.85 to 0.95
      if (progress >= 0.88 && progress <= 0.94) {
        finalResult = 'perfect';
      } else if (progress >= 0.8 && progress <= 1.0) {
        finalResult = 'good';
      } else {
        finalResult = 'miss';
      }
    }

    setHitStatus(finalResult);
    
    if (finalResult === 'perfect') {
      setScore(s => s + 1000);
    } else if (finalResult === 'good') {
      setScore(s => s + 300);
    } else {
      setOutCount(o => {
        const next = o + 1;
        if (next >= 3) {
          setTimeout(() => setGameState('RESULT'), 1500);
        }
        return next;
      });
    }

    if (outCount < 2 || (finalResult !== 'miss' && outCount < 3)) {
      setTimeout(() => {
        setPitchPhase('IDLE');
        setTimeout(startPitch, 500);
      }, 1500);
    }
  }, [outCount, startPitch]);

  const onSwing = () => {
    if (pitchPhase !== 'PITCHING' || isSwinging || hitStatus !== 'none') return;
    setIsSwinging(true);
    handleHit();
  };

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#111] overflow-hidden flex flex-col items-center justify-center font-sans text-white select-none">
      <ScoreBoard score={score} outCount={outCount} />
      
      <GameStage 
        phase={pitchPhase} 
        ballPosition={ballPosition} 
        hitStatus={hitStatus}
        isSwinging={isSwinging}
      />
      
      {gameState === 'PLAYING' && (
        <BattingTrigger onClick={onSwing} disabled={isSwinging || hitStatus !== 'none'} />
      )}
      
      {gameState !== 'PLAYING' && (
        <GameOverlay 
          status={gameState === 'READY' ? 'READY' : 'GAMEOVER'} 
          finalScore={score} 
          onStart={startGame} 
        />
      )}

      {/* Instruction Toast */}
      {gameState === 'PLAYING' && pitchPhase === 'IDLE' && (
        <div className="absolute bottom-10 px-8 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-pulse">
          <span className="text-white/80 font-bold tracking-widest uppercase text-sm">Get Ready...</span>
        </div>
      )}
    </div>
  );
}
