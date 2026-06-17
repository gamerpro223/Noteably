import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Mic, ChevronLeft, RefreshCw } from "lucide-react";
import { getRMS } from "@/lib/audioDetector";
import { NOTES_BY_NAME } from "@/lib/puzzleEngine";

const NOTE_FREQUENCIES = Object.entries(NOTES_BY_NAME).map(([name, freq]) => ({ name, freq }));

// NSDF pitch detection (duplicated here so MicTest has zero deps on PitchDetector class)
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
  const y0 = nsdf[Math.max(0, t - 1)];
  const y1 = nsdf[t];
  const y2 = nsdf[Math.min(maxLag - 1, t + 1)];
  const denom = y0 - 2 * y1 + y2;
  const refined = denom !== 0 ? t - 0.5 * (y2 - y0) / denom : t;
  return refined > 0 ? sampleRate / refined : -1;
}

function closestNote(freq, toleranceCents = 100) {
  if (freq <= 0) return null;
  let best = null, minCents = Infinity;
  for (const { name, freq: f } of NOTE_FREQUENCIES) {
    const cents = Math.abs(1200 * Math.log2(freq / f));
    if (cents < minCents) { minCents = cents; best = name; }
  }
  return minCents <= toleranceCents ? { name: best, cents: Math.round(minCents) } : null;
}

const RMS_THRESHOLD = 0.008;

