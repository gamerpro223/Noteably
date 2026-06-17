import React, { useState, useRef, useCallback, useEffect } from "react";
import { CheckCircle, ChevronRight, Volume2, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateExercise } from "@/lib/exerciseBank";
import { getNoteDisplayName } from "@/lib/puzzleEngine";
import { PitchDetector } from "@/lib/audioDetector";
import { playExercise } from "@/lib/scorePlayback";
import SheetMusic from "@/components/SheetMusic";
import FullPianoKeyboard from "@/components/FullPianoKeyboard";
import { loadCalibration } from "@/components/PianoCalibration";
import { applyAnswerNote, createAnswerState, getAnswerPreviewNotes } from "@/lib/answerEngine";

const PASS_COUNT = 10; // correct in a row to pass
const testHandForLevel = (level) => level >= 12 ? "both" : "right";
const generateTestExercise = (level) => generateExercise(level, testHandForLevel(level), { depth: 9 });

export default function DailyTest({ level, title, subtitle, onPass, onSkip }) {
  const [puzzle, setPuzzle] = useState(() => generateTestExercise(level));
  const [detectedNotes, setDetectedNotes] = useState([]);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [result, setResult] = useState(null); // "correct" | "wrong"
  const [isFlipped, setIsFlipped] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false);
  const playbackRef = useRef(null);
  const resultTimeout = useRef(null);

  const detectorRef = useRef(null);
  const puzzleNotesBuffer = useRef(createAnswerState());
  const puzzleRef = useRef(puzzle);
  const resultRef = useRef(result);
  const handleCorrectRef = useRef(null);
  const onNoteRef = useRef(null);

  puzzleRef.current = puzzle;
  resultRef.current = result;

  useEffect(() => {
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
  }, [puzzle?.id]);

  // Auto-start mic
  useEffect(() => {
    async function startMic() {
      try {
        const cal = loadCalibration();
        const offsets = cal?.offsets || null;
        const detector = new PitchDetector();
        await detector.start(handleDetectedNote, null, undefined, offsets);
        detectorRef.current = detector;
        setIsListening(true);
      } catch {}
    }
    startMic();
    return () => {
      clearTimeout(resultTimeout.current);
      playbackRef.current?.stop();
      detectorRef.current?.stop();
      detectorRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function handleKeyPress(note) {
    if (result || isFlipped) return;
    const response = applyAnswerNote(puzzle, puzzleNotesBuffer.current, note);
    puzzleNotesBuffer.current = response.state;
    setDetectedNotes(response.detectedNotes);
    if (response.complete) handleCorrectRef.current?.();
  }

  handleCorrectRef.current = function handleCorrect() {
    if (resultRef.current === "correct") return;
    clearTimeout(resultTimeout.current);
    stopPlayback();
    setResult("correct");
    puzzleNotesBuffer.current = createAnswerState();
    setDetectedNotes([]);
    const newCount = consecutiveCorrect + 1;
    setConsecutiveCorrect(newCount);
    if (newCount >= PASS_COUNT) {
      resultTimeout.current = setTimeout(() => onPass(), 1200);
      return;
    }
    resultTimeout.current = setTimeout(() => {
      setResult(null);
      setIsFlipped(false);
      setPuzzle(generateTestExercise(level));
    }, 800);
  };

  function stopPlayback() {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setIsPlaybackLoading(false);
    setIsPlaying(false);
  }

  async function soundItOut() {
    if (!puzzle) return;
    if (isPlaying) { stopPlayback(); return; }

    const wasListening = !!detectorRef.current;
    if (wasListening) { detectorRef.current.stop(); detectorRef.current = null; setIsListening(false); }
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
        if (wasListening) {
          setTimeout(async () => {
            try {
              const cal = loadCalibration();
              const detector = new PitchDetector();
              await detector.start(handleDetectedNote, null, undefined, cal?.offsets || null);
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

  async function toggleMic() {
    if (isListening) {
      detectorRef.current?.stop(); detectorRef.current = null; setIsListening(false); return;
    }
    try {
      const cal = loadCalibration();
      const detector = new PitchDetector();
      await detector.start(handleDetectedNote, null, undefined, cal?.offsets || null);
      detectorRef.current = detector;
      setIsListening(true);
    } catch { setMicError("Mic access denied."); }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🎯</div>
          <h1 className="font-display text-2xl mb-1">{title}</h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
          <button onClick={onSkip} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
            Skip this test
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 bg-secondary rounded-full h-2">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(consecutiveCorrect / PASS_COUNT) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono">{consecutiveCorrect}/{PASS_COUNT}</span>
        </div>

        {/* Flashcard */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4 relative overflow-hidden">
          <AnimatePresence>
            {result === "correct" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 rounded-2xl">
                <div className="text-center">
                  <CheckCircle className="w-10 h-10 text-primary mx-auto mb-1" />
                  <div className="font-heading text-lg text-primary">Correct!</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isFlipped ? (
            <>
              <div className="overflow-x-auto">
            <SheetMusic exercise={puzzle} highlightNotes={detectedNotes} />
          </div>
              <div className="text-center mt-2 font-heading text-sm text-foreground">{puzzle.description}</div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs uppercase tracking-wider text-primary font-medium">Answer</div>
              <div className="font-heading text-base">{puzzle.description}</div>
              <FullPianoKeyboard highlightNotes={puzzle.notes || []} />
            </div>
          )}
        </div>

        {/* Note chips */}
        {!isFlipped && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {getAnswerPreviewNotes(puzzle).map((note, i) => (
              <div key={i} className={`px-3 py-1 rounded-lg border text-sm font-medium transition-all ${
                detectedNotes.includes(note) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              }`}>
                {getNoteDisplayName(note)}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={soundItOut} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isPlaying ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
            <Volume2 className="w-3.5 h-3.5" />
            {isPlaybackLoading ? "Loading…" : isPlaying ? "Stop" : "Sound It Out"}
          </button>
          <button onClick={() => { stopPlayback(); setIsFlipped(f => !f); puzzleNotesBuffer.current = createAnswerState(); setDetectedNotes([]); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isFlipped ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {isFlipped ? "Hide Answer" : "Show Answer"}
          </button>
          <button onClick={toggleMic} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isListening ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground"}`}>
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {isListening ? "Listening…" : "Enable Mic"}
          </button>
          <button onClick={() => { clearTimeout(resultTimeout.current); stopPlayback(); puzzleNotesBuffer.current = createAnswerState(); setDetectedNotes([]); setIsFlipped(false); setPuzzle(generateTestExercise(level)); setResult(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all">
            <ChevronRight className="w-3.5 h-3.5" /> Skip Puzzle
          </button>
        </div>
        {micError && <p className="text-destructive text-xs text-center mt-2">{micError}</p>}
      </motion.div>
    </div>
  );
}
