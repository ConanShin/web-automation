/* eslint-disable no-undef */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * SOCCER: Web-based Rhythm Penalty Kick Game
 */

// --- Components ---

const Stadium = () => (
  <div 
    className="absolute inset-0 bg-gradient-to-t from-green-600 via-green-500 to-sky-400"
    role="img"
    aria-label="Soccer stadium"
  >
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-40 border-x-8 border-t-8 border-white/80 shadow-[0_-20px_50px_rgba(255,255,255,0.2)]">
      <div className="absolute inset-0 bg-white/5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '10px 10px' }} />
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1/2 border-t-4 border-white/30" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] border-4 border-white/20 rounded-t-full" />
    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-48 h-48 border-4 border-white/30 rounded-full" />
  </div>
);

const Goalkeeper = (props) => {
  const action = props.action;
  const getTransform = () => {
    switch (action) {
      case 'dive-left': return 'translate(-250%, 50%) rotate(-70deg)';
      case 'dive-right': return 'translate(150%, 50%) rotate(70deg)';
      case 'save-center': return 'translate(-50%, 20%) scale(1.1)';
      default: return 'translate(-50%, 50%)';
    }
  };

  return (
    <div
      className="absolute top-[35%] left-1/2 w-20 h-40 transition-all duration-300 ease-out z-10"
      style={{ transform: getTransform() }}
    >
      <div className="absolute inset-x-3 top-8 bottom-0 bg-yellow-400 rounded-t-2xl border-2 border-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-pink-200 rounded-full border-2 border-black" />
      <div className={`absolute top-10 -left-1 w-6 h-20 bg-yellow-400 border-2 border-black rounded-full origin-top transition-transform ${action !== 'idle' ? '-rotate-45' : 'rotate-12'}`} />
      <div className={`absolute top-10 -right-1 w-6 h-20 bg-yellow-400 border-2 border-black rounded-full origin-top transition-transform ${action !== 'idle' ? 'rotate-45' : '-rotate-12'}`} />
    </div>
  );
};