function VolumeBar({ rms }) {
  const pct = Math.min(100, Math.round(rms * 800));
  const color = pct < 5 ? "bg-muted-foreground" : pct < 30 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
      <div className={`h-full transition-all duration-75 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MicTest() {
  const [status, setStatus] = useState("idle"); // idle | requesting | running | error
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [diagInfo, setDiagInfo] = useState({
    hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
    streamCreated: false,
    deviceLabel: null,
    contextState: null,
    sampleRate: null,
    permissionStatus: null,
  });
  const [liveData, setLiveData] = useState({ rms: 0, freq: -1, note: null });

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const bufferRef = useRef(null);
  const animRef = useRef(null);
  const runningRef = useRef(false);

  // Enumerate devices on mount
  useEffect(() => {
    async function loadDevices() {
      try {
        // Need a brief permission request to get device labels in some browsers
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === "audioinput");
        setDevices(mics);
        if (mics.length > 0) setSelectedDevice(mics[0].deviceId);
      } catch {}
    }
    loadDevices();
  }, []);

  // Check existing permission status
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" }).then(result => {
        setDiagInfo(d => ({ ...d, permissionStatus: result.state }));
        result.onchange = () => setDiagInfo(d => ({ ...d, permissionStatus: result.state }));
      }).catch(() => {});
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    bufferRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const detect = useCallback(() => {
    if (!runningRef.current || !analyserRef.current) return;
    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const rms = getRMS(bufferRef.current);
    const freq = rms > RMS_THRESHOLD
      ? nsdPitch(bufferRef.current, audioCtxRef.current.sampleRate)
      : -1;
    const note = freq > 0 ? closestNote(freq, 100) : null;
    setLiveData({ rms, freq: freq > 0 ? Math.round(freq) : -1, note });
    setDiagInfo(d => ({ ...d, contextState: audioCtxRef.current?.state }));
    animRef.current = requestAnimationFrame(detect);
  }, []);

  async function startMicTest() {
    stop();
    setError(null);
    setStatus("requesting");
    setLiveData({ rms: 0, freq: -1, note: null });

    try {
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(selectedDevice ? { deviceId: { exact: selectedDevice } } : {}),
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      const deviceLabel = track?.label || "Unknown device";

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

      // Re-enumerate to get labels now permission is granted
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const mics = allDevices.filter(d => d.kind === "audioinput");
      setDevices(mics);

      setDiagInfo({
        hasGetUserMedia: true,
        streamCreated: true,
        deviceLabel,
        contextState: ctx.state,
        sampleRate: ctx.sampleRate,
        permissionStatus: "granted",
      });

      runningRef.current = true;
      setStatus("running");
      detect();
    } catch (err) {
      setError({ name: err.name, message: err.message });
      setStatus("error");
      setDiagInfo(d => ({ ...d, streamCreated: false }));
    }
  }

  const rmsPercent = Math.min(100, Math.round(liveData.rms * 800));
  const volumeMoving = rmsPercent > 3;

  function errorAdvice(name) {
    switch (name) {
      case "NotAllowedError": return "Browser permission denied. Click the 🔒 icon in the address bar and allow microphone access, then reload.";
      case "NotFoundError": return "No microphone found. Ensure a mic is plugged in and not disabled in System Preferences → Security & Privacy → Microphone.";
      case "NotReadableError": return "Microphone is in use by another app (Zoom, FaceTime, etc.). Close those apps and try again.";
      case "OverconstrainedError": return "The selected device ID no longer exists. Try a different device from the dropdown.";
      default: return "Unexpected error — check browser console for details.";
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/practice" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl">Microphone Diagnostic</h1>
            <p className="text-xs text-muted-foreground">Verify mic input before practicing</p>
          </div>
        </div>

        {/* Device selector */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Input Device</label>
          {devices.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
              Device list hidden until permission granted — click Start Listening below
            </div>
          ) : (
            <select
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={startMicTest}
          disabled={status === "requesting"}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl mb-6 hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {status === "running" ? (
            <><RefreshCw className="w-4 h-4" /> Restart Mic Test</>
          ) : status === "requesting" ? (
            <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Requesting permission…</>
          ) : (
            <><Mic className="w-4 h-4" /> Start Listening / Mic Test</>
          )}
        </button>

        {/* Diagnostic info panel */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 font-mono text-xs space-y-2">
          <div className="text-muted-foreground font-sans font-medium mb-3 text-sm">System Diagnostics</div>

          <DiagRow label="getUserMedia available" value={diagInfo.hasGetUserMedia} type="bool" />
          <DiagRow label="Permission status" value={diagInfo.permissionStatus ?? "unknown"} type={diagInfo.permissionStatus === "granted" ? "ok" : diagInfo.permissionStatus === "denied" ? "err" : "neutral"} />
          <DiagRow label="Stream created" value={diagInfo.streamCreated} type="bool" />
          <DiagRow label="Device" value={diagInfo.deviceLabel ?? "—"} type="neutral" />
          <DiagRow label="AudioContext state" value={diagInfo.contextState ?? "—"} type={diagInfo.contextState === "running" ? "ok" : diagInfo.contextState ? "warn" : "neutral"} />
          <DiagRow label="Sample rate" value={diagInfo.sampleRate ? `${diagInfo.sampleRate} Hz` : "—"} type="neutral" />
        </div>

        {/* Error panel */}
        {status === "error" && error && (
          <div className="bg-destructive/10 border border-destructive/40 rounded-2xl p-4 mb-4 text-xs">
            <div className="font-semibold text-destructive mb-1">⚠ {error.name}</div>
            <div className="text-destructive/80 mb-2">{error.message}</div>
            <div className="text-foreground/70">{errorAdvice(error.name)}</div>
          </div>
        )}

        {/* Live signal panel */}
        {status === "running" && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="text-sm font-sans font-medium text-foreground">Live Signal</div>

            {/* Volume meter */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Input Volume (RMS)</span>
                <span className="font-mono">{liveData.rms.toFixed(4)}</span>
              </div>
              <VolumeBar rms={liveData.rms} />
              {!volumeMoving && (
                <div className="text-xs text-yellow-500 mt-1">
                  ⚠ Volume meter is flat — play a note or clap to confirm the mic is capturing audio.
                </div>
              )}
              {volumeMoving && (
                <div className="text-xs text-green-500 mt-1">✓ Audio is being captured</div>
              )}
            </div>

            {/* Frequency & note */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">Raw Frequency</div>
                <div className="text-xl font-mono font-bold text-primary">
                  {liveData.freq > 0 ? `${liveData.freq} Hz` : "—"}
                </div>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <div className="text-xs text-muted-foreground mb-1">Detected Note</div>
                <div className="text-xl font-mono font-bold text-primary">
                  {liveData.note?.name ?? "—"}
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-secondary rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-1">Confidence (cents off)</div>
              <div className="font-mono text-sm text-foreground">
                {liveData.note ? (
                  <span className={liveData.note.cents < 30 ? "text-green-400" : liveData.note.cents < 60 ? "text-yellow-400" : "text-red-400"}>
                    ±{liveData.note.cents} cents {liveData.note.cents < 30 ? "✓ great" : liveData.note.cents < 60 ? "~ ok" : "⚠ off"}
                  </span>
                ) : "No note detected"}
              </div>
            </div>

            {/* No-note hint */}
            {volumeMoving && !liveData.note && (
              <div className="text-xs text-muted-foreground bg-secondary rounded-xl p-3">
                Audio detected but no clear note. This is normal between notes. Play and hold a key on the piano for 1–2 seconds.
              </div>
            )}
          </div>
        )}

        {/* Link back to practice once confirmed working */}
        {status === "running" && volumeMoving && liveData.note && (
          <Link
            to="/practice"
            className="mt-4 block w-full text-center bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all"
          >
            Mic confirmed — Go to Practice →
          </Link>
        )}
      </div>
    </div>
  );
}

function DiagRow({ label, value, type }) {
  const color =
    type === "bool"
      ? value ? "text-green-400" : "text-red-400"
      : type === "ok" ? "text-green-400"
      : type === "err" ? "text-red-400"
      : type === "warn" ? "text-yellow-400"
      : "text-foreground";
  const display =
    type === "bool" ? (value ? "✓ yes" : "✗ no") : String(value);
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${color}`}>{display}</span>
    </div>
  );
}
