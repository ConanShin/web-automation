'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Types ---
type HitResult = '홈런' | '3루타' | '2루타' | '1루타' | '스트라이크' | 'none';
type HitVariant = 'homerun' | 'triple' | 'double' | 'single' | 'strike' | 'none';
type Grade = 'mvp' | 'good' | 'tryAgain';

// --- Atoms ---
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex flex-col items-center gap-0.5" role="status" aria-label="현재 점수" aria-live="polite">
    <span className="text-xs font-semibold tracking-widest text-yellow-300 uppercase">SCORE</span>
    <span className="text-3xl font-extrabold text-white tabular-nums">{score}</span>
  </div>
);

const HitResultLabel: React.FC<{ label?: string; variant?: HitVariant }> = ({ label, variant = 'none' }) => {
  const styles: Record<HitVariant, string> = {
    homerun: "text-2xl font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] animate-bounce",
    triple: "text-xl font-bold text-orange-400",
    double: "text-xl font-bold text-green-400",
    single: "text-xl font-bold text-blue-300",
    strike: "text-xl font-bold text-red-400",
    none: "invisible"
  };
  return (
    <div className="flex items-center justify-center min-h-[32px]" role="status" aria-live="assertive" aria-label="타격 결과">
      <span className={styles[variant]}>{label || ''}</span>
    </div>
  );
};

const BallIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-center justify-center" role="img" aria-label="야구공">
    <div className={active ? "w-5 h-5 rounded-full bg-white border-2 border-yellow-300 shadow-md" : "w-5 h-5 rounded-full bg-gray-600 border-2 border-gray-500 opacity-50"} />
  </div>
);

const FieldBackground: React.FC = () => (
  <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-green-700 via-green-600 to-green-500" role="img" aria-label="야구장 배경" aria-hidden="true">
    <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-8 h-4 bg-amber-700/60 rounded-full"></div>
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2/5 bg-amber-800/40 rounded-t-full"></div>
  </div>
);

const PitchLane: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
  if (!visible) return null;
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center h-full" role="presentation" aria-hidden="true">
      <div className="w-1 h-full bg-white/10 rounded-full" />
    </div>
  );
};

const BaseballBall: React.FC<{ x: number; y: number; scale: number; state: 'flying' | 'hit' | 'strike' }> = ({ x, y, scale, state }) => (
  <div 
    className="absolute pointer-events-none z-10"
    style={{ 
      left: `${x}%`, top: `${y}%`, 
      transform: `translate(-50%, -50%) scale(${scale})`,
      transition: state === 'flying' ? 'none' : 'all 0.3s ease-out'
    }}
    role="img" aria-label="날아오는 야구공" aria-hidden="true"
  >
    <div className={`w-6 h-6 rounded-full bg-white border border-red-400 shadow-lg relative flex items-center justify-center`}>
      {state === 'hit' && (
        <div className="absolute inset-0 rounded-full ring-4 ring-yellow-300 ring-opacity-80 scale-150 opacity-0 animate-ping duration-300" />
      )}
    </div>
  </div>
);

const TimingTrack: React.FC = () => (
  <div className="absolute inset-0 bg-gray-700 rounded-full" role="presentation" aria-hidden="true" />
);

const HitZone: React.FC = () => (
  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-row items-center h-full w-full" role="presentation" aria-hidden="true">
    <div className="absolute inset-0 h-full flex-1 bg-red-700/60 rounded-full" />
    <div className="absolute left-1/2 -translate-x-1/2 h-full flex flex-row items-center justify-center w-[70%] bg-blue-400" />
    <div className="absolute left-1/2 -translate-x-1/2 h-full flex flex-row items-center justify-center w-[44%] bg-green-400" />
    <div className="absolute left-1/2 -translate-x-1/2 h-full flex flex-row items-center justify-center w-[24%] bg-orange-400" />
    <div className="absolute left-1/2 -translate-x-1/2 h-full flex flex-row items-center justify-center w-[10%] bg-yellow-400 z-10" />
  </div>
);

const TimingMarker: React.FC<{ position: number }> = ({ position }) => (
  <div 
    className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-[0_0_6px_2px_rgba(255,255,255,0.8)] z-20"
    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
    role="presentation" aria-hidden="true" 
  />
);

