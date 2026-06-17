import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Music2, BookOpen, FileMusic, Loader2, Sparkles, Mic } from "lucide-react";
import RecordingReview from "@/components/RecordingReview";
import { base44 } from "@/api/base44Client";
import { loadSubscriptionStatus } from "@/lib/subscription";

// ── Structured exercise generator ──
const EXERCISE_TYPES = [
  { id: "hanon", label: "Hanon Finger Exercise", icon: "🖐️", desc: "Classic finger independence patterns" },
  { id: "scale", label: "Major/Minor Scales", icon: "🎼", desc: "Full octave scale runs in any key" },
  { id: "arpeggio", label: "Arpeggio Practice", icon: "🌊", desc: "Broken chord patterns up and down" },
  { id: "chromatic", label: "Chromatic Scale", icon: "⬛", desc: "All 12 semitones — builds evenness" },
  { id: "chord_progression", label: "Chord Progressions", icon: "🎹", desc: "I–IV–V–I and common pop progressions" },
];

const KEYS = ["C","G","D","A","E","F","B♭","E♭"];

function ExerciseCard({ exercise, onStart }) {
  const [selectedKey, setSelectedKey] = useState("C");
  const [tempo, setTempo] = useState(60);
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{exercise.icon}</span>
        <div>
          <div className="font-heading text-base">{exercise.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{exercise.desc}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {KEYS.map(k => (
          <button key={k} onClick={() => setSelectedKey(k)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${selectedKey === k ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >{k}</button>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-muted-foreground w-14">Tempo: {tempo}</span>
        <input type="range" min={40} max={160} value={tempo} onChange={e => setTempo(+e.target.value)}
          className="flex-1 accent-primary" />
      </div>
      <button onClick={() => onStart(exercise, selectedKey, tempo)}
        className="w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-all">
        Start Exercise
      </button>
    </div>
  );
}

function SheetUploader({ onSegmentsReady }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a music analysis assistant. The user has uploaded sheet music (PDF, image, or MusicXML). 
Analyze this file and extract individual practice segments (bars/measures or short phrases). 
For each segment return: the measure number, a description of what notes/pattern is in it, the notes involved (as note names like C4, G4, F#4 etc.), and a difficulty rating 1-10.
Return 8-12 segments that would be useful for isolated practice.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            song_title: { type: "string" },
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  measure: { type: "number" },
                  description: { type: "string" },
                  notes: { type: "array", items: { type: "string" } },
                  difficulty: { type: "number" },
                }
              }
            }
          }
        },
      });

      if (result?.segments?.length > 0) {
        onSegmentsReady(result);
      } else {
        setError("Couldn't extract segments. Try a clearer image or a MusicXML file.");
      }
    } catch (e) {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileMusic className="w-5 h-5 text-primary" />
        <h3 className="font-heading text-base">Upload Your Sheet Music</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Upload a PDF, image, or MusicXML file. AI will suggest short practice segments you can isolate.</p>
      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${loading ? "opacity-50 pointer-events-none" : "border-border hover:border-primary/40"}`}>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg,.xml,.mxl,.musicxml" className="hidden" onChange={handleUpload} />
        {loading ? (
          <><Loader2 className="w-8 h-8 text-primary animate-spin mb-2" /><span className="text-sm text-muted-foreground">Analyzing sheet music…</span></>
        ) : file ? (
          <><Music2 className="w-8 h-8 text-primary mb-2" /><span className="text-sm font-medium">{file.name}</span><span className="text-xs text-muted-foreground mt-1">Click to change file</span></>
        ) : (
          <><Upload className="w-8 h-8 text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Click to upload sheet music</span><span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, MusicXML</span></>
        )}
      </label>
      {error && <p className="text-destructive text-xs mt-3">{error}</p>}
    </div>
  );
}

function SongSegments({ data, onPractice }) {
  const [active, setActive] = useState(null);
  return (
    <div className="space-y-3">
      <div className="font-heading text-lg">{data.song_title || "Uploaded Piece"}</div>
      <p className="text-sm text-muted-foreground">Select a segment to practice it in isolation:</p>
      {data.segments.map((seg, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Measure {seg.measure}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{seg.description}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {seg.notes?.slice(0, 6).map((n, j) => (
                <span key={j} className="text-xs bg-secondary px-1.5 py-0.5 rounded">{n}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 ml-3">
            <span className="text-xs text-muted-foreground">Diff: {seg.difficulty}/10</span>
            <button onClick={() => onPractice(seg)}
              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all">
              Practice
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProPractice() {
  const [tab, setTab] = useState("exercises"); // exercises | upload | record
  const [songData, setSongData] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const status = await loadSubscriptionStatus();
        setIsSubscribed(status.isSubscribed);
      } catch {
        setIsSubscribed(false);
      } finally {
        setLoadingAccess(false);
      }
    }
    checkAccess();
  }, []);

  function handleExerciseStart(exercise, key, tempo) {
    setActiveExercise({ exercise, key, tempo });
  }

  if (loadingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isSubscribed === false) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/40 px-4 py-3 flex items-center gap-3">
          <Link to="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-heading text-lg">Advanced Practice</span>
          </div>
        </div>
        <div className="min-h-[70vh] flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl mb-3">Included with Noteably</h1>
            <p className="text-sm text-muted-foreground mb-6">Subscribe to use structured exercises, AI-assisted sheet segments, and recording review.</p>
            <Link to="/" className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-center hover:bg-primary/90 transition-all mb-3">
              Subscribe - $5/month
            </Link>
            <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (activeExercise) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-3">{activeExercise.exercise.icon}</div>
          <h2 className="font-display text-2xl mb-1">{activeExercise.exercise.label}</h2>
          <p className="text-muted-foreground text-sm mb-2">Key of {activeExercise.key} · {activeExercise.tempo} BPM</p>
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-sm text-muted-foreground text-left space-y-2">
            <p>🎹 Set your metronome to <strong className="text-foreground">{activeExercise.tempo} BPM</strong>.</p>
            <p>🖐️ Start with your <strong className="text-foreground">right hand only</strong>, then left hand, then both together.</p>
            <p>📈 Once comfortable, increase tempo by 5 BPM and repeat.</p>
            <p>🎯 Goal: 3 clean repetitions in a row before moving on.</p>
          </div>
          <Link to="/practice" className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-3 hover:bg-primary/90 transition-all text-center">
            Open Practice Mode
          </Link>
          <button onClick={() => setActiveExercise(null)} className="text-sm text-muted-foreground hover:text-foreground">← Back to exercises</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-heading text-lg">Advanced Practice</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        <button onClick={() => setTab("exercises")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === "exercises" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <BookOpen className="w-4 h-4" />Structured Exercises
        </button>
        <button onClick={() => setTab("upload")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === "upload" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <FileMusic className="w-4 h-4" />AI Sheet Segments
        </button>
        <button onClick={() => setTab("record")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === "record" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Mic className="w-4 h-4" />AI Recording Review
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {tab === "exercises" && (
          <>
            <p className="text-sm text-muted-foreground">Methodical exercises designed to build technique systematically.</p>
            {EXERCISE_TYPES.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} onStart={handleExerciseStart} />
            ))}
          </>
        )}

        {tab === "record" && <RecordingReview />}

        {tab === "upload" && (
          <>
            {!songData ? (
              <SheetUploader onSegmentsReady={setSongData} />
            ) : (
              <>
                <SongSegments data={songData} onPractice={(seg) => {
                  // Pass segment to practice — for now show instructions
                  setActiveExercise({ exercise: { label: seg.description, icon: "🎼" }, key: "—", tempo: 60 });
                }} />
                <button onClick={() => setSongData(null)} className="text-sm text-muted-foreground hover:text-foreground">
                  ← Upload different file
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
