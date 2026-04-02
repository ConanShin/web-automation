'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PitchType = 'FASTBALL' | 'CURVEBALL' | 'SLIDER' | 'CHANGEUP';
type TimingGrade = 'PERFECT' | 'GOOD' | 'EARLY' | 'LATE' | 'MISS';
type HitOutcome = 'HR' | '3B' | '2B' | '1B' | 'BB' | 'K' | 'FO' | 'GO' | 'FOUL';
type GameStatus = 'TITLE' | 'PITCHING' | 'BALL_FLYING' | 'RESULT' | 'INNING_BREAK' | 'AI_BATTING' | 'GAME_OVER';
type Difficulty = 'easy' | 'normal' | 'hard';

interface Bases {
  first: boolean;
  second: boolean;
  third: boolean;
}

interface Count {
  strikes: number;
  balls: number;
  outs: number;
}

interface Score {
  home: number[];
  away: number[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

interface PitchInfo {
  type: PitchType;
  isStrike: boolean;
  duration: number; // ms
  curvature: number; // horizontal offset at arrival
}

const PITCH_CONFIGS: Record<PitchType, { label: string; color: string; speed: number; variation: number }> = {
  FASTBALL:  { label: 'FASTBALL',  color: '#FF6B6B', speed: 650,  variation: 30 },
  SLIDER:    { label: 'SLIDER',    color: '#4ECDC4', speed: 820,  variation: 60 },
  CURVEBALL: { label: 'CURVEBALL', color: '#A78BFA', speed: 950,  variation: 80 },
  CHANGEUP:  { label: 'CHANGEUP',  color: '#FCD34D', speed: 900,  variation: 50 },
};

const DIFF_CONFIG: Record<Difficulty, { strikeRatio: number; aiBatAvg: number; label: string }> = {
  easy:   { strikeRatio: 0.70, aiBatAvg: 0.22, label: 'EASY' },
  normal: { strikeRatio: 0.60, aiBatAvg: 0.27, label: 'NORMAL' },
  hard:   { strikeRatio: 0.52, aiBatAvg: 0.33, label: 'HARD' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomPitch(difficulty: Difficulty): PitchInfo {
  const types: PitchType[] = ['FASTBALL', 'FASTBALL', 'SLIDER', 'CURVEBALL', 'CHANGEUP'];
  const type = types[Math.floor(Math.random() * types.length)];
  const cfg = PITCH_CONFIGS[type];
  const isStrike = Math.random() < DIFF_CONFIG[difficulty].strikeRatio;
  const duration = cfg.speed + (Math.random() - 0.5) * cfg.variation;
  const curvature = type === 'CURVEBALL' ? (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 20)
    : type === 'SLIDER' ? (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 15)
    : (Math.random() - 0.5) * 10;
  return { type, isStrike, duration, curvature };
}

function judgeTimingGrade(delta: number): TimingGrade {
  const abs = Math.abs(delta);
  if (abs < 60) return 'PERFECT';
  if (abs < 130) return 'GOOD';
  if (delta < -130) return 'EARLY';
  if (delta > 130) return 'LATE';
  return 'MISS';
}

function gradeToOutcome(grade: TimingGrade, isStrike: boolean): HitOutcome {
  if (!isStrike && (grade === 'EARLY' || grade === 'LATE' || grade === 'MISS')) return 'BB'; // won't use; handled separately
  switch (grade) {
    case 'PERFECT': return Math.random() < 0.55 ? 'HR' : '3B';
    case 'GOOD':    return Math.random() < 0.55 ? '2B' : '1B';
    case 'EARLY':
    case 'LATE':    return Math.random() < 0.5 ? 'FOUL' : (Math.random() < 0.5 ? 'FO' : 'GO');
    default:        return 'K';
  }
}

function advanceBases(bases: Bases, outcome: HitOutcome, currentScore: number): { bases: Bases; runs: number } {
  let { first, second, third } = bases;
  let runs = 0;

  if (outcome === 'HR') {
    runs = (third ? 1 : 0) + (second ? 1 : 0) + (first ? 1 : 0) + 1;
    return { bases: { first: false, second: false, third: false }, runs };
  }
  if (outcome === '3B') {
    if (third) runs++;
    if (second) runs++;
    if (first) runs++;
    return { bases: { first: false, second: false, third: true }, runs };
  }
  if (outcome === '2B') {
    if (third) runs++;
    if (second) runs++;
    const newThird = first;
    return { bases: { first: false, second: true, third: newThird }, runs };
  }
  if (outcome === '1B' || outcome === 'BB') {
    if (third) runs++;
    const newThird = second;
    const newSecond = first;
    return { bases: { first: true, second: newSecond, third: newThird }, runs };
  }
  return { bases, runs: 0 };
}

function simulateAIInning(difficulty: Difficulty): { runs: number; hits: number } {
  const cfg = DIFF_CONFIG[difficulty];
  let bases: Bases = { first: false, second: false, third: false };
  let outs = 0;
  let runs = 0;
  let hits = 0;
  while (outs < 3) {
    const r = Math.random();
    if (r < cfg.aiBatAvg * 0.15) {
      // Home run
      const res = advanceBases(bases, 'HR', 0);
      runs += res.runs;
      bases = res.bases;
      hits++;
    } else if (r < cfg.aiBatAvg * 0.4) {
      const hitType: HitOutcome = Math.random() < 0.4 ? '2B' : '1B';
      const res = advanceBases(bases, hitType, 0);
      runs += res.runs;
      bases = res.bases;
      hits++;
    } else if (r < cfg.aiBatAvg) {
      const res = advanceBases(bases, '1B', 0);
      runs += res.runs;
      bases = res.bases;
      hits++;
    } else {
      outs++;
    }
  }
  return { runs, hits };
}

const OUTCOME_LABELS: Record<HitOutcome, string> = {
  HR: '⚾ HOME RUN!!', '3B': '🔥 TRIPLE!', '2B': '💥 DOUBLE!', '1B': '✅ SINGLE!',
  BB: '🚶 WALK', K: '❌ STRIKE OUT', FO: '📤 FLY OUT', GO: '⬇️ GROUND OUT', FOUL: '↩️ FOUL',
};

const GRADE_COLORS: Record<TimingGrade, string> = {
  PERFECT: '#FFD700', GOOD: '#4CAF50', EARLY: '#FF9800', LATE: '#FF9800', MISS: '#E53935',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Page() {
  // Game meta
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [currentInning, setCurrentInning] = useState(1);
  const [isTopInning, setIsTopInning] = useState(true); // top = away(AI) bats, bottom = home(player) bats
  const [score, setScore] = useState<Score>({ home: Array(9).fill(0), away: Array(9).fill(0) });
  const [count, setCount] = useState<Count>({ strikes: 0, balls: 0, outs: 0 });
  const [bases, setBases] = useState<Bases>({ first: false, second: false, third: false });
  const [totalHits, setTotalHits] = useState({ home: 0, away: 0 });

  // Pitch / animation state
  const [currentPitch, setCurrentPitch] = useState<PitchInfo | null>(null);
  const [ballPos, setBallPos] = useState({ x: 50, y: 20 }); // percent coords
  const [ballVisible, setBallVisible] = useState(false);
  const [strikeZoneActive, setStrikeZoneActive] = useState(false);
  const [pitchArrivalTime, setPitchArrivalTime] = useState<number | null>(null);
  const [clickedTime, setClickedTime] = useState<number | null>(null);
  const [hasSwung, setHasSwung] = useState(false);

  // Result display
  const [lastOutcome, setLastOutcome] = useState<HitOutcome | null>(null);
  const [lastGrade, setLastGrade] = useState<TimingGrade | null>(null);
  const [eventMessage, setEventMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [messageColor, setMessageColor] = useState('#FFD700');

  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // Pitcher animation
  const [pitcherState, setPitcherState] = useState<'idle' | 'windup' | 'release'>('idle');

  // Inning break message
  const [inningBreakMsg, setInningBreakMsg] = useState('');

  // Refs for animation
  const animFrameRef = useRef<number | null>(null);
  const pitchStartRef = useRef<number | null>(null);
  const pitchDurationRef = useRef(0);
  const pitchInfoRef = useRef<PitchInfo | null>(null);
  const swungRef = useRef(false);
  const arrivalTimeRef = useRef<number | null>(null);
  const clickedTimeRef = useRef<number | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const showEvent = useCallback((msg: string, color: string, duration = 1500) => {
    setEventMessage(msg);
    setMessageColor(color);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), duration);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 20) => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: particleIdRef.current++,
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      color,
      life: 60,
      maxLife: 60,
    }));
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;
    const id = requestAnimationFrame(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.15, life: p.life - 1 }))
          .filter(p => p.life > 0)
      );
    });
    return () => cancelAnimationFrame(id);
  }, [particles]);

  // ─── Game Logic ──────────────────────────────────────────────────────────────

  const startNewPitch = useCallback(() => {
    setHasSwung(false);
    swungRef.current = false;
    setClickedTime(null);
    clickedTimeRef.current = null;
    setBallVisible(false);
    setStrikeZoneActive(false);
    setLastOutcome(null);
    setLastGrade(null);

    setPitcherState('windup');
    setTimeout(() => {
      setPitcherState('release');
      const pitch = randomPitch(difficulty);
      setCurrentPitch(pitch);
      pitchInfoRef.current = pitch;
      pitchDurationRef.current = pitch.duration;
      setBallVisible(true);
      setBallPos({ x: 50, y: 22 });

      const now = performance.now();
      pitchStartRef.current = now;
      const arrival = now + pitch.duration;
      arrivalTimeRef.current = arrival;
      setPitchArrivalTime(arrival);
      setGameStatus('BALL_FLYING');

      // Animate ball
      const animate = (ts: number) => {
        if (!pitchStartRef.current) return;
        const elapsed = ts - pitchStartRef.current;
        const progress = Math.min(elapsed / pitchDurationRef.current, 1);

        // Bezier-ish: start small, grow as it approaches plate
        const eased = progress * progress * (3 - 2 * progress); // smoothstep
        const pitchCurv = pitchInfoRef.current?.curvature ?? 0;

        const startX = 50;
        const endX = 50 + pitchCurv * 0.15;
        const curX = startX + (endX - startX) * eased;
        const curY = 22 + (56 - 22) * eased; // 22% → 56% vertical

        setBallPos({ x: curX, y: curY });

        // Strike zone activates at 75% of travel
        if (progress > 0.75) {
          setStrikeZoneActive(true);
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Ball arrived — judge if player hasn't swung
          setBallVisible(false);
          setStrikeZoneActive(false);
          setPitcherState('idle');

          if (!swungRef.current) {
            // Auto judge: no click
            const pitch = pitchInfoRef.current!;
            if (pitch.isStrike) {
              resolveCount('K_LOOKING');
            } else {
              resolveCount('BALL');
            }
          }
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    }, 600); // windup delay
  }, [difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveCount = useCallback((type: 'BALL' | 'K_LOOKING' | 'K_SWING' | HitOutcome) => {
    setGameStatus('RESULT');

    if (type === 'BALL') {
      showEvent('BALL', '#4FC3F7', 1200);
      setCount(prev => {
        const newBalls = prev.balls + 1;
        if (newBalls >= 4) {
          // Walk
          showEvent('🚶 WALK', '#4FC3F7', 1500);
          const res = advanceBases(bases, 'BB', 0);
          setBases(res.bases);
          if (res.runs > 0) {
            updateScore(res.runs, false);
          }
          return { strikes: 0, balls: 0, outs: prev.outs };
        }
        return { ...prev, balls: newBalls };
      });
    } else if (type === 'K_LOOKING' || type === 'K_SWING') {
      const msg = type === 'K_SWING' ? 'STRIKE ✗' : 'STRIKE ☝️';
      setCount(prev => {
        const newStrikes = prev.strikes + 1;
        if (newStrikes >= 3) {
          showEvent('❌ STRIKE OUT', '#E53935', 1800);
          return { strikes: 0, balls: 0, outs: prev.outs + 1 };
        }
        showEvent(msg, '#FF6B6B', 1200);
        return { ...prev, strikes: newStrikes };
      });
    } else if (type === 'FOUL') {
      setCount(prev => {
        if (prev.strikes < 2) {
          showEvent('↩️ FOUL', '#FF9800', 1200);
          return { ...prev, strikes: prev.strikes + 1 };
        }
        showEvent('↩️ FOUL', '#FF9800', 1200);
        return prev; // no change on 2 strikes
      });
    } else if (type === 'FO' || type === 'GO') {
      showEvent(OUTCOME_LABELS[type], '#FF9800', 1500);
      setCount(prev => ({ strikes: 0, balls: 0, outs: prev.outs + 1 }));
    } else if (type === 'HR' || type === '3B' || type === '2B' || type === '1B') {
      const res = advanceBases(bases, type, 0);
      setBases(res.bases);
      if (res.runs > 0) updateScore(res.runs, false);
      if (type === 'HR') {
        spawnParticles(50, 50, '#FFD700', 40);
        showEvent(OUTCOME_LABELS[type], '#FFD700', 2000);
      } else {
        showEvent(OUTCOME_LABELS[type], '#4CAF50', 1500);
      }
      setTotalHits(prev => ({ ...prev, home: prev.home + 1 }));
      setCount(prev => ({ strikes: 0, balls: 0, outs: prev.outs }));
    }
  }, [bases, showEvent, spawnParticles]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateScore = useCallback((runs: number, isAway: boolean) => {
    setScore(prev => {
      const idx = currentInning - 1;
      if (isAway) {
        const newAway = [...prev.away];
        newAway[idx] = (newAway[idx] || 0) + runs;
        return { ...prev, away: newAway };
      } else {
        const newHome = [...prev.home];
        newHome[idx] = (newHome[idx] || 0) + runs;
        return { ...prev, home: newHome };
      }
    });
  }, [currentInning]);

  // Watch outs for inning-end
  useEffect(() => {
    if (gameStatus !== 'RESULT') return;
    const timer = setTimeout(() => {
      setCount(c => {
        if (c.outs >= 3) {
          handleInningEnd(c.outs);
        } else {
          setGameStatus('PITCHING');
          startNewPitch();
        }
        return c;
      });
    }, 1600);
    return () => clearTimeout(timer);
  }, [gameStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInningEnd = useCallback((outs: number) => {
    setCount({ strikes: 0, balls: 0, outs: 0 });
    setBases({ first: false, second: false, third: false });

    if (isTopInning) {
      // Switch to bottom — player bats
      setIsTopInning(false);
      setInningBreakMsg(`▼ ${currentInning}회 말 — YOUR TURN TO BAT!`);
      setGameStatus('INNING_BREAK');
    } else {
      // Switch to next inning top — AI bats
      const nextInning = currentInning + 1;
      if (nextInning > 9) {
        setGameStatus('GAME_OVER');
      } else {
        setCurrentInning(nextInning);
        setIsTopInning(true);
        setInningBreakMsg(`▲ ${nextInning}회 초 — AI BATTING...`);
        setGameStatus('INNING_BREAK');
      }
    }
  }, [currentInning, isTopInning]);

  // Handle inning break — auto simulate AI innings
  useEffect(() => {
    if (gameStatus !== 'INNING_BREAK') return;
    const timer = setTimeout(() => {
      if (isTopInning) {
        // AI is about to bat → simulate
        const result = simulateAIInning(difficulty);
        if (result.runs > 0) updateScore(result.runs, true);
        setTotalHits(prev => ({ ...prev, away: prev.away + result.hits }));
        // After AI inning, switch back to bottom
        setIsTopInning(false);
        setInningBreakMsg(`▼ ${currentInning}회 말 — YOUR TURN TO BAT!`);
        setTimeout(() => {
          setGameStatus('PITCHING');
          startNewPitch();
        }, 1800);
      } else {
        // Bottom inning start — player bats
        setGameStatus('PITCHING');
        startNewPitch();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [gameStatus, isTopInning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle click during ball flight
  const handleFieldClick = useCallback(() => {
    if (gameStatus !== 'BALL_FLYING' || swungRef.current) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    swungRef.current = true;
    setHasSwung(true);
    const now = performance.now();
    const arrival = arrivalTimeRef.current ?? now;
    const delta = now - arrival; // negative = early, positive = late
    clickedTimeRef.current = now;

    const pitch = pitchInfoRef.current!;
    const grade = judgeTimingGrade(delta);
    setLastGrade(grade);

    let outcome: HitOutcome;
    if (!pitch.isStrike && (grade === 'EARLY' || grade === 'LATE' || grade === 'MISS')) {
      outcome = 'GO'; // swing at ball
    } else {
      outcome = gradeToOutcome(grade, pitch.isStrike);
    }

    setLastOutcome(outcome);
    setBallVisible(false);
    setStrikeZoneActive(false);
    setPitcherState('idle');

    // Show grade popup
    showEvent(grade, GRADE_COLORS[grade], 800);

    setTimeout(() => {
      if (outcome === 'K') {
        resolveCount('K_SWING');
      } else {
        resolveCount(outcome);
      }
    }, 300);
  }, [gameStatus, resolveCount, showEvent]);

  const startGame = useCallback(() => {
    setScore({ home: Array(9).fill(0), away: Array(9).fill(0) });
    setCount({ strikes: 0, balls: 0, outs: 0 });
    setBases({ first: false, second: false, third: false });
    setCurrentInning(1);
    setTotalHits({ home: 0, away: 0 });
    setParticles([]);
    setLastOutcome(null);
    setLastGrade(null);
    // Start with top of 1st (AI bats first in "away" role, then player bats)
    // For simplicity, let player bat first (home team) — bottom of 1st
    setIsTopInning(false);
    setGameStatus('PITCHING');
    setTimeout(() => startNewPitch(), 300);
  }, [startNewPitch]);

  const resetToTitle = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setGameStatus('TITLE');
    setPitcherState('idle');
    setBallVisible(false);
  }, []);

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const totalHome = score.home.reduce((a, b) => a + b, 0);
  const totalAway = score.away.reduce((a, b) => a + b, 0);

  const innings = Array.from({ length: 9 }, (_, i) => i + 1);

  // ─── Render ──────────────────────────────────────────────────────────────────

  // TITLE SCREEN
  if (gameStatus === 'TITLE') {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1A1A2E 50%, #162040 100%)' }}>
        {/* Stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
              }} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          {/* Logo */}
          <div className="text-center">
            <div className="text-8xl mb-2">⚾</div>
            <h1 className="text-6xl font-black tracking-widest"
              style={{ color: '#F5C518', textShadow: '0 0 30px rgba(245,197,24,0.5), 0 4px 0 #8B6914' }}>
              BASEBALL
            </h1>
            <p className="text-xl font-bold tracking-[0.4em] mt-2" style={{ color: '#EAEAEA' }}>
              CLICK TIMING CHALLENGE
            </p>
          </div>

          {/* Difficulty */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-bold tracking-widest" style={{ color: '#94a3b8' }}>SELECT DIFFICULTY</p>
            <div className="flex gap-3">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => (
                <button key={d}
                  onClick={() => setDifficulty(d)}
                  className="px-6 py-2 rounded font-black tracking-widest text-sm transition-all border-2"
                  style={{
                    borderColor: difficulty === d ? '#F5C518' : '#334155',
                    background: difficulty === d ? '#F5C518' : 'transparent',
                    color: difficulty === d ? '#1A1A2E' : '#94a3b8',
                    transform: difficulty === d ? 'scale(1.05)' : 'scale(1)',
                  }}>
                  {DIFF_CONFIG[d].label}
                </button>
              ))}
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={startGame}
            className="px-16 py-5 rounded-xl font-black text-2xl tracking-widest transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #F5C518, #e6a800)',
              color: '#1A1A2E',
              boxShadow: '0 0 40px rgba(245,197,24,0.4), 0 6px 0 #8B6914',
            }}>
            ▶ PLAY BALL
          </button>

          {/* Instructions */}
          <div className="text-center max-w-sm" style={{ color: '#64748b' }}>
            <p className="text-sm">Click when the ball enters the strike zone</p>
            <p className="text-xs mt-1">Perfect timing = HOME RUN!</p>
          </div>
        </div>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (gameStatus === 'GAME_OVER') {
    const playerWins = totalHome > totalAway;
    const tie = totalHome === totalAway;
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1A1A2E 100%)' }}>
        <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6">
          <div className="text-5xl">{tie ? '🤝' : playerWins ? '🏆' : '😔'}</div>
          <h2 className="text-4xl font-black tracking-widest"
            style={{ color: tie ? '#F5C518' : playerWins ? '#FFD700' : '#E53935' }}>
            {tie ? 'TIE GAME' : playerWins ? 'YOU WIN!' : 'GAME OVER'}
          </h2>

          {/* Final Scoreboard */}
          <div className="w-full rounded-xl overflow-hidden border border-slate-700"
            style={{ background: '#111827' }}>
            <div className="grid text-xs font-bold" style={{
              gridTemplateColumns: '80px repeat(9, 1fr) 40px 40px 40px',
              color: '#94a3b8', background: '#0f172a',
            }}>
              <div className="p-2 pl-3">TEAM</div>
              {innings.map(i => (
                <div key={i} className="p-2 text-center"
                  style={{ color: i === currentInning ? '#F5C518' : '#94a3b8' }}>{i}</div>
              ))}
              <div className="p-2 text-center" style={{ color: '#F5C518' }}>R</div>
              <div className="p-2 text-center">H</div>
              <div className="p-2 text-center">E</div>
            </div>
            {[
              { label: 'YOU', scores: score.home, total: totalHome, hits: totalHits.home, isPlayer: true },
              { label: 'CPU', scores: score.away, total: totalAway, hits: totalHits.away, isPlayer: false },
            ].map((row) => (
              <div key={row.label} className="grid border-t border-slate-800" style={{
                gridTemplateColumns: '80px repeat(9, 1fr) 40px 40px 40px',
              }}>
                <div className="p-2 pl-3 font-black text-sm"
                  style={{ color: row.isPlayer ? '#F5C518' : '#E53935' }}>{row.label}</div>
                {innings.map(i => (
                  <div key={i} className="p-2 text-center text-sm font-mono"
                    style={{ color: '#EAEAEA' }}>{row.scores[i - 1] ?? 0}</div>
                ))}
                <div className="p-2 text-center text-sm font-black" style={{ color: '#F5C518' }}>{row.total}</div>
                <div className="p-2 text-center text-sm font-mono" style={{ color: '#EAEAEA' }}>{row.hits}</div>
                <div className="p-2 text-center text-sm font-mono" style={{ color: '#EAEAEA' }}>0</div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button onClick={startGame}
              className="px-8 py-3 rounded-xl font-black tracking-widest text-sm transition-all active:scale-95"
              style={{ background: '#F5C518', color: '#1A1A2E', boxShadow: '0 4px 0 #8B6914' }}>
              PLAY AGAIN
            </button>
            <button onClick={resetToTitle}
              className="px-8 py-3 rounded-xl font-black tracking-widest text-sm transition-all active:scale-95 border-2"
              style={{ borderColor: '#334155', color: '#94a3b8' }}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN GAME SCREEN ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col select-none"
      style={{ background: '#0a1628', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── SCOREBOARD ── */}
      <div className="w-full px-2 pt-2 pb-1" style={{ background: '#111827' }}>
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg overflow-hidden border border-slate-700">
            <div className="grid text-xs font-bold"
              style={{
                gridTemplateColumns: '60px repeat(9, 1fr) 36px 36px 36px',
                background: '#0f172a', color: '#64748b',
              }}>
              <div className="px-2 py-1">TEAM</div>
              {innings.map(i => (
                <div key={i} className="py-1 text-center"
                  style={{ color: i === currentInning ? '#F5C518' : '#64748b' }}>{i}</div>
              ))}
              <div className="py-1 text-center" style={{ color: '#F5C518' }}>R</div>
              <div className="py-1 text-center">H</div>
              <div className="py-1 text-center">E</div>
            </div>
            {[
              { label: 'YOU', scores: score.home, total: totalHome, hits: totalHits.home, color: '#F5C518' },
              { label: 'CPU', scores: score.away, total: totalAway, hits: totalHits.away, color: '#E53935' },
            ].map((row) => (
              <div key={row.label} className="grid border-t border-slate-800"
                style={{ gridTemplateColumns: '60px repeat(9, 1fr) 36px 36px 36px' }}>
                <div className="px-2 py-1 font-black text-xs" style={{ color: row.color }}>{row.label}</div>
                {innings.map(i => (
                  <div key={i} className="py-1 text-center text-xs font-mono"
                    style={{
                      color: '#EAEAEA',
                      background: i === currentInning ? 'rgba(245,197,24,0.08)' : 'transparent',
                    }}>
                    {row.scores[i - 1] ?? '-'}
                  </div>
                ))}
                <div className="py-1 text-center text-xs font-black" style={{ color: '#F5C518' }}>{row.total}</div>
                <div className="py-1 text-center text-xs font-mono" style={{ color: '#EAEAEA' }}>{row.hits}</div>
                <div className="py-1 text-center text-xs font-mono" style={{ color: '#EAEAEA' }}>0</div>
              </div>
            ))}
          </div>

          {/* Inning indicator */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs font-black tracking-widest" style={{ color: '#F5C518' }}>
              {isTopInning ? '▲' : '▼'} INNING {currentInning}
            </span>
            <span className="text-xs" style={{ color: '#64748b' }}>|</span>
            <span className="text-xs" style={{ color: '#64748b' }}>
              {isTopInning ? 'CPU BATTING' : 'YOU BATTING'}
            </span>
            {currentPitch && (
              <>
                <span className="text-xs" style={{ color: '#64748b' }}>|</span>
                <span className="text-xs font-bold" style={{ color: PITCH_CONFIGS[currentPitch.type].color }}>
                  {PITCH_CONFIGS[currentPitch.type].label}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── GAME AREA ── */}
      <div className="flex-1 flex items-stretch max-w-3xl mx-auto w-full px-2 py-2 gap-2">

        {/* LEFT: Base Diamond + Count */}
        <div className="flex flex-col gap-3 justify-center" style={{ width: 120 }}>
          {/* Base Diamond */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#64748b' }}>BASES</p>
            <div className="relative" style={{ width: 80, height: 80 }}>
              {/* Diamond lines */}
              <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full">
                <polygon points="40,5 75,40 40,75 5,40"
                  fill="rgba(45,138,78,0.15)" stroke="#334155" strokeWidth="1.5" />
                {/* Base connectors */}
                <line x1="40" y1="5" x2="75" y2="40" stroke="#334155" strokeWidth="1" />
                <line x1="75" y1="40" x2="40" y2="75" stroke="#334155" strokeWidth="1" />
                <line x1="40" y1="75" x2="5" y2="40" stroke="#334155" strokeWidth="1" />
                <line x1="5" y1="40" x2="40" y2="5" stroke="#334155" strokeWidth="1" />
              </svg>
              {/* 2nd base (top) */}
              <div className="absolute flex items-center justify-center rounded-sm"
                style={{
                  width: 16, height: 16, top: 0, left: '50%', transform: 'translate(-50%, -2px)',
                  background: bases.second ? '#FF9800' : '#1e293b',
                  border: `2px solid ${bases.second ? '#FF9800' : '#475569'}`,
                  boxShadow: bases.second ? '0 0 8px rgba(255,152,0,0.6)' : 'none',
                }} />
              {/* 1st base (right) */}
              <div className="absolute flex items-center justify-center rounded-sm"
                style={{
                  width: 16, height: 16, top: '50%', right: 0, transform: 'translate(2px, -50%)',
                  background: bases.first ? '#FF9800' : '#1e293b',
                  border: `2px solid ${bases.first ? '#FF9800' : '#475569'}`,
                  boxShadow: bases.first ? '0 0 8px rgba(255,152,0,0.6)' : 'none',
                }} />
              {/* 3rd base (left) */}
              <div className="absolute flex items-center justify-center rounded-sm"
                style={{
                  width: 16, height: 16, top: '50%', left: 0, transform: 'translate(-2px, -50%)',
                  background: bases.third ? '#FF9800' : '#1e293b',
                  border: `2px solid ${bases.third ? '#FF9800' : '#475569'}`,
                  boxShadow: bases.third ? '0 0 8px rgba(255,152,0,0.6)' : 'none',
                }} />
              {/* Home base (bottom) */}
              <div className="absolute flex items-center justify-center"
                style={{
                  width: 14, height: 14, bottom: 0, left: '50%', transform: 'translate(-50%, 2px)',
                  background: '#EAEAEA', clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                }} />
            </div>
          </div>

          {/* Count Panel */}
          <div className="flex flex-col gap-2 items-center rounded-lg p-3"
            style={{ background: '#111827', border: '1px solid #1e293b' }}>
            {[
              { label: 'B', max: 4, val: count.balls, color: '#4FC3F7' },
              { label: 'S', max: 3, val: count.strikes, color: '#FCD34D' },
              { label: 'O', max: 3, val: count.outs, color: '#EF4444' },
            ].map(({ label, max, val, color }) => (
              <div key={label} className="flex items-center gap-1.5 w-full">
                <span className="text-xs font-black w-4" style={{ color }}>{label}</span>
                <div className="flex gap-1">
                  {Array.from({ length: max }).map((_, i) => (
                    <div key={i} className="rounded-full transition-all"
                      style={{
                        width: 10, height: 10,
                        background: i < val ? color : '#1e293b',
                        border: `1.5px solid ${i < val ? color : '#475569'}`,
                        boxShadow: i < val ? `0 0 6px ${color}` : 'none',
                      }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Field */}
        <div className="flex-1 relative rounded-xl overflow-hidden cursor-pointer"
          style={{ background: '#2D8A4E', minHeight: 320 }}
          onClick={handleFieldClick}>

          {/* Sky gradient */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a8e 25%, #4a90d9 45%, #2D8A4E 45%)',
          }} />

          {/* Outfield */}
          <div className="absolute" style={{
            bottom: '32%', left: '5%', right: '5%', height: '28%',
            background: 'radial-gradient(ellipse at 50% 100%, #1e5c30 0%, #2D8A4E 70%)',
            borderRadius: '50% 50% 0 0',
          }} />

          {/* Outfield fence */}
          <div className="absolute flex items-center justify-center text-xs font-black"
            style={{
              bottom: '58%', left: '5%', right: '5%', height: 6,
              background: '#8B4513', borderRadius: 3, color: '#F5C518',
            }} />

          {/* Infield dirt */}
          <div className="absolute" style={{
            bottom: '3%', left: '15%', right: '15%', height: '35%',
            background: 'radial-gradient(ellipse at 50% 100%, #C8A96E 0%, #a8864e 100%)',
            borderRadius: '50% 50% 0 0',
          }} />

          {/* Infield grass */}
          <div className="absolute" style={{
            bottom: '3%', left: '25%', right: '25%', height: '22%',
            background: '#2D8A4E',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          }} />

          {/* Pitching mound */}
          <div className="absolute rounded-full"
            style={{
              width: 20, height: 8,
              bottom: '32%', left: '50%', transform: 'translate(-50%, 0)',
              background: '#C8A96E',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }} />

          {/* Home plate */}
          <div className="absolute" style={{
            width: 18, height: 10,
            bottom: '6%', left: '50%', transform: 'translate(-50%, 0)',
            background: '#f8f8f8',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }} />

          {/* Strike Zone */}
          <div className="absolute transition-all"
            style={{
              width: 52, height: 60,
              bottom: '14%', left: '50%', transform: 'translate(-50%, 0)',
              border: `2px solid ${strikeZoneActive ? '#00BFFF' : 'rgba(255,255,255,0.25)'}`,
              background: strikeZoneActive ? 'rgba(0,191,255,0.1)' : 'rgba(255,255,255,0.05)',
              borderRadius: 4,
              boxShadow: strikeZoneActive ? '0 0 20px rgba(0,191,255,0.5)' : 'none',
              animation: strikeZoneActive ? 'pulse-zone 0.4s ease-in-out infinite alternate' : 'none',
            }} />

          {/* Pitcher character */}
          <div className="absolute flex flex-col items-center"
            style={{
              bottom: '35%', left: '50%',
              transform: `translate(-50%, 0) ${pitcherState === 'windup' ? 'scaleX(-1.1) scaleY(0.95)' : pitcherState === 'release' ? 'scaleX(0.9) scaleY(1.05)' : 'scale(1)'}`,
              transition: 'transform 0.3s',
            }}>
            {/* Head */}
            <div className="rounded-full"
              style={{ width: 16, height: 16, background: '#f5c58a', border: '2px solid #d4a270' }} />
            {/* Cap */}
            <div className="absolute" style={{
              width: 18, height: 8, top: 0, left: '50%', transform: 'translate(-50%, -4px)',
              background: '#E53935', borderRadius: '50% 50% 0 0',
            }} />
            {/* Body */}
            <div className="rounded"
              style={{ width: 18, height: 22, marginTop: 2, background: '#1A1A2E', border: '1px solid #E53935' }} />
            {/* Arm */}
            <div className="absolute rounded-full"
              style={{
                width: 6, height: 16,
                top: 18, right: pitcherState === 'release' ? -8 : -4,
                background: '#1A1A2E',
                transform: pitcherState === 'release' ? 'rotate(-45deg)' : 'rotate(0deg)',
                transition: 'all 0.2s',
              }} />
            {/* Legs */}
            <div className="flex gap-1 mt-0.5">
              <div className="rounded" style={{ width: 7, height: 14, background: '#E53935' }} />
              <div className="rounded" style={{ width: 7, height: 14, background: '#E53935' }} />
            </div>
          </div>

          {/* Batter character */}
          <div className="absolute flex flex-col items-center"
            style={{ bottom: '8%', left: 'calc(50% + 22px)' }}>
            {/* Head */}
            <div className="rounded-full"
              style={{ width: 14, height: 14, background: '#f5c58a', border: '2px solid #d4a270' }} />
            {/* Helmet */}
            <div className="absolute" style={{
              width: 16, height: 9, top: 0, left: '50%', transform: 'translate(-50%, -3px)',
              background: '#F5C518', borderRadius: '50% 50% 0 0',
            }} />
            {/* Body */}
            <div className="rounded mt-0.5"
              style={{ width: 16, height: 20, background: '#1e3a5f', border: '1px solid #F5C518' }} />
            {/* Bat */}
            <div className="absolute rounded-full"
              style={{
                width: 4, height: 22,
                top: 14, left: -10,
                background: '#C8A96E',
                transform: hasSwung ? 'rotate(40deg)' : 'rotate(-20deg)',
                transition: 'transform 0.15s',
                transformOrigin: 'bottom center',
              }} />
            {/* Legs */}
            <div className="flex gap-0.5 mt-0.5">
              <div className="rounded" style={{ width: 6, height: 12, background: '#1e3a5f' }} />
              <div className="rounded" style={{ width: 6, height: 12, background: '#1e3a5f' }} />
            </div>
          </div>

          {/* Ball */}
          {ballVisible && (
            <div className="absolute rounded-full transition-none"
              style={{
                width: 14 + ballPos.y * 0.12,
                height: 14 + ballPos.y * 0.12,
                left: `${ballPos.x}%`,
                top: `${ballPos.y}%`,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at 35% 35%, #ffffff, #e8e8e8)',
                border: '1.5px solid #ccc',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                zIndex: 20,
              }}>
              {/* Seams */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-40">
                <div style={{
                  position: 'absolute', top: '20%', left: '15%', width: '30%', height: '60%',
                  border: '1.5px solid #E53935', borderRadius: '50%', borderLeft: 'none', borderTop: 'none',
                }} />
                <div style={{
                  position: 'absolute', top: '20%', right: '15%', width: '30%', height: '60%',
                  border: '1.5px solid #E53935', borderRadius: '50%', borderRight: 'none', borderBottom: 'none',
                }} />
              </div>
            </div>
          )}

          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} className="absolute rounded-full pointer-events-none"
              style={{
                width: 6, height: 6,
                left: `${p.x}%`, top: `${p.y}%`,
                background: p.color,
                opacity: p.life / p.maxLife,
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
              }} />
          ))}

          {/* Event Message Overlay */}
          {showMessage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="font-black text-4xl tracking-widest text-center px-4"
                style={{
                  color: messageColor,
                  textShadow: `0 0 20px ${messageColor}, 0 3px 0 rgba(0,0,0,0.5)`,
                  animation: 'pop-in 0.2s ease-out',
                }}>
                {eventMessage}
              </div>
            </div>
          )}

          {/* Inning Break Overlay */}
          {gameStatus === 'INNING_BREAK' && (
            <div className="absolute inset-0 flex items-center justify-center z-50"
              style={{ background: 'rgba(10,22,40,0.85)' }}>
              <div className="text-center">
                <div className="text-2xl font-black tracking-widest" style={{ color: '#F5C518' }}>
                  {inningBreakMsg}
                </div>
                <div className="mt-2 text-sm" style={{ color: '#64748b' }}>
                  {isTopInning ? 'Simulating CPU offense...' : 'Get ready!'}
                </div>
              </div>
            </div>
          )}

          {/* AI Batting Overlay */}
          {gameStatus === 'AI_BATTING' && (
            <div className="absolute inset-0 flex items-center justify-center z-50"
              style={{ background: 'rgba(10,22,40,0.7)' }}>
              <div className="text-xl font-black tracking-widest animate-pulse" style={{ color: '#E53935' }}>
                CPU BATTING...
              </div>
            </div>
          )}

          {/* Pitch status indicator */}
          {gameStatus === 'PITCHING' && !ballVisible && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="text-xs font-bold tracking-widest animate-pulse px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.5)', color: '#94a3b8' }}>
                PITCHER WINDING UP...
              </div>
            </div>
          )}

          {gameStatus === 'BALL_FLYING' && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="text-sm font-black tracking-widest px-4 py-1 rounded-full"
                style={{
                  background: strikeZoneActive ? 'rgba(0,191,255,0.2)' : 'rgba(0,0,0,0.5)',
                  color: strikeZoneActive ? '#00BFFF' : '#94a3b8',
                  border: `1px solid ${strikeZoneActive ? '#00BFFF' : 'transparent'}`,
                }}>
                {strikeZoneActive ? '⚡ CLICK NOW!' : 'BALL INCOMING...'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes pulse-zone {
          from { box-shadow: 0 0 10px rgba(0,191,255,0.3); border-color: rgba(0,191,255,0.8); }
          to   { box-shadow: 0 0 25px rgba(0,191,255,0.8); border-color: #00BFFF; }
        }
        @keyframes pop-in {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
