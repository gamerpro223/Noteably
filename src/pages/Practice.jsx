import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Mic, MicOff, ChevronRight, Music, Home, CheckCircle, Volume2, RotateCcw, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SheetMusic from "@/components/SheetMusic";
import FullPianoKeyboard from "@/components/FullPianoKeyboard";
import LevelSelect, { TierSelect } from "@/pages/LevelSelect";
import DailyTest from "@/components/DailyTest";
import { generateExercise, generateChopinExercise } from "@/lib/exerciseBank";
import { XP_TO_TEST } from "@/lib/puzzleEngine";
import { PitchDetector, playTone } from "@/lib/audioDetector";
import { stopAllNotes } from "@/lib/pianoSampler";
import { playExercise } from "@/lib/scorePlayback";
import PianoCalibration, { loadCalibration } from "@/components/PianoCalibration";
import { applyAnswerNote, createAnswerState } from "@/lib/answerEngine";
import { loadSubscriptionStatus } from "@/lib/subscription";

const CORRECT_TO_STREAK = 10;
const CHOPIN_LEVEL = 20;
const CHOPIN_TIME_LIMIT = 8;
const DEFAULT_TIME_LIMIT = 15;
const MAX_LEVEL = 20;
const XP_PER_CORRECT = (level) => 5 + level; // modest XP per answer — no auto level-up

