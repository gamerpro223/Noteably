import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, RotateCcw, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

// ── Recording states ──
// idle → uploading_sheet → sheet_ready → recording → analyzing → reviewed

export default function RecordingReview() {
  const [stage, setStage] = useState("idle"); // idle | uploading_sheet | sheet_ready | recording | analyzing | reviewed
  const [sheetFile, setSheetFile] = useState(null);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [sheetTitle, setSheetTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Upload sheet music first
  async function handleSheetUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSheetFile(f);
    setStage("uploading_sheet");
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      setSheetUrl(file_url);
      // Quick title extract
      const titleRes = await base44.integrations.Core.InvokeLLM({
        prompt: "What is the title and composer of this sheet music? Reply with just the title (and composer if shown). If you can't tell, reply 'Unknown Piece'.",
        file_urls: [file_url],
      });
      setSheetTitle(typeof titleRes === "string" ? titleRes : "Your Piece");
      setStage("sheet_ready");
    } catch {
      setError("Failed to upload sheet music. Please try again.");
      setStage("idle");
    }
  }

  // Start/stop microphone recording
  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        analyzeRecording(blob);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      setStage("recording");
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  async function analyzeRecording(audioBlob) {
    setStage("analyzing");
    try {
      // Upload the audio recording
      const { file_url: audioFileUrl } = await base44.integrations.Core.UploadFile({ file: audioBlob });

      // Send both sheet music + audio to AI for comparison review
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert piano teacher. The user has uploaded sheet music and a recording of themselves playing it.

Sheet music: [attached as first file]
Recording: [attached as second file]

Listen to the recording carefully and compare it against the sheet music. Provide a detailed, encouraging but honest review covering:
1. Overall accuracy (which notes/passages sounded correct vs incorrect)
2. Rhythm and timing issues
3. Dynamics and expression
4. Specific measures or sections that need the most work
5. Specific technical exercises or practice strategies for each weak area
6. An overall score out of 10

Also extract 3-5 specific "weak spots" — short note sequences from the sheet music that the player struggled with — formatted as note arrays so we can generate targeted practice puzzles.`,
        file_urls: [sheetUrl, audioFileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            areas_to_improve: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  description: { type: "string" },
                  tip: { type: "string" },
                }
              }
            },
            weak_spots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  notes: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                }
              }
            },
          }
        },
      });

      setReview(result);
      setStage("reviewed");
    } catch {
      setError("Analysis failed. Please try again.");
      setStage("sheet_ready");
    }
  }

  function reset() {
    setStage("idle");
    setSheetFile(null);
    setSheetUrl(null);
    setSheetTitle("");
    setAudioUrl(null);
    setReview(null);
    setError("");
    setRecordingSeconds(0);
  }

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  // ── IDLE: upload sheet ──
  if (stage === "idle" || stage === "uploading_sheet") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-base mb-1">Step 1 — Upload Your Sheet Music</h3>
      <p className="text-xs text-muted-foreground mb-4">Upload the piece you want to play. Then record yourself and get an AI-assisted review.</p>
          <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${stage === "uploading_sheet" ? "opacity-60 pointer-events-none" : "border-border hover:border-primary/40"}`}>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.xml,.mxl,.musicxml" className="hidden" onChange={handleSheetUpload} />
            {stage === "uploading_sheet" ? (
              <><Loader2 className="w-8 h-8 text-primary animate-spin mb-2" /><span className="text-sm text-muted-foreground">Uploading & reading sheet music…</span></>
            ) : (
              <><Mic className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Click to upload sheet music</span><span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, MusicXML</span></>
            )}
          </label>
          {error && <p className="text-destructive text-xs mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  // ── SHEET READY: record yourself ──
  if (stage === "sheet_ready" || stage === "recording") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-primary/30 rounded-2xl p-5 flex items-center gap-3">
          <div className="text-2xl">🎼</div>
          <div>
            <div className="font-heading text-base">{sheetTitle}</div>
            <div className="text-xs text-muted-foreground">Sheet music loaded — ready to record</div>
          </div>
          <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Change</button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-5">
          <h3 className="font-heading text-base">Step 2 — Record Your Performance</h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs">Play the piece on your piano while recording. When done, stop and get your AI review.</p>

          {stage === "recording" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive pulse-ring" />
              <span className="font-mono text-2xl text-foreground">{formatTime(recordingSeconds)}</span>
              <span className="text-xs text-muted-foreground">Recording…</span>
            </motion.div>
          )}

          {stage === "sheet_ready" ? (
            <button onClick={startRecording}
              className="flex items-center gap-2 bg-destructive text-destructive-foreground font-semibold px-8 py-4 rounded-2xl text-base hover:bg-destructive/90 transition-all">
              <Mic className="w-5 h-5" /> Start Recording
            </button>
          ) : (
            <button onClick={stopRecording}
              className="flex items-center gap-2 bg-card border-2 border-destructive text-destructive font-semibold px-8 py-4 rounded-2xl text-base hover:bg-destructive/10 transition-all">
              <Square className="w-5 h-5 fill-destructive" /> Stop & Analyze
            </button>
          )}
        </div>
        {error && <p className="text-destructive text-xs text-center">{error}</p>}
      </div>
    );
  }

  // ── ANALYZING ──
  if (stage === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="font-heading text-lg">Analyzing your performance…</div>
        <p className="text-xs text-muted-foreground text-center max-w-xs">AI is comparing your recording to the sheet music and looking for broad practice feedback. This takes about 30 seconds.</p>
        {audioUrl && (
          <audio src={audioUrl} controls className="mt-2 w-64 opacity-50" />
        )}
      </div>
    );
  }

  // ── REVIEWED ──
  if (stage === "reviewed" && review) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Score header */}
        <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center">
          <div className="font-heading text-5xl text-primary mb-1">{review.overall_score}<span className="text-2xl text-muted-foreground">/10</span></div>
          <div className="flex justify-center gap-0.5 mb-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(review.overall_score) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            ))}
          </div>
          <div className="font-heading text-base mb-2">{sheetTitle}</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.summary}</p>
        </div>

        {/* Strengths */}
        {review.strengths?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-heading text-sm text-success mb-3">✅ What you did well</h4>
            <ul className="space-y-1.5">
              {review.strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-success mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas to improve */}
        {review.areas_to_improve?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-heading text-sm text-primary mb-3">🎯 Areas to improve</h4>
            <div className="space-y-4">
              {review.areas_to_improve.map((area, i) => (
                <div key={i} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                  <div className="font-medium text-sm mb-0.5">{area.area}</div>
                  <p className="text-xs text-muted-foreground mb-1">{area.description}</p>
                  <p className="text-xs text-primary/80 italic">💡 {area.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak spots → targeted puzzles */}
        {review.weak_spots?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-heading text-sm mb-1">🧩 Suggested Practice Puzzles</h4>
            <p className="text-xs text-muted-foreground mb-3">Practice these passages suggested by the AI review.</p>
            <div className="space-y-2">
              {review.weak_spots.map((spot, i) => (
                <WeakSpotPuzzle key={i} spot={spot} />
              ))}
            </div>
          </div>
        )}

        {/* Recording playback */}
        {audioUrl && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Your Recording</div>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {/* Try again */}
        <button onClick={reset} className="w-full flex items-center justify-center gap-2 border border-border text-sm text-muted-foreground py-3 rounded-xl hover:border-primary/40 hover:text-foreground transition-all">
          <RotateCcw className="w-4 h-4" /> Record Again / New Piece
        </button>
      </motion.div>
    );
  }

  return null;
}

// Inline mini puzzle for a weak spot
function WeakSpotPuzzle({ spot }) {
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState("");
  const [correct, setCorrect] = useState(false);

  function check() {
    // simple: user types the note names separated by spaces/commas and we compare
    const typed = input.toLowerCase().replace(/,/g, " ").split(/\s+/).filter(Boolean);
    const expected = spot.notes.map(n => n.toLowerCase().replace(/[45678]/g, ""));
    const isCorrect = expected.every(n => typed.some(t => t.includes(n.replace("#", "").replace("b", ""))));
    setCorrect(isCorrect);
    setAnswered(true);
  }

  return (
    <div className="border border-border/60 rounded-xl p-3">
      <div className="text-sm font-medium mb-0.5">{spot.label}</div>
      <div className="text-xs text-muted-foreground mb-2">{spot.description}</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {spot.notes.map((n, i) => (
          <span key={i} className={`text-xs px-2 py-0.5 rounded-md font-mono ${answered && correct ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{n}</span>
        ))}
      </div>
      {!answered ? (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="Type the notes (e.g. C E G)…"
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50"
          />
          <button onClick={check} className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all">
            Check
          </button>
        </div>
      ) : (
        <div className={`text-xs font-medium ${correct ? "text-success" : "text-destructive"}`}>
          {correct ? "✅ Correct! Notes memorized." : `Not quite — the notes are: ${spot.notes.join(", ")}`}
          {!correct && <button onClick={() => { setAnswered(false); setInput(""); }} className="ml-2 underline text-muted-foreground">Try again</button>}
        </div>
      )}
    </div>
  );
}
