'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Interfaces ---
interface GameHeaderProps {
  score: number;
  outCount: number;
  maxOuts?: number;
  baseStatus: { first: boolean; second: boolean; third: boolean };
}

interface ScoreDisplayProps {
  score: number;
}

interface BaseDiagramProps {
  first: boolean;
  second: boolean;
  third: boolean;
}

interface OutCountIndicatorProps {
  outCount: number;
  maxOuts?: number;
}

interface GameFieldProps {
  gameState: 'start' | 'idle' | 'pitching' | 'hit' | 'strike' | 'result';
  pitchSpeed?: number;
  pitchProgress: number;
}

interface PitcherSpriteProps {
  isPitching: boolean;
}

interface BallTrajectoryProps {
  isVisible: boolean;
  pitchDuration: number;
  progress: number;
}

interface TimingGaugeProps {
  isActive: boolean;
  progress: number;
  sweetSpotStart: number;
  sweetSpotEnd: number;
}

interface BattingZoneProps {
  onBat: (forceProgress?: number) => void;
  isDisabled?: boolean;
  swingState: 'idle' | 'swinging' | 'hit' | 'miss' | 'disabled';
}

interface BatterSpriteProps {
  swingState: 'idle' | 'swinging' | 'hit' | 'miss' | 'disabled';
}

interface BatSwingFeedbackProps {
  result: 'homerun' | 'triple' | 'double' | 'single' | 'strike' | null;
  isVisible: boolean;
}

interface TapHintLabelProps {
  isHighlighted: boolean;
}

interface GameResultOverlayProps {
  isVisible: boolean;
  finalScore: number;
  resultSummary: { homerun: number; triple: number; double: number; single: number; strike: number };
  onRestart: () => void;
}

interface ResultTitleProps {
  grade: 'excellent' | 'good' | 'average' | 'poor';
}

interface FinalScoreDisplayProps {
  score: number;
}

interface ResultSummaryCardProps {
  homerun: number;
  triple: number;
  double: number;
  single: number;
  strike: number;
}

interface RestartButtonProps {
  onClick: () => void;
}

interface StartScreenProps {
  onStart: () => void;
  isVisible: boolean;
}

interface StartButtonProps {
  onClick: () => void;
}

// --- Atoms ---
const FieldBackground: React.FC = () => (
  <div className="absolute inset-0 w-full h-full pointer-events-none">
    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.03)_40px,rgba(255,255,255,0.03)_41px)]" />
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-48 border-2 border-white/20 rotate-45" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-yellow-800/40 border border-yellow-700/30" />
  </div>
);

const PitcherSprite: React.FC<PitcherSpriteProps> = ({ isPitching }) => (
  <div className={`absolute top-[20%] left-1/2 -translate-x-1/2 flex items-center justify-center w-16 h-16 ${isPitching ? 'animate-bounce' : ''}`}>
    <span className="text-5xl">🤾</span>
  </div>
);

const BatterSprite: React.FC<BatterSpriteProps> = ({ swingState }) => {
  let content = '🧍🏏';
  let tw = 'w-20 h-20 flex items-center justify-center text-5xl transition-all';
  
  if (swingState === 'swinging') {
    content = '🏌️';
    tw += ' -rotate-45 scale-110';
  } else if (swingState === 'hit') {
    content = '🏌️💥';
    tw += ' scale-125';
  } else if (swingState === 'miss') {
    content = '🤦🏏';
    tw += ' opacity-70 rotate-12';
  }

  return (
    <div className="w-24 h-24 flex items-center justify-center">
      <div className={tw}>{content}</div>
    </div>
  );
};