function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i < current ? "w-3 h-3 bg-primary" : i === current ? "w-3 h-3 bg-primary/40 ring-2 ring-primary/60" : "w-2 h-2 bg-secondary"
        }`} />
      ))}
    </div>
  );
}

export default function Practice() {
  const [puzzle, setPuzzle] = useState(null);
  const [level, setLevel] = useState(1);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [detectedNotes, setDetectedNotes] = useState([]);
  const [result, setResult] = useState(null);
  const [xp, setXp] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(null);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [revealedNotes, setRevealedNotes] = useState([]);
  const [skipsUsed, setSkipsUsed] = useState(new Set());
  const [hand, setHand] = useState("right");
  const [timerOn, setTimerOn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [rawFreq, setRawFreq] = useState(null);
  const [calibration, setCalibration] = useState(undefined);
  const [progressId, setProgressId] = useState(null);
  const [showLevelBrowser, setShowLevelBrowser] = useState(false);

  // Test flow states
  // "none" | "end_of_day_offer" | "end_of_day_test" | "recap_offer" | "recap_test"
  const [testFlow, setTestFlow] = useState("none");

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false);
  const playbackRef = useRef(null);

  const detectorRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const resultTimeout = useRef(null);
  const puzzleNotesBuffer = useRef(createAnswerState());
  const puzzleRef = useRef(null);
  const resultRef = useRef(null);
  const handleCorrectRef = useRef(null);
  const onNoteRef = useRef(null);

  puzzleRef.current = puzzle;
  resultRef.current = result;

  const isChopin = level === CHOPIN_LEVEL && timerOn;
  const activeTimerOn = timerOn || isChopin;
  const puzzleTimeLimit = isChopin ? CHOPIN_TIME_LIMIT : DEFAULT_TIME_LIMIT;

  useEffect(() => {
    const cal = loadCalibration();
    setCalibration(cal);
  }, []);

  useEffect(() => {
    async function check() {
      try {
        const status = await loadSubscriptionStatus();
        setIsSubscribed(status.isSubscribed);
      } catch { setIsSubscribed(false); }
    }
    check();
  }, []);

  useEffect(() => {
    async function loadProgress() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { setShowLevelSelect(true); return; }
        const records = await base44.entities.UserProgress.list();
        if (records.length > 0) {
          const p = records[0];
          setLevel(p.current_level || 1);
          setXp(p.total_xp || 0);
          setProgressId(p.id);
          setShowLevelSelect(false);
          // Check if there's a next-day recap test waiting
          const today = new Date().toISOString().split("T")[0];
          if (p.recap_test_pending && p.level_test_date !== today) {
            setTestFlow("recap_offer");
          }
        } else {
          setShowLevelSelect(true);
        }
      } catch { setShowLevelSelect(true); }
    }
    loadProgress();
  }, []);

  function startTimer(limit) {
    clearInterval(timerIntervalRef.current);
    setTimeLeft(limit);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
      if (prev <= 1) {
      clearInterval(timerIntervalRef.current);
      stopPlayback();
      stopAllNotes();
      puzzleNotesBuffer.current = createAnswerState();
      setDetectedNotes([]);
      setRevealedNotes([]);
      setIsFlipped(false);
      setResult(null);
      setPuzzle(isChopin ? generateChopinExercise(hand) : generateExercise(level, hand));
      return null;
      }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerIntervalRef.current);
    setTimeLeft(null);
  }

  useEffect(() => () => {
    clearInterval(timerIntervalRef.current);
    clearTimeout(resultTimeout.current);
    playbackRef.current?.stop();
    detectorRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!showLevelSelect && isSubscribed === true) {
      setPuzzle(isChopin ? generateChopinExercise(hand) : generateExercise(level, hand));
    }
  }, [showLevelSelect, isSubscribed, level, isChopin]);

  useEffect(() => {
    if (showLevelSelect || isSubscribed === null || isSubscribed === false) return;
    if (detectorRef.current) return;
    async function autoStartMic() {
      try {
        const cal = loadCalibration();
        const offsets = cal?.offsets || null;
        const detector = new PitchDetector();
        await detector.start(handleDetectedNote, ({ freq }) => setRawFreq(freq > 0 ? Math.round(freq) : null), undefined, offsets);
        detectorRef.current = detector;
        setIsListening(true);
        puzzleNotesBuffer.current = createAnswerState();
      } catch {}
    }
    autoStartMic();
    return () => { detectorRef.current?.stop(); detectorRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLevelSelect, isSubscribed]);

  useEffect(() => {
    if (!puzzle || result) return;
    if (activeTimerOn) startTimer(puzzleTimeLimit);
    else stopTimer();
    return () => clearInterval(timerIntervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.id, activeTimerOn]);

  useEffect(() => {
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
  }, [puzzle?.id]);

  async function handleLevelSelect(tierKey, startLevel) {
    setLevel(startLevel);
    if (tierKey === "chopin") setTimerOn(false);
    setShowLevelSelect(false);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const records = await base44.entities.UserProgress.list();
      if (records.length === 0) {
        const created = await base44.entities.UserProgress.create({
          current_level: startLevel,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          daily_goal_minutes: 10,
          total_puzzles_completed: 0,
          pending_level_test: false,
          recap_test_pending: false,
        });
        setProgressId(created.id);
      } else {
        setProgressId(records[0].id);
      }
    } catch {}
  }

  async function saveSession(finalCorrect, finalXp) {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const today = new Date().toISOString().split("T")[0];
      await base44.entities.PracticeSession.create({
        date: today,
        duration_seconds: 0,
        puzzles_completed: finalCorrect,
        puzzles_correct: finalCorrect,
        xp_earned: finalXp,
      });
      const records = await base44.entities.UserProgress.list();
      if (records.length > 0) {
        const p = records[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const newStreak = p.last_practice_date === yesterday ? (p.current_streak || 0) + 1 : 1;
        await base44.entities.UserProgress.update(p.id, {
          total_xp: (p.total_xp || 0) + finalXp,
          current_streak: newStreak,
          longest_streak: Math.max(p.longest_streak || 0, newStreak),
          last_practice_date: today,
          total_puzzles_completed: (p.total_puzzles_completed || 0) + finalCorrect,
          // Mark a level test as available (end-of-day optional test)
          pending_level_test: true,
          level_test_date: today,
        });
      }
    } catch {}
  }

  async function handleTestPassed() {
    // User passed the level test — advance level
    const newLevel = Math.min(MAX_LEVEL, level + 1);
    setLevel(newLevel);
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const records = await base44.entities.UserProgress.list();
      if (records.length > 0) {
        await base44.entities.UserProgress.update(records[0].id, {
          current_level: newLevel,
          pending_level_test: false,
          recap_test_pending: true, // next day recap
          recap_test_level: level,
        });
      }
    } catch {}
    setTestFlow("none");
    setSessionDone(true);
  }

  async function handleTestSkipped() {
    setTestFlow("none");
    setSessionDone(true);
    // Clear pending test so it doesn't keep re-appearing
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const records = await base44.entities.UserProgress.list();
      if (records.length > 0) {
        await base44.entities.UserProgress.update(records[0].id, { pending_level_test: false });
      }
    } catch {}
  }

  async function handleRecapPassed() {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const records = await base44.entities.UserProgress.list();
      if (records.length > 0) {
        await base44.entities.UserProgress.update(records[0].id, { recap_test_pending: false });
      }
    } catch {}
    setTestFlow("none");
  }

  async function handleRecapSkipped() {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const records = await base44.entities.UserProgress.list();
      if (records.length > 0) {
        await base44.entities.UserProgress.update(records[0].id, { recap_test_pending: false });
      }
    } catch {}
    setTestFlow("none");
  }

  async function toggleListening() {
    if (isListening) {
      detectorRef.current?.stop();
      detectorRef.current = null;
      setIsListening(false);
      return;
    }
    setMicError("");
    try {
      const cal = loadCalibration();
      const offsets = cal?.offsets || null;
      const detector = new PitchDetector();
      await detector.start(handleDetectedNote, ({ freq }) => setRawFreq(freq > 0 ? Math.round(freq) : null), undefined, offsets);
      detectorRef.current = detector;
      setIsListening(true);
      puzzleNotesBuffer.current = createAnswerState();
    } catch {
      setMicError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  onNoteRef.current = (note) => {
    const currentPuzzle = puzzleRef.current;
    const currentResult = resultRef.current;
    if (!currentPuzzle || currentResult) return;
    const response = applyAnswerNote(currentPuzzle, puzzleNotesBuffer.current, note);
    puzzleNotesBuffer.current = response.state;
    setDetectedNotes(response.detectedNotes);
    if (response.complete) handleCorrectRef.current?.();
  };

  const handleDetectedNote = useCallback((note) => { onNoteRef.current?.(note); }, []);

  handleCorrectRef.current = handleCorrect;
  function handleCorrect() {
    if (resultRef.current === "correct") return;
    clearTimeout(resultTimeout.current);
    stopTimer();
    stopPlayback();
    setResult("correct");
    const earnedXp = XP_PER_CORRECT(level);
    const newCorrect = sessionCorrect + 1;
    const newXp = xp + earnedXp;
    setSessionCorrect(newCorrect);
    setXp(newXp);
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
    setIsFlipped(false);
    try { playTone(880, 0.25); setTimeout(() => playTone(1108, 0.2), 140); } catch {}

    // Session done at CORRECT_TO_STREAK — offer test only if user has enough XP for the gate
    if (newCorrect >= CORRECT_TO_STREAK) {
      resultTimeout.current = setTimeout(() => {
        setResult(null);
        saveSession(newCorrect, newXp);
        const xpNeeded = XP_TO_TEST[level] ?? Infinity;
        if (newXp >= xpNeeded && level < MAX_LEVEL) {
          setTestFlow("end_of_day_offer");
        } else {
          setSessionDone(true);
        }
      }, 1000);
      return;
    }

    resultTimeout.current = setTimeout(() => {
      stopPlayback();
      stopAllNotes();
      setResult(null);
      setPuzzle(isChopin ? generateChopinExercise(hand) : generateExercise(level, hand));
    }, 800);
  }

  function handleKeyPress(note) {
    if (result || isFlipped) return;
    const response = applyAnswerNote(puzzle, puzzleNotesBuffer.current, note);
    puzzleNotesBuffer.current = response.state;
    setDetectedNotes(response.detectedNotes);
    if (response.complete) handleCorrect();
  }

  function skipPuzzle() {
    if (!puzzle) return;
    clearTimeout(resultTimeout.current);
    stopPlayback();
    stopAllNotes();
    const alreadySkipped = skipsUsed.has(puzzle.id);
    if (!alreadySkipped) {
      const newSkips = new Set(skipsUsed);
      newSkips.add(puzzle.id);
      setSkipsUsed(newSkips);
    }
    setResult(null);
    setIsFlipped(false);
    setRevealedNotes([]);
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
    setPuzzle(isChopin ? generateChopinExercise(hand) : generateExercise(level, hand));
  }

  function changeHand(newHand) {
    clearTimeout(resultTimeout.current);
    stopPlayback();
    stopAllNotes();
    setHand(newHand);
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
    setIsFlipped(false);
    setPuzzle(isChopin ? generateChopinExercise(newHand) : generateExercise(level, newHand));
  }

  const stopPlayback = useCallback(() => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setIsPlaybackLoading(false);
    setIsPlaying(false);
  }, []);

  async function soundItOut() {
    if (!puzzle) return;

    // If already playing, stop
    if (isPlaying) {
      stopPlayback();
      return;
    }

    // Pause mic while playing
    const wasListening = !!detectorRef.current;
    if (wasListening) {
      detectorRef.current.stop();
      detectorRef.current = null;
      setIsListening(false);
    }
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
    setIsPlaybackLoading(true);
    setIsPlaying(true);

    const ctrl = playExercise(puzzle, {
      onReady: () => {
        setIsPlaybackLoading(false);
      },
      onFinish: () => {
        setIsPlaybackLoading(false);
        setIsPlaying(false);
        playbackRef.current = null;
        // Restart mic after playback finishes
        if (wasListening) {
          setTimeout(async () => {
            try {
              const cal = loadCalibration();
              const offsets = cal?.offsets || null;
              const detector = new PitchDetector();
              await detector.start(handleDetectedNote, ({ freq }) => setRawFreq(freq > 0 ? Math.round(freq) : null), undefined, offsets);
              detectorRef.current = detector;
              setIsListening(true);
              puzzleNotesBuffer.current = createAnswerState();
            } catch {}
          }, 400);
        }
      },
    });
    playbackRef.current = ctrl;
  }

  // ── Gates ──
  if (calibration === undefined) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }
  if (calibration === null) {
    return <PianoCalibration onComplete={(cal) => setCalibration(cal || { skipped: true })} />;
  }
  if (isSubscribed === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }
  if (isSubscribed === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl mb-3">Premium Feature</h2>
          <p className="text-muted-foreground mb-6 text-sm">Subscribe to access unlimited piano puzzles.</p>
          <Link to="/" className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-center hover:bg-primary/90 transition-all mb-3">
            Get Noteably — $5/month
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">Back to home</Link>
        </div>
      </div>
    );
  }
  if (showLevelSelect) {
    return <TierSelect onSelect={handleLevelSelect} />;
  }

  // Level browser (revisit any unlocked level)
  if (showLevelBrowser) {
    return (
      <LevelSelect
        onSelect={(tierKey, lvl) => {
          clearTimeout(resultTimeout.current);
          stopPlayback();
          stopAllNotes();
          setLevel(lvl);
          puzzleNotesBuffer.current = createAnswerState();
          setDetectedNotes([]);
          setRevealedNotes([]);
          setIsFlipped(false);
          setResult(null);
          setSessionCorrect(0);
          setPuzzle(generateExercise(lvl, hand));
          setShowLevelBrowser(false);
          if (lvl !== 20) setTimerOn(false);
        }}
        currentLevel={level}
        totalXp={xp}
        onCancel={() => setShowLevelBrowser(false)}
      />
    );
  }

  // ── Recap test offer (next-day) ──
  if (testFlow === "recap_offer") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔁</div>
          <h1 className="font-display text-3xl mb-2">Quick Recap</h1>
          <p className="text-muted-foreground mb-2 text-sm">Yesterday you leveled up to Level {level}. Want a quick review to lock it in?</p>
          <p className="text-xs text-muted-foreground mb-8">10 correct in a row to complete. Totally optional.</p>
          <button onClick={() => setTestFlow("recap_test")} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-3 hover:bg-primary/90 transition-all">
            Take the Recap Test
          </button>
          <button onClick={handleRecapSkipped} className="block w-full text-sm text-muted-foreground hover:text-foreground">
            Skip, just practice
          </button>
        </motion.div>
      </div>
    );
  }

  if (testFlow === "recap_test") {
    return (
      <DailyTest
        level={level}
        title="Recap Test"
        subtitle={`Level ${level} review — 10 correct in a row`}
        onPass={handleRecapPassed}
        onSkip={handleRecapSkipped}
      />
    );
  }

  // ── End-of-day test offer ──
  if (testFlow === "end_of_day_offer") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="font-display text-3xl mb-2">Streak kept!</h1>
          <p className="text-muted-foreground mb-2 text-sm">Great session! You completed today's practice.</p>
          <p className="text-sm text-foreground font-medium mb-6">Ready to test yourself and level up to Level {Math.min(MAX_LEVEL, level + 1)}?</p>
          <p className="text-xs text-muted-foreground mb-6">Get 10 correct in a row to advance. Totally optional.</p>
          <button onClick={() => setTestFlow("end_of_day_test")} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-3 hover:bg-primary/90 transition-all">
            Take the Level Test
          </button>
          <button onClick={handleTestSkipped} className="block w-full text-sm text-muted-foreground hover:text-foreground py-2">
            Skip for now
          </button>
        </motion.div>
      </div>
    );
  }

  if (testFlow === "end_of_day_test") {
    return (
      <DailyTest
        level={level}
        title="Level Up Test"
        subtitle={`10 correct in a row → advance to Level ${Math.min(MAX_LEVEL, level + 1)}`}
        onPass={handleTestPassed}
        onSkip={handleTestSkipped}
      />
    );
  }

  // ── Session complete (after test skip or already done today) ──
  if (sessionDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-display text-3xl mb-2">All done for today!</h1>
          <p className="text-muted-foreground mb-8 text-sm">Come back tomorrow to keep your streak going.</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[{ label: "Correct", value: sessionCorrect }, { label: "XP Earned", value: xp }, { label: "Level", value: level }].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl font-heading text-primary">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
          <button onClick={() => { stopPlayback(); stopAllNotes(); setSessionDone(false); setSessionCorrect(0); puzzleNotesBuffer.current = createAnswerState(); setDetectedNotes([]); setRevealedNotes([]); setIsFlipped(false); setResult(null); setPuzzle(generateExercise(level, hand)); }}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-3 hover:bg-primary/90 transition-all">
            Keep Practicing
          </button>
          <Link to="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">View Dashboard</Link>
        </motion.div>
      </div>
    );
  }

  const canSkip = puzzle && !skipsUsed.has(puzzle.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Home className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex flex-col items-center gap-1">
          <ProgressDots current={sessionCorrect} total={CORRECT_TO_STREAK} />
          <div className="text-xs text-muted-foreground">{sessionCorrect}/{CORRECT_TO_STREAK} to streak</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-primary font-medium">{xp} XP</span>
          <button onClick={() => setTimerOn(t => !t)} title={timerOn ? "Timer on" : "Timer off"}
            className={`p-1.5 rounded-lg transition-all ${timerOn ? "bg-primary/20 text-primary" : "hover:bg-secondary text-muted-foreground"}`}>
            <Timer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timer bar */}
      {activeTimerOn && timeLeft !== null && (
        <div className="w-full h-1.5 bg-secondary">
          <div className={`h-full transition-all duration-1000 ${timeLeft <= 3 ? "bg-destructive" : isChopin ? "bg-red-500" : "bg-primary"}`}
            style={{ width: `${(timeLeft / puzzleTimeLimit) * 100}%` }} />
        </div>
      )}
      {activeTimerOn && timeLeft !== null && (
        <div className={`text-center text-xs font-mono py-0.5 ${timeLeft <= 3 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
          {timeLeft}s
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-3 gap-3">
        {/* Hand + level row */}
        <div className="flex items-center justify-between w-full max-w-lg">
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {[["right","R. Hand"],["left","L. Hand"],["both","Both"]].map(([h, label]) => (
              <button key={h} onClick={() => changeHand(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${hand === h ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowLevelBrowser(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:border-primary/60 hover:bg-primary/10 ${isChopin ? "bg-red-950/30 border-red-900/60 text-red-400" : "bg-secondary border-border text-foreground"}`}>
            <span>{isChopin ? "💀 Chopin Mode" : `Level ${level}`}</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
          </button>
        </div>

        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {puzzle?.type === "chord" ? "Chord" : puzzle?.type === "two-hand" ? "Both Hands" : puzzle?.type === "virtuoso" ? "Virtuoso" : puzzle?.type === "sequence" ? "Sequence" : "Single Note"}
          {puzzle?.measures?.length > 1 && <span className="ml-2 text-muted-foreground/60">· {puzzle.measures.length} measures</span>}
        </div>

        {/* Flashcard */}
        <div className="w-full max-w-2xl relative">
          <AnimatePresence mode="wait">
            {puzzle && (
              <motion.div key={puzzle.id + (isFlipped ? "-flipped" : "-front")}
                initial={{ opacity: 0, x: isFlipped ? 0 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isFlipped ? 0 : -30 }}
                transition={{ duration: 0.25 }}>
                {!isFlipped ? (
                  <div className="bg-card border border-border rounded-2xl px-4 py-5 relative overflow-hidden">
                    <AnimatePresence>
                      {result === "correct" && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 rounded-2xl">
                          <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-2" />
                            <div className="font-heading text-xl text-primary">Correct!</div>
                            <div className="text-xs text-muted-foreground mt-1">+{XP_PER_CORRECT(level)} XP</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Score notation — scrollable for dense exercises */}
                    <div className="overflow-x-auto">
                      <SheetMusic exercise={puzzle} highlightNotes={detectedNotes} />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-sm text-muted-foreground font-medium">{puzzle.title || puzzle.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-primary/40 rounded-2xl px-4 py-5 flex flex-col items-center gap-3">
                    <div className="text-xs uppercase tracking-wider text-primary font-medium">Answer — tap a note to reveal it</div>
                    <div className="overflow-x-auto w-full">
                      <SheetMusic
                        exercise={puzzle}
                        highlightNotes={revealedNotes}
                        onNoteClick={(note) => setRevealedNotes(prev =>
                          prev.includes(note) ? prev.filter(x => x !== note) : [...prev, note]
                        )}
                      />
                    </div>
                    <div className="text-sm text-foreground font-medium text-center">{puzzle.title || puzzle.description}</div>
                    <div className="text-xs text-muted-foreground italic">{puzzle.hint}</div>
                    <div className="w-full mt-1">
                      <FullPianoKeyboard highlightNotes={revealedNotes} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-lg">
          <button onClick={soundItOut} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isPlaying ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
            <Volume2 className="w-3.5 h-3.5" />
            {isPlaybackLoading ? "Loading…" : isPlaying ? "Stop" : "Sound It Out"}
          </button>
          <button onClick={() => { stopPlayback(); stopAllNotes(); setIsFlipped(f => !f); puzzleNotesBuffer.current = createAnswerState(); setDetectedNotes([]); setRevealedNotes([]); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isFlipped ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
            <RotateCcw className="w-3.5 h-3.5" />
            {isFlipped ? "Hide Answer" : "Show Answer"}
          </button>
          <button onClick={toggleListening}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isListening ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {isListening ? "Listening…" : "Enable Mic"}
          </button>
          <button onClick={skipPuzzle} disabled={!canSkip}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all ${canSkip ? "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground" : "border-border/30 text-muted-foreground/30 cursor-not-allowed"}`}>
            <ChevronRight className="w-3.5 h-3.5" />
            Skip {!canSkip && "(used)"}
          </button>
        </div>

        {micError && <p className="text-destructive text-xs text-center max-w-xs">{micError}</p>}
      </div>
    </div>
  );
}