const BatterSilhouette: React.FC<{ isSwinging?: boolean }> = ({ isSwinging }) => (
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-28 opacity-90 pointer-events-none" role="img" aria-label="타자 캐릭터" aria-hidden="true">
    <svg viewBox="0 0 100 120" className="w-full h-full fill-gray-800 stroke-gray-600">
      <circle cx="50" cy="20" r="15" />
      <rect x="35" y="40" width="30" height="50" rx="10" />
      <rect x={isSwinging ? "-20" : "60"} y={isSwinging ? "40" : "10"} width="8" height="60" rx="4" className="fill-yellow-600" transform={isSwinging ? "rotate(-45 50 60)" : "rotate(30 65 20)"} style={{transition: 'all 0.1s'}} />
    </svg>
  </div>
);

const SwingButton: React.FC<{ onSwing: () => void; disabled?: boolean }> = ({ onSwing, disabled }) => (
  <button 
    className="absolute inset-0 w-full h-full cursor-pointer bg-transparent active:bg-white/5 transition-colors z-10 outline-none"
    onClick={onSwing} disabled={disabled} aria-label="배팅하기 — 탭하여 스윙" tabIndex={0}
  />
);

const ResultGradeIcon: React.FC<{ grade: Grade }> = ({ grade }) => {
  const styles = {
    mvp: "bg-yellow-400 text-5xl shadow-[0_0_20px_rgba(250,204,21,0.7)]",
    good: "bg-green-500 text-4xl",
    tryAgain: "bg-gray-600 text-4xl"
  };
  const emojis = { mvp: "🏆", good: "⭐", tryAgain: "🔄" };
  return (
    <div className={`flex items-center justify-center w-20 h-20 rounded-full ${styles[grade]}`} role="img" aria-label="게임 결과 등급 아이콘">
      {emojis[grade]}
    </div>
  );
};

const FinalScoreDisplay: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex flex-col items-center gap-1" role="status" aria-label="최종 점수">
    <span className="text-sm tracking-widest text-gray-400 uppercase">FINAL SCORE</span>
    <span className="text-5xl font-black text-white tabular-nums">{score}</span>
  </div>
);

const HitHistoryItem: React.FC<{ inning: number; result: HitResult }> = ({ inning, result }) => {
  const resultStyles: Record<string, string> = {
    "홈런": "bg-yellow-400 text-yellow-900",
    "3루타": "bg-orange-400 text-orange-900",
    "2루타": "bg-green-400 text-green-900",
    "1루타": "bg-blue-400 text-blue-900",
    "스트라이크": "bg-red-700 text-red-100",
    "none": "bg-gray-700 text-gray-400"
  };
  const ordinals = ["1st", "2nd", "3rd"];
  return (
    <div className="flex flex-col items-center gap-1" role="listitem" aria-label="타석 결과">
      <span className="text-xs text-gray-500">{ordinals[inning - 1]}</span>
      <span className={`px-2 py-1 rounded-lg text-sm font-bold ${resultStyles[result] || resultStyles.none}`}>
        {result === 'none' ? '-' : result}
      </span>
    </div>
  );
};

const RestartButton: React.FC<{onClick: () => void}> = ({ onClick }) => (
  <button onClick={onClick} className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-95 transition-all font-bold text-gray-900 text-base text-center justify-center flex" aria-label="다시 하기" tabIndex={0}>다시 하기</button>
);

const HomeButton: React.FC<{onClick: () => void}> = ({ onClick }) => (
  <button onClick={onClick} className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all font-semibold text-gray-200 text-base text-center justify-center flex" aria-label="홈으로 돌아가기" tabIndex={0}>홈으로</button>
);

// --- Molecules ---
const AttemptsIndicator: React.FC<{ total: number; remaining: number }> = ({ total, remaining }) => (
  <div className="flex flex-row items-center gap-2" role="img" aria-label="남은 기회 표시">
    {Array.from({ length: total }).map((_, i) => <BallIcon key={i} active={i < remaining} />)}
  </div>
);

const TimingBar: React.FC<{ markerPosition: number; isActive: boolean }> = ({ markerPosition, isActive }) => (
  <div className={`relative w-4/5 max-w-sm sm:max-w-md h-8 mx-auto mb-4 rounded-full overflow-hidden ${!isActive ? 'opacity-50' : ''}`} role="meter" aria-label="타이밍 게이지" aria-valuemin={0} aria-valuemax={100} aria-valuenow={markerPosition}>
    <TimingTrack />
    <HitZone />
    <TimingMarker position={markerPosition} />
  </div>
);