const BatSwingFeedback: React.FC<BatSwingFeedbackProps> = ({ result, isVisible }) => {
  if (!isVisible || !result) return null;
  
  const config: Record<string, { text: string, color: string }> = {
    homerun: { text: "HOMERUN", color: "text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.9)] text-5xl animate-bounce" },
    triple: { text: "TRIPLE", color: "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] text-4xl animate-bounce" },
    double: { text: "DOUBLE", color: "text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.8)] text-4xl" },
    single: { text: "SINGLE", color: "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] text-3xl" },
    strike: { text: "STRIKE", color: "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] text-3xl" },
  };

  const { text, color } = config[result] || config.strike;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
      <div className={`flex flex-col items-center gap-1 transition-all duration-300 scale-110`}>
        <span className={`font-black tracking-widest ${color}`}>
          {text}
        </span>
      </div>
    </div>
  );
};

const TapHintLabel: React.FC<TapHintLabelProps> = ({ isHighlighted }) => (
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
    <span className={isHighlighted 
      ? "text-base text-yellow-400 font-bold tracking-widest drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" 
      : "text-sm text-gray-500 font-medium tracking-wider animate-pulse"}>
      TAP!
    </span>
  </div>
);

const ResultTitle: React.FC<ResultTitleProps> = ({ grade }) => {
  const config = {
    excellent: { emoji: "🏆", text: "홈런왕!", tw: "text-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.8)]" },
    good: { emoji: "⚾", text: "훌륭해요!", tw: "text-green-400" },
    average: { emoji: "👏", text: "분전했어요!", tw: "text-blue-400" },
    poor: { emoji: "💪", text: "다시 도전!", tw: "text-gray-300" },
  };
  const { emoji, text, tw } = config[grade];
  return (
    <div className="flex flex-col items-center gap-2 mb-4">
      <span className="text-6xl">{emoji}</span>
      <h1 className={`text-4xl font-black ${tw}`}>{text}</h1>
    </div>
  );
};

const RestartButton: React.FC<RestartButtonProps> = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-950 text-lg font-black tracking-wide shadow-[0_4px_24px_rgba(250,204,21,0.4)] active:scale-95 transition-transform duration-100 hover:shadow-[0_4px_32px_rgba(250,204,21,0.6)] flex items-center justify-center gap-2 cursor-pointer"
  >
    <span>⚾</span> 다시 도전하기
  </button>
);

const GameLogoTitle: React.FC = () => (
  <div className="flex flex-col items-center gap-2 text-center">
    <span className="text-7xl mb-2">⚾</span>
    <h1 className="text-4xl font-black text-white tracking-tight">야구 타이밍 게임</h1>
    <span className="text-sm text-gray-400 font-medium tracking-widest uppercase">Tap on Beat · Hit the Ball</span>
  </div>
);

const StartButton: React.FC<StartButtonProps> = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="w-full max-w-sm py-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-950 text-xl font-black tracking-wide shadow-[0_6px_32px_rgba(250,204,21,0.45)] active:scale-95 transition-all duration-150 hover:shadow-[0_8px_40px_rgba(250,204,21,0.6)] flex items-center justify-center gap-2 cursor-pointer"
  >
    <span>⚾</span> 게임 시작!
  </button>
);

// --- Molecules ---
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Score</span>
    <span className="text-4xl font-black tabular-nums text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]">
      {score}
    </span>
  </div>
);

const BaseIcon = ({ occupied }: { occupied: boolean }) => (
  <div className={`w-4 h-4 rotate-45 border-2 ${
    occupied 
      ? 'border-yellow-400 bg-yellow-400 shadow-[0_0_6px_2px_rgba(250,204,21,0.5)]' 
      : 'border-gray-600 bg-transparent'
  }`} />
);

const BaseDiagram: React.FC<BaseDiagramProps> = ({ first, second, third }) => {
  return (
    <div className="grid grid-cols-3 grid-rows-2 w-16 h-12 place-items-center relative">
      <div className="col-start-2 row-start-1"><BaseIcon occupied={second} /></div>
      <div className="col-start-1 row-start-2"><BaseIcon occupied={third} /></div>
      <div className="col-start-3 row-start-2"><BaseIcon occupied={first} /></div>
    </div>
  );
};

