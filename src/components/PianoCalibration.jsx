// Piano calibration — plays a reference note via the sampler and listens
// to what frequency the user's piano actually produces. Builds a cent-offset
// map stored in localStorage so PitchDetector can apply per-piano corrections.
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, CheckCircle } from "lucide-react";
import { playPianoNote } from "@/lib/pianoSampler";
import { getRMS } from "@/lib/audioDetector";
import { NOTES_BY_NAME } from "@/lib/puzzleEngine";

// Mini piano showing one octave (C4–B4) with the target note highlighted
function MiniPianoHint({ note }) {
  const whites = ["C4","D4","E4","F4","G4","A4","B4"];
  const blacks = [
    { note: "C#4", pos: 0.65 },
    { note: "D#4", pos: 1.65 },
    { note: "F#4", pos: 3.65 },
    { note: "G#4", pos: 4.65 },
    { note: "A#4", pos: 5.65 },
  ];
  const WKW = 22, WKH = 56, BKW = 13, BKH = 35;
  const totalW = whites.length * WKW;

  const noteLabel = (n) => n.replace("#","♯").replace(/[0-9]/g,"");

  return (
    <div className="flex flex-col items-center gap-2 my-3">
      <div className="text-xs text-muted-foreground">Find this key on your piano:</div>
      <svg viewBox={`0 0 ${totalW} ${WKH + 8}`} width={totalW} style={{ display: "block" }}>
        {whites.map((n, i) => {
          const isTarget = n === note;
          return (
            <g key={n}>
              <rect x={i * WKW + 0.5} y={2} width={WKW - 1} height={WKH - 2} rx={2}
                fill={isTarget ? "hsl(45, 80%, 68%)" : "hsl(0, 0%, 94%)"}
                stroke="hsl(220, 15%, 35%)" strokeWidth={0.5} />
              {isTarget && (
                <>
                  <circle cx={i * WKW + WKW / 2} cy={WKH - 8} r={5} fill="hsl(220, 20%, 15%)" />
                  <text x={i * WKW + WKW / 2} y={WKH + 7} textAnchor="middle" fontSize="8" fill="hsl(45, 60%, 78%)" fontFamily="sans-serif">
                    {noteLabel(n)}
                  </text>
                </>
              )}
            </g>
          );
        })}
        {blacks.map(({ note: n, pos }) => {
          const isTarget = n === note;
          const x = pos * WKW - BKW / 2;
          return (
            <g key={n}>
              <rect x={x} y={2} width={BKW} height={BKH} rx={1.5}
                fill={isTarget ? "hsl(45, 75%, 50%)" : "hsl(220, 20%, 10%)"}
                stroke="hsl(220, 15%, 5%)" strokeWidth={0.5} />
              {isTarget && (
                <circle cx={x + BKW / 2} cy={BKH - 5} r={3.5} fill="hsl(220, 20%, 10%)" />
              )}
            </g>
          );
        })}
      </svg>
      {note === "C4" && <div className="text-xs text-primary font-medium">↑ This is Middle C</div>}
    </div>
  );
}

const CALIBRATION_NOTES = ["C4", "A4", "E4", "G4"];
const NOTE_FREQUENCIES = Object.entries(NOTES_BY_NAME).map(([name, freq]) => ({ name, freq }));

export const CALIBRATION_KEY = "noteably_piano_calibration";

export function loadCalibration() {
  try { return JSON.parse(localStorage.getItem(CALIBRATION_KEY) || "null"); } catch { return null; }
}
export function saveCalibration(data) {
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(data));
}
export function clearCalibration() {
  localStorage.removeItem(CALIBRATION_KEY);
}