const ResultCard: React.FC<{ finalScore: number; hits: HitResult[]; onRestart: () => void; onHome: () => void }> = ({ finalScore, hits, onRestart, onHome }) => {
  let grade: Grade = 'tryAgain';
  if (finalScore >= 8) grade = 'mvp';
  else if (finalScore >= 3) grade = 'good';
  
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-700" role="document" aria-label="게임 결과 카드">
      <ResultGradeIcon grade={grade} />
      <FinalScoreDisplay score={finalScore} />
      <div className="flex flex-row items-center justify-center gap-3 w-full" role="list" aria-label="타석 결과 목록">
        {Array.from({ length: 3 }).map((_, i) => <HitHistoryItem key={i} inning={i + 1} result={hits[i] || 'none'} />)}
      </div>
      <div className="flex flex-col gap-3 w-full" role="group" aria-label="게임 결과 액션 버튼">
        <RestartButton onClick={onRestart} />
        <HomeButton onClick={onHome} />
      </div>
    </div>
  );
};

// --- Organisms ---
const GameHeader: React.FC<{ score: number; attemptsLeft: number; lastHitLabel?: string; lastHitVariant?: HitVariant }> = ({ score, attemptsLeft, lastHitLabel, lastHitVariant }) => (
  <header className="flex flex-row items-center justify-between w-full px-4 py-3 bg-black/40 backdrop-blur-sm z-10" role="banner" aria-label="게임 정보 헤더">
    <ScoreBadge score={score} />
    <HitResultLabel label={lastHitLabel} variant={lastHitVariant} />
    <AttemptsIndicator total={3} remaining={attemptsLeft} />
  </header>
);

const GameField: React.FC<{ isPlaying: boolean; ballPosition: { x: number; y: number }; ballScale: number; markerPosition: number; isTimingActive: boolean; ballState: 'flying' | 'hit' | 'strike' }> = ({ isPlaying, ballPosition, ballScale, markerPosition, isTimingActive, ballState }) => (
  <main className="relative flex flex-col items-center justify-end w-full flex-1 overflow-hidden lg:max-w-2xl lg:mx-auto" role="region" aria-label="게임 필드 — 공이 날아오는 영역">
    <FieldBackground />
    <PitchLane visible={true} />
    <BaseballBall x={ballPosition.x} y={ballPosition.y} scale={ballScale} state={ballState} />
    <div className="z-10 w-full mb-8">
      <TimingBar markerPosition={markerPosition} isActive={isTimingActive} />
    </div>
  </main>
);

const BatterZone: React.FC<{ isSwinging: boolean; isDisabled: boolean; onSwing: () => void }> = ({ isSwinging, isDisabled, onSwing }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && !isDisabled) { e.preventDefault(); onSwing(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDisabled, onSwing]);

  return (
    <div className="relative flex items-end justify-center w-full h-40 md:h-52 bg-gradient-to-t from-black/60 to-transparent z-10 lg:max-w-2xl lg:mx-auto" role="region" aria-label="타자 영역">
      <BatterSilhouette isSwinging={isSwinging} />
      <SwingButton onSwing={onSwing} disabled={isDisabled} />
    </div>
  );
};