const OutCountIndicator: React.FC<OutCountIndicatorProps> = ({ outCount, maxOuts = 3 }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Out</span>
      <div className="flex gap-1.5">
        {Array.from({ length: maxOuts }).map((_, i) => (
          <div 
            key={i} 
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
              i < outCount 
                ? 'border-red-500 bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]' 
                : 'border-gray-500 bg-transparent'
            }`} 
          />
        ))}
      </div>
    </div>
  );
};

const BallTrajectory: React.FC<BallTrajectoryProps> = ({ isVisible, progress }) => {
  if (!isVisible) return null;
  const top = 22 + (90 - 22) * progress;
  const left = 48 + (44 - 48) * progress;
  const size = 12 + (40 - 12) * progress;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div 
        className="absolute rounded-full bg-white border border-gray-300 shadow-lg"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="absolute inset-0 border-2 border-red-400 rounded-full rotate-45 opacity-50"></div>
      </div>
    </div>
  );
};

const TimingGauge: React.FC<TimingGaugeProps> = ({ isActive, progress, sweetSpotStart, sweetSpotEnd }) => (
  <div className={`absolute bottom-28 left-1/2 -translate-x-1/2 w-4/5 max-w-sm flex flex-col items-center gap-2 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
    <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Timing</span>
    <div className="relative w-full h-4 rounded-full bg-gray-700/70 backdrop-blur-sm overflow-hidden border border-gray-600/50">
      <div 
        className="absolute top-0 h-full bg-yellow-400/30 border border-yellow-400/60"
        style={{ left: `${sweetSpotStart * 100}%`, width: `${(sweetSpotEnd - sweetSpotStart) * 100}%` }}
      />
      <div 
        className="h-full rounded-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all duration-75"
        style={{ width: `${progress * 100}%` }}
      />
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        style={{ left: `${progress * 100}%`, transform: 'translate(-50%, -50%)' }}
      />
    </div>
  </div>
);

const FinalScoreDisplay: React.FC<FinalScoreDisplayProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const duration = 1200;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.floor(score * easeProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayScore(score);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-1 mb-6">
      <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Final Score</span>
      <div className="flex items-baseline gap-2">
        <span className="text-7xl font-black tabular-nums text-white">{displayScore}</span>
        <span className="text-xl text-gray-400 font-medium">pts</span>
      </div>
    </div>
  );
};

const ResultSummaryCard: React.FC<ResultSummaryCardProps> = ({ homerun, triple, double, single, strike }) => {
  const rows = [
    { key: "homerun", label: "홈런", icon: "🏆", valueColor: "text-yellow-400", value: homerun },
    { key: "triple", label: "3루타", icon: "🔥", valueColor: "text-orange-400", value: triple },
    { key: "double", label: "2루타", icon: "⚡", valueColor: "text-green-400", value: double },
    { key: "single", label: "1루타", icon: "⚾", valueColor: "text-blue-400", value: single },
    { key: "strike", label: "스트라이크", icon: "❌", valueColor: "text-red-400", value: strike }
  ];

  return (
    <div className="w-full max-w-xs bg-gray-800/70 rounded-2xl border border-gray-700 p-5 mb-6 backdrop-blur-sm">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors px-2 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-lg w-6 text-center">{row.icon}</span>
            <span>{row.label}</span>
          </div>
          <span className={`text-base font-bold ${row.valueColor}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
};

const RulesSummaryCard: React.FC = () => {
  const ruleItems = [
    { icon: "🏆", label: "홈런", description: "가장 빠른 타이밍 (퍼펙트)", color: "text-yellow-400" },
    { icon: "🔥", label: "3루타", description: "타이밍이 조금 빠름", color: "text-orange-400" },
    { icon: "⚡", label: "2루타", description: "타이밍이 약간 늦음", color: "text-green-400" },
    { icon: "⚾", label: "1루타", description: "타이밍이 꽤 늦음", color: "text-blue-400" },
    { icon: "❌", label: "스트라이크", description: "타이밍 완전 실패", color: "text-red-400" }
  ];

  return (
    <div className="w-full max-w-sm bg-gray-800/60 rounded-2xl border border-gray-700 p-5 backdrop-blur-sm">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">판정 기준</h3>
      <div className="flex flex-col gap-1">
        {ruleItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 py-1.5 hover:bg-gray-700/40 transition-colors px-2 rounded-lg">
            <span className="text-xl w-7 text-center">{item.icon}</span>
            <span className={`text-sm font-bold w-16 ${item.color}`}>{item.label}</span>
            <span className="text-xs text-gray-400">{item.description}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-center gap-2 text-sm text-gray-300">
        기회는 총 3번 (3아웃 게임)
      </div>
    </div>
  );
};

// --- Organisms ---
const GameHeader: React.FC<GameHeaderProps> = ({ score, outCount, maxOuts = 3, baseStatus }) => (
  <header className="flex items-center justify-between w-full px-4 py-3 bg-gray-900 border-b border-gray-700 z-10">
    <ScoreDisplay score={score} />
    <BaseDiagram {...baseStatus} />
    <OutCountIndicator outCount={outCount} maxOuts={maxOuts} />
  </header>
);

const GameField: React.FC<GameFieldProps> = ({ gameState, pitchProgress }) => (
  <div className="relative flex-1 w-full bg-gradient-to-b from-sky-900 via-green-900 to-green-800 overflow-hidden min-h-[50vh]">
    <FieldBackground />
    <PitcherSprite isPitching={gameState === 'pitching'} />
    <BallTrajectory isVisible={gameState === 'pitching'} pitchDuration={1500} progress={pitchProgress} />
    <TimingGauge 
      isActive={gameState === 'pitching'} 
      progress={pitchProgress} 
      sweetSpotStart={0.78} 
      sweetSpotEnd={0.82} 
    />
  </div>
);

const BattingZone: React.FC<BattingZoneProps> = ({ onBat, isDisabled, swingState }) => (
  <div 
    className={`relative w-full flex items-center justify-center py-4 bg-gray-950/80 border-t border-gray-800 select-none h-32 md:h-40 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer active:bg-gray-900/80'}`}
    onClick={() => !isDisabled && onBat()}
    onTouchStart={(e) => {
      e.preventDefault();
      if (!isDisabled) onBat();
    }}
  >
    <BatterSprite swingState={swingState} />
    <TapHintLabel isHighlighted={swingState === 'idle'} />
  </div>
);

const GameResultOverlay: React.FC<GameResultOverlayProps> = ({ isVisible, finalScore, resultSummary, onRestart }) => {
  if (!isVisible) return null;
  let grade: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
  if (finalScore >= 10) grade = 'excellent';
  else if (finalScore >= 5) grade = 'good';
  else if (finalScore >= 1) grade = 'average';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm px-6">
      <ResultTitle grade={grade} />
      <FinalScoreDisplay score={finalScore} />
      <ResultSummaryCard {...resultSummary} />
      <RestartButton onClick={onRestart} />
    </div>
  );
};

// --- Templates ---
const StartScreen: React.FC<StartScreenProps> = ({ onStart, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-950 px-6 gap-8">
      <GameLogoTitle />
      <RulesSummaryCard />
      <StartButton onClick={onStart} />
    </div>
  );
};

// --- Page ---
export default function Page() {
  const [gameState, setGameState] = useState<'start' | 'idle' | 'pitching' | 'result'>('start');
  const [score, setScore] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [baseStatus, setBaseStatus] = useState({ first: false, second: false, third: false });
  const [resultSummary, setResultSummary] = useState({ homerun: 0, triple: 0, double: 0, single: 0, strike: 0 });
  const [pitchProgress, setPitchProgress] = useState(0);
  const [swingState, setSwingState] = useState<'idle' | 'swinging' | 'hit' | 'miss' | 'disabled'>('idle');
  const [swingResult, setSwingResult] = useState<'homerun' | 'triple' | 'double' | 'single' | 'strike' | null>(null);

  const pitchDuration = 1500;
  const pitchProgressRef = useRef(0);
  const swingStateRef = useRef(swingState);
  swingStateRef.current = swingState;
  const outCountRef = useRef(outCount);
  useEffect(() => { outCountRef.current = outCount; }, [outCount]);

  const startGame = useCallback(() => {
    setScore(0);
    setOutCount(0);
    setBaseStatus({ first: false, second: false, third: false });
    setResultSummary({ homerun: 0, triple: 0, double: 0, single: 0, strike: 0 });
    setGameState('idle');
    setTimeout(() => setGameState('pitching'), 500);
  }, []);

  const handleBat = useCallback((forceProgress?: number) => {
    if (swingStateRef.current !== 'idle') return;
    
    const p = forceProgress !== undefined ? forceProgress : pitchProgressRef.current;
    let result: 'homerun' | 'triple' | 'double' | 'single' | 'strike' = 'strike';
    
    if (p >= 0.78 && p <= 0.82) result = 'homerun';
    else if (p >= 0.73 && p <= 0.87) result = 'triple';
    else if (p >= 0.65 && p <= 0.92) result = 'double';
    else if (p >= 0.50 && p <= 0.98) result = 'single';
    
    setSwingResult(result);
    setSwingState(result === 'strike' ? 'miss' : 'hit');
    setResultSummary(s => ({ ...s, [result]: s[result] + 1 }));
    
    if (result === 'strike') {
      setOutCount(o => o + 1);
    } else {
      setBaseStatus(bases => {
        const b = [bases.first, bases.second, bases.third];
        const newB = [false, false, false];
        let addedScore = 0;
        const hitBases = result === 'homerun' ? 4 : result === 'triple' ? 3 : result === 'double' ? 2 : 1;
        
        for (let i = 2; i >= 0; i--) {
          if (b[i]) {
            const nextBase = i + hitBases;
            if (nextBase >= 3) addedScore++;
            else newB[nextBase] = true;
          }
        }
        if (hitBases === 4) addedScore++;
        else newB[hitBases - 1] = true;
        
        setScore(s => s + addedScore);
        return { first: newB[0], second: newB[1], third: newB[2] };
      });
    }
    
    setTimeout(() => {
      if (outCountRef.current >= 3) {
        setGameState('result');
      } else {
        setPitchProgress(0);
        pitchProgressRef.current = 0;
        setSwingState('idle');
        setSwingResult(null);
        setGameState('idle');
        setTimeout(() => setGameState('pitching'), 500);
      }
    }, 1500);
  }, []);

  useEffect(() => {
    let animationFrame: number;
    let startTime: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / pitchDuration, 1);
      
      pitchProgressRef.current = progress;
      setPitchProgress(progress);
      
      if (progress < 1) {
        if (swingStateRef.current === 'idle') {
          animationFrame = requestAnimationFrame(animate);
        }
      } else {
        if (swingStateRef.current === 'idle') {
          handleBat(1.0);
        }
      }
    };

    if (gameState === 'pitching' && swingState === 'idle') {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [gameState, handleBat]);

  return (
    <main className="flex flex-col h-[100dvh] w-full max-w-md mx-auto text-white overflow-hidden relative shadow-2xl md:rounded-3xl">
      <StartScreen isVisible={gameState === 'start'} onStart={startGame} />
      
      <GameHeader score={score} outCount={outCount} baseStatus={baseStatus} />
      
      <div className="relative flex-1 flex flex-col w-full">
        <GameField gameState={gameState} pitchProgress={pitchProgress} />
        <BatSwingFeedback isVisible={swingState === 'hit' || swingState === 'miss'} result={swingResult} />
      </div>

      <BattingZone 
        onBat={handleBat} 
        isDisabled={gameState !== 'pitching' || swingState !== 'idle'} 
        swingState={swingState} 
      />
      
      <GameResultOverlay 
        isVisible={gameState === 'result'} 
        finalScore={score} 
        resultSummary={resultSummary} 
        onRestart={startGame} 
      />
    </main>
  );
}