const Kicker = (props) => {
  const animation = props.animation;
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-64 z-30 pointer-events-none">
      <div className={`relative w-full h-full transition-all duration-300 ${animation === 'swing' ? '-rotate-12 translate-x-4' : ''}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-pink-200 rounded-full border-4 border-black" />
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-20 h-28 bg-blue-600 rounded-xl border-4 border-black" />
        <div className={`absolute top-44 left-4 w-10 h-20 bg-blue-600 border-4 border-black rounded-full origin-top transition-transform duration-150 ${animation === 'swing' ? 'rotate-[100deg]' : 'rotate-12'}`} />
        <div className={`absolute top-44 right-4 w-10 h-20 bg-blue-600 border-4 border-black rounded-full origin-top ${animation === 'swing' ? '-rotate-12' : '-rotate-6'}`} />
        <div className={`absolute top-20 -left-4 w-8 h-20 bg-pink-200 border-4 border-black rounded-full origin-top transition-transform ${animation === 'celebrate' ? '-rotate-[150deg]' : 'rotate-12'}`} />
        <div className={`absolute top-20 -right-4 w-8 h-20 bg-pink-200 border-4 border-black rounded-full origin-top transition-transform ${animation === 'celebrate' ? 'rotate-[150deg]' : '-rotate-12'}`} />
      </div>
      {animation === 'celebrate' && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl animate-bounce">⚽</div>}
    </div>
  );
};

const SoccerBall = (props) => {
  const position = props.position;
  return (
    <div
      className="absolute rounded-full w-10 h-10 bg-white border-2 border-black shadow-lg transition-all duration-75 ease-linear"
      style={{
        left: `${position.x}%`,
        bottom: `${position.y}%`,
        transform: `translate(-50%, 50%) scale(${1 - position.z / 200})`,
        zIndex: 20
      }}
    />
  );
};

const HUD = (props) => {
  const score = props.score;
  const judgment = props.judgment;
  return (
    <div className="absolute top-10 inset-x-0 flex flex-col items-center gap-4 pointer-events-none z-40">
      <div className="bg-black/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/20">
        <span className="text-white text-3xl font-black tracking-tighter">GOALS: {score}</span>
      </div>
      {judgment && (
        <div className="animate-ping">
          <span className={`text-6xl font-black italic drop-shadow-2xl ${
            judgment === 'PERFECT!' ? 'text-yellow-400' : judgment === 'GREAT!' ? 'text-green-400' : 'text-red-500'
          }`}>
            {judgment}
          </span>
        </div>
      )}
    </div>
  );
};

const GameOverlay = (props) => {
  const type = props.type;
  const onAction = props.onAction;
  const contentMap = {
    START: { title: 'STRIKER', sub: 'Tap to kick the pass!', btn: 'PLAY' },
    GOAL: { title: 'GOAL!', sub: 'Incredible timing!', btn: 'CONTINUE' },
    SAVE: { title: 'SAVED', sub: 'Missed the beat...', btn: 'RETRY' }
  };
  const content = contentMap[type];

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
      <h1 className="text-8xl font-black text-white mb-4 italic tracking-tighter drop-shadow-lg animate-in zoom-in duration-500">
        {content.title}
      </h1>
      <p className="text-white/70 text-2xl mb-12 font-bold uppercase tracking-widest">
        {content.sub}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
        className="bg-yellow-400 hover:bg-white text-black font-black py-6 px-16 rounded-full text-3xl transition-all hover:scale-110 active:scale-90 shadow-2xl"
      >
        {content.btn}
      </button>
    </div>
  );
};

// --- Main Page Component ---

export default function Page() {
  const [gameState, setGameState] = useState('LOBBY');
  const [ballPos, setBallPos] = useState({ x: 50, y: 10, z: 0 });
  const [kickerAnim, setKickerAnim] = useState('ready');
  const [gkAction, setGkAction] = useState('idle');
  const [score, setScore] = useState(0);
  const [judgment, setJudgment] = useState('');
  const [timing, setTiming] = useState(0); // 0 to 1
  
  const startTime = useRef(0);

  const startGame = useCallback(() => {
    setGameState('PASSING');
    setKickerAnim('ready');
    setGkAction('idle');
    setJudgment('');
    startTime.current = Date.now();
    setBallPos({ x: -10, y: 15, z: 0 });
  }, []);

  const handleKick = useCallback((isAutoMiss = false) => {
    if (gameState !== 'PASSING') return;

    setGameState('KICKING');
    setKickerAnim('swing');

    const timingDiff = Math.abs(timing - 0.9);
    let currentJudgment = 'MISS';
    let success = false;

    if (!isAutoMiss) {
      if (timingDiff < 0.05) {
        currentJudgment = 'PERFECT!';
        success = true;
      } else if (timingDiff < 0.15) {
        currentJudgment = 'GREAT!';
        success = true;
      }
    }

    setJudgment(currentJudgment);

    const targetX = success ? (45 + Math.random() * 10) : (30 + Math.random() * 40);
    const targetY = success ? 65 : 60;
    
    if (success) {
      const dive = Math.random() > 0.5 ? 'dive-left' : 'dive-right';
      setGkAction(dive);
      setScore((s) => s + 1);
      setTimeout(() => setKickerAnim('celebrate'), 500);
    } else {
      setGkAction('save-center');
      setTimeout(() => setKickerAnim('fail'), 500);
    }

    setTimeout(() => {
      setBallPos({ x: targetX, y: targetY, z: 100 });
    }, 100);

    setTimeout(() => {
      setGameState('RESULT');
    }, 2000);
  }, [gameState, timing]);

  useEffect(() => {
    if (gameState === 'PASSING') {
      const duration = 1500;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        
        setBallPos({
          x: -10 + (60 * progress),
          y: 15 - (5 * progress),
          z: 0
        });

        setTiming(progress);

        if (progress >= 1) {
          handleKick(true);
        }
      }, 16);
      return () => clearInterval(interval);
    }
  }, [gameState, handleKick]);

  return (
    <main 
      className="relative w-full h-screen overflow-hidden cursor-crosshair select-none"
      onClick={() => handleKick(false)}
    >
      <Stadium />
      
      {gameState === 'PASSING' && (
        <div 
          className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-32 h-32 border-8 border-yellow-400/50 rounded-full animate-pulse"
          style={{ transform: `translate(-50%, 50%) scale(${2 - timing})`, opacity: 1 - Math.abs(0.9 - timing) }}
        />
      )}

      <Goalkeeper action={gkAction} />
      <SoccerBall position={ballPos} />
      <Kicker animation={kickerAnim} />
      
      <HUD score={score} judgment={judgment} />

      {gameState === 'LOBBY' && <GameOverlay type="START" onAction={startGame} />}
      {gameState === 'RESULT' && (
        <GameOverlay 
          type={judgment === 'MISS' ? 'SAVE' : 'GOAL'} 
          onAction={startGame} 
        />
      )}

      {gameState === 'PASSING' && (
        <div className="absolute bottom-32 w-full text-center">
          <p className="text-white text-2xl font-black uppercase tracking-widest animate-bounce drop-shadow-md">
            TAP NOW!
          </p>
        </div>
      )}
    </main>
  );
}