// NSDF pitch detection (self-contained)
function nsdPitch(buffer, sampleRate) {
  const N = buffer.length;
  const maxLag = Math.floor(N / 2);
  const nsdf = new Float32Array(maxLag);
  for (let tau = 0; tau < maxLag; tau++) {
    let acf = 0, norm = 0;
    for (let i = 0; i < N - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      norm += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    nsdf[tau] = norm < 1e-8 ? 0 : (2 * acf) / norm;
  }
  const peaks = [];
  let i = 1;
  while (i < maxLag - 1) {
    if (nsdf[i] > 0 && nsdf[i - 1] <= 0) {
      let peakVal = nsdf[i], peakIdx = i;
      while (i < maxLag - 1 && nsdf[i] > 0) {
        if (nsdf[i] > peakVal) { peakVal = nsdf[i]; peakIdx = i; }
        i++;
      }
      if (peakVal > 0.1) peaks.push({ tau: peakIdx, val: peakVal });
    }
    i++;
  }
  if (peaks.length === 0) return -1;
  const globalMax = Math.max(...peaks.map(p => p.val));
  const best = peaks.find(p => p.val >= 0.8 * globalMax);
  if (!best) return -1;
  const t = best.tau;
  const y0 = nsdf[Math.max(0, t - 1)], y1 = nsdf[t], y2 = nsdf[Math.min(maxLag - 1, t + 1)];
  const denom = y0 - 2 * y1 + y2;
  const refined = denom !== 0 ? t - 0.5 * (y2 - y0) / denom : t;
  return refined > 0 ? sampleRate / refined : -1;
}

function closestNoteWithCents(freq) {
  if (freq <= 0) return null;
  let best = null, minCents = Infinity;
  for (const { name, freq: f } of NOTE_FREQUENCIES) {
    const cents = 1200 * Math.log2(freq / f);
    const absCents = Math.abs(cents);
    if (absCents < minCents) { minCents = absCents; best = { name, cents, freq }; }
  }
  return minCents < 150 ? best : null;
}

const STEPS = [
  { id: "intro", title: "Calibrate Your Piano" },
  { id: "mic",   title: "Allow Microphone" },
  { id: "notes", title: "Play Along" },
  { id: "done",  title: "All Set!" },
];

export default function PianoCalibration({ onComplete }) {
  const [step, setStep] = useState("intro");
  const [micError, setMicError] = useState(null);
  const [noteIdx, setNoteIdx] = useState(0);
  const [noteResults, setNoteResults] = useState({}); // noteName → cents offset
  const [listening, setListening] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState(null);
  const [detectedNote, setDetectedNote] = useState(null);
  const [rms, setRms] = useState(0);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const bufferRef = useRef(null);
  const animRef = useRef(null);
  const runningRef = useRef(false);
  const capturedRef = useRef([]); // collect N readings per note

  const stopAudio = useCallback(() => {
    runningRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null; analyserRef.current = null;
    streamRef.current = null; bufferRef.current = null;
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  async function requestMic() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") await ctx.resume();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
      setStep("notes");
    } catch (e) {
      setMicError(e.name === "NotAllowedError"
        ? "Microphone permission denied. Please allow mic access and try again."
        : `Mic error: ${e.name} — ${e.message}`);
    }
  }

  const detectLoop = useCallback(() => {
    if (!runningRef.current) return;
    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const rmsVal = getRMS(bufferRef.current);
    setRms(rmsVal);
    if (rmsVal > 0.01) {
      const freq = nsdPitch(bufferRef.current, audioCtxRef.current.sampleRate);
      if (freq > 0) {
        setDetectedFreq(Math.round(freq));
        const match = closestNoteWithCents(freq);
        if (match) {
          setDetectedNote(match);
          capturedRef.current.push(match.cents);
          // After 30 consistent readings, accept this note
          if (capturedRef.current.length >= 30) {
            runningRef.current = false;
            cancelAnimationFrame(animRef.current);
            const avgCents = capturedRef.current.reduce((a, b) => a + b, 0) / capturedRef.current.length;
            const targetNote = CALIBRATION_NOTES[noteIdx];
            setNoteResults(r => ({ ...r, [targetNote]: avgCents }));
            setListening(false);
            capturedRef.current = [];
          }
        }
      }
    }
    animRef.current = requestAnimationFrame(detectLoop);
  }, [noteIdx]);

  function startListening() {
    capturedRef.current = [];
    setDetectedFreq(null);
    setDetectedNote(null);
    setListening(true);
    runningRef.current = true;
    detectLoop();
  }

  async function playAndListen() {
    const note = CALIBRATION_NOTES[noteIdx];
    await playPianoNote(note, 2.5, 0.9);
    // Small delay then start listening
    setTimeout(startListening, 400);
  }

  function finishCalibration() {
    const calibration = {
      offsets: noteResults,
      timestamp: Date.now(),
      notesTested: CALIBRATION_NOTES,
    };
    saveCalibration(calibration);
    stopAudio();
    onComplete(calibration);
  }

  function skip() {
    stopAudio();
    saveCalibration({ skipped: true, timestamp: Date.now() });
    onComplete(null);
  }

  const currentNote = CALIBRATION_NOTES[noteIdx];
  const allCaptured = noteIdx >= CALIBRATION_NOTES.length;
  const notesCaptured = Object.keys(noteResults).length;

  // Auto-advance to next note after capturing
  useEffect(() => {
    if (noteResults[currentNote] !== undefined && !listening && step === "notes") {
      const next = noteIdx + 1;
      if (next >= CALIBRATION_NOTES.length) {
        setStep("done");
      } else {
        setTimeout(() => setNoteIdx(next), 800);
      }
    }
  }, [noteResults, currentNote, listening, noteIdx, step]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Intro */}
        {step === "intro" && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎹</div>
            <h1 className="font-display text-3xl mb-3">Every Piano is Different</h1>
            <p className="text-muted-foreground text-sm mb-2">
              Acoustic and digital pianos have slightly different tuning. This quick calibration
              teaches the app to recognize <em>your</em> piano's exact sound.
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              You'll play 4 notes while the app listens and measures your piano's tuning offset.
              It only takes about 30 seconds.
            </p>
            <button
              onClick={() => setStep("mic")}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-3 hover:bg-primary/90 transition-all"
            >
              Start Calibration
            </button>
            <button onClick={skip} className="w-full text-sm text-muted-foreground hover:text-foreground py-2">
              Skip for now
            </button>
          </div>
        )}

        {/* Mic permission */}
        {step === "mic" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Mic className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl mb-3">Allow Microphone</h2>
            <p className="text-muted-foreground text-sm mb-6">
              The app needs microphone access to hear your piano. Your audio is processed
              locally — nothing is recorded or sent anywhere.
            </p>
            {micError && (
              <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-3 text-xs text-destructive mb-4">
                {micError}
              </div>
            )}
            <button
              onClick={requestMic}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-3 hover:bg-primary/90 transition-all"
            >
              Allow Microphone Access
            </button>
            <button onClick={skip} className="w-full text-sm text-muted-foreground hover:text-foreground py-2">
              Skip calibration
            </button>
          </div>
        )}

        {/* Note-by-note calibration */}
        {step === "notes" && (
          <div className="text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Note {Math.min(noteIdx + 1, CALIBRATION_NOTES.length)} of {CALIBRATION_NOTES.length}
            </div>
            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-1.5 mb-6 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(notesCaptured / CALIBRATION_NOTES.length) * 100}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentNote}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="bg-card border border-border rounded-2xl p-6 mb-5">
                  <div className="text-6xl font-heading text-primary mb-1">{currentNote?.replace("#", "♯")}</div>
                  <div className="text-xs text-muted-foreground">
                    {currentNote === "C4" ? "Middle C" :
                     currentNote === "A4" ? "Concert A (440 Hz)" :
                     currentNote === "E4" ? "E above middle C" : "G above middle C"}
                  </div>
                  <MiniPianoHint note={currentNote} />

                  {/* Volume meter */}
                  <div className="mt-4">
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 rounded-full ${rms > 0.01 ? "bg-green-500" : "bg-muted-foreground/30"}`}
                        style={{ width: `${Math.min(100, Math.round(rms * 600))}%` }}
                      />
                    </div>
                    {listening && rms < 0.01 && (
                      <div className="text-xs text-yellow-500 mt-1">Play the note louder — not hearing it yet</div>
                    )}
                  </div>

                  {listening && detectedNote && (
                    <div className="mt-3 text-xs font-mono">
                      <span className="text-primary">{detectedNote.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {Math.round(Math.abs(detectedNote.cents))} cents {detectedNote.cents > 0 ? "sharp" : "flat"}
                      </span>
                      <span className="text-muted-foreground ml-2">({detectedNote.freq ? Math.round(detectedNote.freq) : "—"} Hz)</span>
                    </div>
                  )}

                  {noteResults[currentNote] !== undefined && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Captured!
                    </div>
                  )}
                </div>

                {!listening && noteResults[currentNote] === undefined && (
                  <button
                    onClick={playAndListen}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play reference tone, then play {currentNote?.replace("#", "♯")} on your piano
                  </button>
                )}

                {listening && (
                  <div className="flex items-center justify-center gap-2 text-primary text-sm py-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    Listening… play {currentNote?.replace("#", "♯")} on your piano
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <button onClick={skip} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
              Skip calibration
            </button>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-display text-3xl mb-3">Piano Calibrated!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              The app has learned your piano's tuning. Note detection will now be much more accurate.
            </p>
            <div className="bg-card border border-border rounded-xl p-4 mb-6 text-xs font-mono space-y-1 text-left">
              {Object.entries(noteResults).map(([note, cents]) => (
                <div key={note} className="flex justify-between">
                  <span className="text-muted-foreground">{note}</span>
                  <span className={Math.abs(cents) < 20 ? "text-green-400" : Math.abs(cents) < 40 ? "text-yellow-400" : "text-orange-400"}>
                    {cents > 0 ? "+" : ""}{Math.round(cents)} cents
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={finishCalibration}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all"
            >
              Start Practicing →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
