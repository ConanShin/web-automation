'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---
type GameState = 'IDLE' | 'AIMING' | 'SHOOTING' | 'RESULT';
type ResultType = 'GOAL' | 'SAVE' | 'MISS';
type GKState = 'IDLE' | 'JUMP_LEFT_UP' | 'JUMP_RIGHT_UP' | 'JUMP_LEFT_DOWN' | 'JUMP_RIGHT_DOWN' | 'SAVE_SUCCESS';
type CrowdState = 'IDLE' | 'CELEBRATE' | 'DISAPPOINT';

// --- Constants ---
const BALL_START_POS = { x: 50, y: 85 }; // Percentage from left, top
const GOAL_POS = { top: 15, left: 50, width: 30, height: 25 }; // In percentage of arena

// --- Main Page ---

export default function Page() {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [result, setResult] = useState<ResultType | null>(null);
  const [pScore, setPScore] = useState(0);
  const [gkScore, setGkScore] = useState(0);
  const [gkState, setGkState] = useState<GKState>('IDLE');
  const [crowdState, setCrowdState] = useState<CrowdState>('IDLE');

  // Ball State
  const [ballPos, setBallPos] = useState(BALL_START_POS);
  const [ballScale, setBallScale] = useState(1);
  const [ballRotation, setBallRotation] = useState(0);
  
  // Aiming State
  const [aimPos, setAimPos] = useState({ x: 50, y: 50 });
  const arenaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  const resetBall = useCallback(() => {
    setBallPos(BALL_START_POS);
    setBallScale(1);
    setBallRotation(0);
    setGkState('IDLE');
    setCrowdState('IDLE');
    setGameState('IDLE');
    setResult(null);
  }, []);

  const updateAim = (clientX: number, clientY: number) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setAimPos({ x, y });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameState !== 'IDLE') return;
    setGameState('AIMING');
    updateAim(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'IDLE') return;
    setGameState('AIMING');
    updateAim(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState === 'AIMING') {
      updateAim(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState === 'AIMING') {
      updateAim(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const shoot = () => {
    if (gameState !== 'AIMING') return;
    setGameState('SHOOTING');

    const targetX = aimPos.x;
    const targetY = aimPos.y;
    
    let startTime: number | null = null;
    const duration = 800; // ms

    // GK AI Logic
    const decideGKReaction = () => {
      const gkX = 50; // Central
      const gkY = 35; // Goal level
      
      // If target is within goal area
      if (targetX > GOAL_POS.left - GOAL_POS.width / 2 && 
          targetX < GOAL_POS.left + GOAL_POS.width / 2 &&
          targetY > GOAL_POS.top && 
          targetY < GOAL_POS.top + GOAL_POS.height) {
        
        const diffX = targetX - gkX;
        if (diffX < -5) return targetY < 25 ? 'JUMP_LEFT_UP' : 'JUMP_LEFT_DOWN';
        if (diffX > 5) return targetY < 25 ? 'JUMP_RIGHT_UP' : 'JUMP_RIGHT_DOWN';
        return 'IDLE';
      }
      return 'IDLE';
    };

    const reaction = decideGKReaction() as GKState;
    
    // Delay GK reaction slightly
    setTimeout(() => {
      setGkState(reaction);
    }, 100);

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = (time - startTime) / duration;

      if (progress < 1) {
        // Linear interpolation for X, Y movement towards target
        const curX = BALL_START_POS.x + (targetX - BALL_START_POS.x) * progress;
        const curY = BALL_START_POS.y + (targetY - BALL_START_POS.y) * progress;
        
        // Arc effect: Subtract height based on progress (parabola)
        const arcHeight = Math.sin(progress * Math.PI) * 15;
        
        setBallPos({ x: curX, y: curY - arcHeight });
        setBallScale(1 - progress * 0.6);
        setBallRotation(progress * 720);
        
        /* eslint-disable no-undef */
        requestRef.current = requestAnimationFrame(animate);
      } else {
        checkResult(targetX, targetY, reaction);
      }
    };

    /* eslint-disable no-undef */
    requestRef.current = requestAnimationFrame(animate);
  };

  const checkResult = (tx: number, ty: number, gkAction: GKState) => {
    const isInGoal = tx > GOAL_POS.left - GOAL_POS.width / 2 && 
                     tx < GOAL_POS.left + GOAL_POS.width / 2 &&
                     ty > GOAL_POS.top && 
                     ty < GOAL_POS.top + GOAL_POS.height;

    let saved = false;
    const gkReachX = 8;
    const gkReachY = 10;
    let gkFinalX = 50;
    let gkFinalY = 30;

    if (gkAction.includes('LEFT')) gkFinalX -= 12;
    if (gkAction.includes('RIGHT')) gkFinalX += 12;
    if (gkAction.includes('UP')) gkFinalY -= 8;
    if (gkAction.includes('DOWN')) gkFinalY += 5;

    const dx = Math.abs(tx - gkFinalX);
    const dy = Math.abs(ty - gkFinalY);

    if (isInGoal && dx < gkReachX && dy < gkReachY) {
      saved = true;
    }

    if (saved) {
      setResult('SAVE');
      setGkScore(s => s + 1);
      setGkState('SAVE_SUCCESS');
      setCrowdState('DISAPPOINT');
    } else if (isInGoal) {
      setResult('GOAL');
      setPScore(s => s + 1);
      setCrowdState('CELEBRATE');
    } else {
      setResult('MISS');
      setCrowdState('DISAPPOINT');
    }
    setGameState('RESULT');
  };

  useEffect(() => {
    /* eslint-disable no-undef */
    const currentRequest = requestRef.current;
    return () => cancelAnimationFrame(currentRequest);
  }, []);

  return (
    <div 
      ref={arenaRef}
      className="relative w-full h-screen bg-slate-950 overflow-hidden select-none cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={shoot}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={shoot}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gentle-sway {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes head-shake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes scale-in-center {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-gentle-sway { animation: gentle-sway 2s ease-in-out infinite; }
        .animate-head-shake { animation: head-shake 0.5s ease-in-out infinite; }
        .animate-scale-in { animation: scale-in-center 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        
        body {
          margin: 0;
          background-color: #020617;
          color: white;
          font-family: sans-serif;
        }
      ` }} />

      {/* Stadium & Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-emerald-900/20" />
      
      {/* Crowd */}
      <div className="absolute top-0 w-full h-1/3 flex justify-around items-end opacity-60 px-4 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-8 bg-slate-400 rounded-t-full transition-all duration-500 ${
              crowdState === 'CELEBRATE' 
                ? 'animate-bounce bg-emerald-400' 
                : crowdState === 'DISAPPOINT' 
                ? 'animate-head-shake bg-rose-400' 
                : 'animate-gentle-sway'
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>

      {/* Pitch */}
      <div className="absolute bottom-0 w-full h-2/3 bg-emerald-950/40 border-t border-emerald-500/20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] border-2 border-white/10 rounded-full -translate-y-1/2" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/20 rounded-full" />
        
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 border-x-8 border-t-8 border-white/80 shadow-[0_-20px_50px_rgba(255,255,255,0.1)] z-10"
          style={{ width: '600px', height: '300px' }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        </div>
      </div>

      {/* Scoreboard */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 flex gap-8 px-10 py-4 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-xl shadow-2xl z-40">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Player</span>
          <span className="text-emerald-400 font-mono font-bold text-4xl tracking-tighter">{pScore}</span>
        </div>
        <div className="text-white/40 text-4xl font-bold flex items-center">:</div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Keeper</span>
          <span className="text-rose-400 font-mono font-bold text-4xl tracking-tighter">{gkScore}</span>
        </div>
      </div>

      {/* Goalkeeper */}
      <div 
        className={`absolute w-24 h-48 transition-all duration-300 ease-out z-20 pointer-events-none ${
          gkState === 'IDLE' ? 'bottom-[320px] left-1/2 -translate-x-1/2' :
          gkState === 'JUMP_LEFT_UP' ? 'bottom-[420px] left-[calc(50%-150px)] -rotate-45' :
          gkState === 'JUMP_RIGHT_UP' ? 'bottom-[420px] left-[calc(50%+150px)] rotate-45' :
          gkState === 'JUMP_LEFT_DOWN' ? 'bottom-[280px] left-[calc(50%-150px)] -rotate-90' :
          gkState === 'JUMP_RIGHT_DOWN' ? 'bottom-[280px] left-[calc(50%+150px)] rotate-90' :
          gkState === 'SAVE_SUCCESS' ? 'bottom-[350px] left-1/2 -translate-x-1/2 scale-110' : ''
        }`}
      >
        <div className={`w-full h-full rounded-full shadow-2xl border-4 border-white/20 transition-colors ${gkState === 'SAVE_SUCCESS' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-orange-200 rounded-full" />
          <div className="absolute top-20 left-0 w-full h-4 bg-white/20" />
        </div>
      </div>

      {/* Soccer Ball */}
      <div 
        className="absolute w-12 h-12 z-30 pointer-events-none transition-transform duration-75"
        style={{ 
          left: `${ballPos.x}%`, 
          top: `${ballPos.y}%`, 
          transform: `translate(-50%, -50%) scale(${ballScale}) rotate(${ballRotation}deg)` 
        }}
      >
        <div className="w-full h-full bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden">
          <div className="grid grid-cols-2 gap-1 w-full h-full p-1 rotate-45">
            <div className="bg-black/80 rounded-sm" />
            <div className="bg-black/80 rounded-sm" />
            <div className="bg-black/80 rounded-sm" />
            <div className="bg-black/80 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Aim Indicator */}
      {gameState === 'AIMING' && (
        <>
          <div 
            className="absolute pointer-events-none z-10"
            style={{ left: `${aimPos.x}%`, top: `${aimPos.y}%` }}
          >
            <div className="w-16 h-16 border-4 border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping" />
            <div className="w-4 h-4 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line 
              x1={`${BALL_START_POS.x}%`} 
              y1={`${BALL_START_POS.y}%`} 
              x2={`${aimPos.x}%`} 
              y2={`${aimPos.y}%`} 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="2" 
              strokeDasharray="8,8"
            />
          </svg>
        </>
      )}

      {/* UI Hints */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 text-slate-400 font-sans text-sm tracking-widest uppercase opacity-50">
        {gameState === 'IDLE' ? 'Drag to aim, release to shoot' : gameState === 'AIMING' ? 'Release to shoot' : ''}
      </div>

      {/* Result Overlay */}
      {gameState === 'RESULT' && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="p-16 rounded-[40px] border border-white/20 bg-white/5 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-8 animate-scale-in">
            <h2 className={`font-sans font-black text-8xl italic uppercase tracking-widest ${
              result === 'GOAL' ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]'
            }`}>
              {result === 'GOAL' ? 'Goal!' : result === 'SAVE' ? 'Saved!' : 'Missed!'}
            </h2>
            <button
              onClick={resetBall}
              className="px-12 py-6 rounded-full bg-emerald-500 text-black font-bold text-2xl hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