const GameResultOverlay: React.FC<{ isVisible: boolean; finalScore: number; hits: HitResult[]; onRestart: () => void; onHome: () => void }> = ({ isVisible, finalScore, hits, onRestart, onHome }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6 transition-opacity duration-500" role="dialog" aria-modal="true" aria-label="게임 결과 화면">
      <div className="transform transition-transform duration-500 translate-y-0">
        <ResultCard finalScore={finalScore} hits={hits} onRestart={onRestart} onHome={onHome} />
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function Page() {
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'playing' | 'result'>('idle');
  const [score, setScore] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [hits, setHits] = useState<HitResult[]>([]);
  
  const [lastHitLabel, setLastHitLabel] = useState('');
  const [lastHitVariant, setLastHitVariant] = useState<HitVariant>('none');
  
  const [ballState, setBallState] = useState<'flying' | 'hit' | 'strike'>('flying');
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 0 });
  const [ballScale, setBallScale] = useState(0.15);
  const [markerPosition, setMarkerPosition] = useState(50);
  
  const [isSwinging, setIsSwinging] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pitchDuration = 1500;
  const markerDuration = 1200; 

  const startCountdown = useCallback(() => {
    setCountdown('3');
    setTimeout(() => setCountdown('2'), 1000);
    setTimeout(() => setCountdown('1'), 2000);
    setTimeout(() => {
      setCountdown('GO!');
      setTimeout(() => {
        setCountdown(null);
        startPitch();
      }, 1000);
    }, 3000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(() => {
    setGameState('countdown');
    setScore(0);
    setAttemptsLeft(3);
    setHits([]);
    setLastHitVariant('none');
    setLastHitLabel('');
    startCountdown();
  }, [startCountdown]);

  const startPitch = useCallback(() => {
    setGameState('playing');
    setBallState('flying');
    setBallPosition({ x: 50, y: 0 });
    setBallScale(0.15);
    setMarkerPosition(0);
    setLastHitVariant('none');
    setLastHitLabel('');
    startTimeRef.current = performance.now();
    
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      
      const markerCycle = (elapsed % markerDuration) / markerDuration; 
      const mPos = markerCycle < 0.5 
        ? markerCycle * 200 
        : (1 - markerCycle) * 200; 
      setMarkerPosition(mPos);
      
      const ballProgress = Math.min(elapsed / pitchDuration, 1);
      setBallPosition({ x: 50, y: ballProgress * 100 });
      setBallScale(0.15 + ballProgress * 1.35); 
      
      if (ballProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        handleStrike(mPos);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAnimations = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    startTimeRef.current = null;
  };

  const evaluateHit = (mPos: number) => {
    if (mPos >= 45 && mPos <= 55) return { result: '홈런' as HitResult, variant: 'homerun' as HitVariant, pts: 4 };
    if ((mPos >= 38 && mPos < 45) || (mPos > 55 && mPos <= 62)) return { result: '3루타' as HitResult, variant: 'triple' as HitVariant, pts: 3 };
    if ((mPos >= 28 && mPos < 38) || (mPos > 62 && mPos <= 72)) return { result: '2루타' as HitResult, variant: 'double' as HitVariant, pts: 2 };
    if ((mPos >= 15 && mPos < 28) || (mPos > 72 && mPos <= 85)) return { result: '1루타' as HitResult, variant: 'single' as HitVariant, pts: 1 };
    return { result: '스트라이크' as HitResult, variant: 'strike' as HitVariant, pts: 0 };
  };

  const handleSwing = useCallback(() => {
    if (gameState !== 'playing') return;
    
    setIsSwinging(true);
    setTimeout(() => setIsSwinging(false), 250);
    
    stopAnimations();
    
    const hitData = evaluateHit(markerPosition);
    
    if (hitData.result === '스트라이크') {
      handleStrike(markerPosition);
    } else {
      setBallState('hit');
      setLastHitLabel(hitData.result);
      setLastHitVariant(hitData.variant);
      setScore(s => s + hitData.pts);
      recordAttempt(hitData.result);
    }
  }, [gameState, markerPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStrike = (mPos: number) => {
    stopAnimations();
    setBallState('strike');
    setLastHitLabel('스트라이크');
    setLastHitVariant('strike');
    recordAttempt('스트라이크');
  };

  const recordAttempt = (result: HitResult) => {
    setHits(prev => {
      const newHits = [...prev, result];
      const newAttempts = 3 - newHits.length;
      setAttemptsLeft(newAttempts);
      
      setTimeout(() => {
        if (newAttempts <= 0) {
          setGameState('result');
        } else {
          startPitch();
        }
      }, 2000);
      
      return newHits;
    });
  };

  useEffect(() => {
    startGame();
    return () => stopAnimations();
  }, [startGame]);

  return (
    <>
      <style>{`
        @keyframes flash {
          0% { box-shadow: inset 0 0 0 10px rgba(239,68,68,1); }
          100% { box-shadow: inset 0 0 0 0px rgba(239,68,68,0); }
        }
      `}</style>
      <div className={`flex flex-col items-center justify-between min-h-screen w-full overflow-hidden select-none relative ${ballState === 'strike' ? 'animate-[flash_0.4s_ease-out]' : ''}`} role="main" aria-label="야구 게임 메인 페이지">
        <GameHeader score={score} attemptsLeft={attemptsLeft} lastHitLabel={lastHitLabel} lastHitVariant={lastHitVariant} />
        
        <GameField 
          isPlaying={gameState === 'playing'}
          ballPosition={ballPosition}
          ballScale={ballScale}
          markerPosition={markerPosition}
          isTimingActive={gameState === 'playing'}
          ballState={ballState}
        />
        
        {countdown && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <span className="text-8xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] animate-bounce">{countdown}</span>
          </div>
        )}
        
        <BatterZone 
          isSwinging={isSwinging} 
          isDisabled={gameState !== 'playing'} 
          onSwing={handleSwing} 
        />
        
        <GameResultOverlay 
          isVisible={gameState === 'result'} 
          finalScore={score} 
          hits={hits} 
          onRestart={startGame} 
          onHome={() => console.log('Go home')} 
        />
      </div>
    </>
  );
}
