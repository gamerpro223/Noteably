// ══════════════════════════════════════════════════════════════════════════
// SheetMusic.jsx — Full SVG music notation renderer
// Supports: grand staff, multiple measures, beams, rests, accidentals, ties
// ══════════════════════════════════════════════════════════════════════════

import React from "react";

// ── Layout constants ──────────────────────────────────────────────────────
const LS = 10;           // line spacing (pixels between staff lines)
const STAFF_LINES = 5;
const STAFF_H = (STAFF_LINES - 1) * LS;   // 40px
const NOTE_R_X = 5.5;
const NOTE_R_Y = 4;
const CLEF_W = 28;
const TIMESIG_W = 20;
const BEAT_W = 38;       // pixels per beat (quarter note) — may be reduced for dense exercises
const MEASURE_PAD = 10;
const GRAND_GAP = 32;    // gap between treble bottom and bass top

// Max SVG width before we start compressing beat spacing
const MAX_SVG_W = 700;
const MIN_BEAT_W = 22;

// Treble clef note positions (0 = first ledger below = C4)
// position 0 = line between first and second staff line from bottom = E4 line
// staff lines: 0(E4),2(G4),4(B4),6(D5),8(F5) — line pos in half-steps
const TREBLE_POS = {
  "C4":-2,"D4":-1,"E4":0,"F4":1,"G4":2,"A4":3,"B4":4,
  "C5":5,"D5":6,"E5":7,"F5":8,"G5":9,"A5":10,"B5":11,"C6":12,"D6":13,"E6":14,
  "C#4":-2,"D#4":-1,"F#4":1,"G#4":2,"A#4":3,
  "C#5":5,"D#5":6,"F#5":8,"G#5":9,"A#5":10,
  "A#5":10,"B#5":11,
};
// Bass clef note positions (0 = G2 line)
const BASS_POS = {
  "G2":0,"A2":1,"B2":2,"C3":3,"D3":4,"E3":5,"F3":6,"G3":7,"A3":8,"B3":9,
  "C4":10,"D4":11,"E4":12,
  "G#2":0,"A#2":1,"C#3":3,"D#3":4,"F#3":6,"G#3":7,"A#3":8,
  "F#2":-1,"E2":-2,"D2":-3,"C2":-4,
  "E3":5,"F3":6,
  "A2":1,"B2":2,
  "C3":3,"D3":4,
  "D#3":4,"F#3":6,
};

// Extended treble positions for higher notes
Object.assign(TREBLE_POS, {
  "G5":9,"A5":10,"B5":11,"C6":12,"D6":13,"E6":14,"F6":15,"G6":16,
  "F#5":8,"G#5":9,
});

const LETTER_STEPS = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const TREBLE_BASE_STEP = LETTER_STEPS.E + 4 * 7; // E4 bottom line
const BASS_BASE_STEP = LETTER_STEPS.G + 2 * 7;   // G2 bottom line

function staffPositionForKey(key, clef) {
  const match = String(key || "").match(/^([A-G])#?(\d)$/);
  if (!match) {
    const map = clef === "bass" ? BASS_POS : TREBLE_POS;
    return map[key] ?? 4;
  }
  const step = LETTER_STEPS[match[1]] + Number(match[2]) * 7;
  return step - (clef === "bass" ? BASS_BASE_STEP : TREBLE_BASE_STEP);
}

function staffExtents(events, clef) {
  let min = 0;
  let max = 8;
  for (const event of events || []) {
    if (event.rest) continue;
    for (const key of event.keys || []) {
      const pos = staffPositionForKey(key, clef);
      min = Math.min(min, pos);
      max = Math.max(max, pos);
    }
  }
  return { min, max };
}

function staffPadding(extents) {
  return {
    above: Math.max(0, extents.max - 8) * (LS / 2) + 12,
    below: Math.max(0, -extents.min) * (LS / 2) + 12,
  };
}

// Convert staff position to Y coordinate within one staff
function posToY(pos, staffTop) {
  // pos 0 = bottom line (E4 in treble), each step = LS/2
  const bottomLineY = staffTop + STAFF_H;
  return bottomLineY - pos * (LS / 2);
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function StaffLines({ x, width, staffTop, color = "hsl(45,15%,50%)" }) {
  return (
    <>
      {Array.from({ length: STAFF_LINES }, (_, i) => {
        const y = staffTop + i * LS;
        return <line key={i} x1={x} y1={y} x2={x + width} y2={y} stroke={color} strokeWidth={0.8} />;
      })}
    </>
  );
}

function TrebleClef({ x, staffTop }) {
  // Simplified treble clef path
  const bottom = staffTop + STAFF_H;
  return (
    <text x={x + 2} y={bottom + 8} fontSize={44} fontFamily="serif" fill="hsl(45,30%,65%)" opacity={0.85}>𝄞</text>
  );
}

function BassClef({ x, staffTop }) {
  const bottom = staffTop + STAFF_H;
  return (
    <text x={x + 4} y={staffTop + LS * 1.5} fontSize={28} fontFamily="serif" fill="hsl(45,30%,65%)" opacity={0.85}>𝄢</text>
  );
}

function LedgerLines({ pos, x, staffTop, clef }) {
  const lines = [];
  const LW = 13;
  const color = "hsl(45,15%,55%)";

  // Below staff (pos < 0)
  if (pos <= -1) {
    for (let p = -2; p >= pos - (pos % 2 === 0 ? 0 : 1); p -= 2) {
      const y = posToY(p, staffTop);
      lines.push(<line key={`lb${p}`} x1={x - LW/2} y1={y} x2={x + LW/2} y2={y} stroke={color} strokeWidth={0.8} />);
    }
    // Middle C ledger (pos = -2 for treble)
    if (pos === -2 || pos === -1) {
      const y = posToY(-2, staffTop);
      if (!lines.find(l => l.key === "lb-2")) {
        lines.push(<line key="lc4" x1={x - LW/2} y1={y} x2={x + LW/2} y2={y} stroke={color} strokeWidth={0.8} />);
      }
    }
  }
  // Above staff (pos > 8)
  if (pos >= 9) {
    for (let p = 10; p <= pos + 1; p += 2) {
      const y = posToY(p, staffTop);
      lines.push(<line key={`la${p}`} x1={x - LW/2} y1={y} x2={x + LW/2} y2={y} stroke={color} strokeWidth={0.8} />);
    }
  }
  // Bass: below staff (pos < 0)
  if (clef === "bass" && pos <= -1) {
    for (let p = -2; p >= pos - 1; p -= 2) {
      const y = posToY(p, staffTop);
      lines.push(<line key={`lb_b${p}`} x1={x - LW/2} y1={y} x2={x + LW/2} y2={y} stroke={color} strokeWidth={0.8} />);
    }
  }
  return <>{lines}</>;
}

function NoteHead({ x, y, filled = true, highlight = false, color = null }) {
  const fill = highlight ? "hsl(45,75%,62%)" : (color || "hsl(45,35%,88%)");
  return (
    <ellipse
      cx={x} cy={y} rx={NOTE_R_X} ry={NOTE_R_Y}
      fill={fill} stroke={fill}
      transform={`rotate(-12,${x},${y})`}
      strokeWidth={0}
    />
  );
}

function Stem({ x, y, stemUp, height = 28, color = "hsl(45,20%,70%)" }) {
  const x2 = x + (stemUp ? NOTE_R_X - 1 : -(NOTE_R_X - 1));
  const y2 = stemUp ? y - height : y + height;
  return <line x1={x2} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth={1.4} />;
}

function Accidental({ x, y, type, color = "hsl(45,55%,70%)" }) {
  if (type === "#") {
    return <text x={x - 9} y={y + 4} fontSize={11} fontFamily="serif" fill={color} fontWeight="bold">#</text>;
  }
  if (type === "b") {
    return <text x={x - 7} y={y + 5} fontSize={12} fontFamily="serif" fill={color}>♭</text>;
  }
  if (type === "n") {
    return <text x={x - 8} y={y + 4} fontSize={11} fontFamily="serif" fill={color}>♮</text>;
  }
  return null;
}

function Rest({ x, staffTop, duration }) {
  const midY = staffTop + LS * 2;
  const color = "hsl(45,20%,55%)";
  if (duration === "whole") {
    return <rect x={x - 6} y={midY - 3} width={12} height={4} fill={color} rx={1}/>;
  }
  if (duration === "half") {
    return <rect x={x - 6} y={midY - 1} width={12} height={4} fill={color} rx={1}/>;
  }
  if (duration === "quarter") {
    return <text x={x - 4} y={midY + 6} fontSize={16} fontFamily="serif" fill={color} opacity={0.9}>𝄽</text>;
  }
  if (duration === "eighth") {
    return <text x={x - 4} y={midY + 5} fontSize={13} fontFamily="serif" fill={color} opacity={0.9}>𝄾</text>;
  }
  if (duration === "sixteenth") {
    return <text x={x - 4} y={midY + 4} fontSize={11} fontFamily="serif" fill={color} opacity={0.9}>𝄿</text>;
  }
  return <line x1={x-4} y1={midY} x2={x+4} y2={midY} stroke={color} strokeWidth={2}/>;
}

function Beam({ x1, y1, x2, y2, color = "hsl(45,20%,65%)" }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={4} strokeLinecap="round" />;
}

function TimeSignature({ x, staffTop, top, bottom }) {
  const midLine = staffTop + LS;
  const midLine2 = staffTop + LS * 3;
  return (
    <>
      <text x={x} y={midLine + 6} textAnchor="middle" fontSize={14} fontFamily="serif" fill="hsl(45,30%,70%)" fontWeight="bold">{top}</text>
      <text x={x} y={midLine2 + 6} textAnchor="middle" fontSize={14} fontFamily="serif" fill="hsl(45,30%,70%)" fontWeight="bold">{bottom}</text>
    </>
  );
}

function Barline({ x, top, bottom, color = "hsl(45,15%,50%)" }) {
  return <line x1={x} y1={top} x2={x} y2={bottom} stroke={color} strokeWidth={1.2} />;
}

function FinalBarline({ x, top, bottom, color = "hsl(45,15%,55%)" }) {
  return (
    <>
      <line x1={x - 3} y1={top} x2={x - 3} y2={bottom} stroke={color} strokeWidth={1.2} />
      <line x1={x} y1={top} x2={x} y2={bottom} stroke={color} strokeWidth={4} />
    </>
  );
}

// ── Duration widths (in beats) → pixel mapping ────────────────────────────
const DUR_BEATS = {
  whole: 4, "dotted-half": 3, half: 2, "dotted-quarter": 1.5,
  quarter: 1, "dotted-eighth": 0.75, eighth: 0.5, triplet: 1/3, sixteenth: 0.25,
};

// ── Single staff renderer for one measure ─────────────────────────────────
function renderMeasureEvents({ events, staffTop, clef, highlightNotes, stemUp = null, onNoteClick = null }) {
  if (!events || events.length === 0) return null;
  const nodes = [];
  const hl = new Set(highlightNotes || []);

  events.forEach((ev, ei) => {
    if (ev.rest) {
      nodes.push(<Rest key={`r${ei}`} x={ev.cx} staffTop={staffTop} duration={ev.duration} />);
      return;
    }
    const keys = ev.keys || [];
    if (keys.length === 0) return;

    // Determine stem direction from average position
    const positions = keys.map(k => staffPositionForKey(k, clef));
    const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length;
    const up = stemUp !== null ? stemUp : avgPos < 4;

    const yValues = positions.map(p => posToY(p, staffTop));
    const stemY = up ? Math.min(...yValues) : Math.max(...yValues);

    // Stem
    const stemHeight = ev.duration === "whole" || ev.duration === "half" ? 26 : 28;
    const needsStem = ev.duration !== "whole";
    if (needsStem) {
      nodes.push(<Stem key={`st${ei}`} x={ev.cx} y={stemY} stemUp={up} height={stemHeight} />);
    }

    // Notes in chord
    keys.forEach((k, ki) => {
      const pos = staffPositionForKey(k, clef);
      const y = posToY(pos, staffTop);
      const isHL = hl.has(k);
      const isSharp = k.includes("#");

      nodes.push(
        <g key={`n${ei}-${ki}`} onClick={onNoteClick ? () => onNoteClick(k) : undefined}
          style={onNoteClick ? { cursor: "pointer" } : undefined}>
          <LedgerLines pos={pos} x={ev.cx} staffTop={staffTop} clef={clef} />
          {isHL && <circle cx={ev.cx} cy={y} r={NOTE_R_X + 5} fill="hsl(45,70%,62%)" opacity={0.25} />}
          {isSharp && <Accidental x={ev.cx} y={y} type="#" />}
          <NoteHead x={ev.cx} y={y} filled={ev.duration !== "whole" && ev.duration !== "half"} highlight={isHL} />
          {onNoteClick && <circle cx={ev.cx} cy={y} r={NOTE_R_X + 6} fill="transparent" />}
        </g>
      );
    });
  });

  // Add beams (connect consecutive eighths/sixteenths)
  let beamGroup = [];
  events.forEach((ev, ei) => {
    if (!ev.rest && (ev.duration === "eighth" || ev.duration === "sixteenth") && ev.keys.length > 0) {
      beamGroup.push({ ev, ei });
    } else {
      if (beamGroup.length >= 2) {
        const first = beamGroup[0].ev;
        const last = beamGroup[beamGroup.length - 1].ev;
        const fp = (first.keys || []).map(k => staffPositionForKey(k, clef));
        const lp = (last.keys || []).map(k => staffPositionForKey(k, clef));
        const favgPos = fp.reduce((a,b)=>a+b,0)/fp.length;
        const lavgPos = lp.reduce((a,b)=>a+b,0)/lp.length;
        const up = stemUp !== null ? stemUp : (favgPos + lavgPos) / 2 < 4;
        const fy = posToY(favgPos, staffTop);
        const ly = posToY(lavgPos, staffTop);
        const y1 = up ? fy - 28 : fy + 28;
        const y2 = up ? ly - 28 : ly + 28;
        const x1 = first.cx + (up ? NOTE_R_X - 1 : -(NOTE_R_X - 1));
        const x2 = last.cx + (up ? NOTE_R_X - 1 : -(NOTE_R_X - 1));
        nodes.push(<Beam key={`beam-${ei}`} x1={x1} y1={y1} x2={x2} y2={y2} />);
        // Double beam for sixteenths
        if (first.duration === "sixteenth") {
          nodes.push(<Beam key={`beam2-${ei}`} x1={x1} y1={y1 + (up?4:-4)} x2={x2} y2={y2 + (up?4:-4)} />);
        }
      }
      beamGroup = [];
    }
  });
  if (beamGroup.length >= 2) {
    const first = beamGroup[0].ev;
    const last = beamGroup[beamGroup.length - 1].ev;
    const fp = (first.keys||[]).map(k=>staffPositionForKey(k, clef));
    const lp = (last.keys||[]).map(k=>staffPositionForKey(k, clef));
    const favgPos = fp.reduce((a,b)=>a+b,0)/Math.max(fp.length,1);
    const lavgPos = lp.reduce((a,b)=>a+b,0)/Math.max(lp.length,1);
    const up = stemUp !== null ? stemUp : (favgPos + lavgPos) / 2 < 4;
    const fy = posToY(favgPos, staffTop);
    const ly = posToY(lavgPos, staffTop);
    const y1 = up ? fy - 28 : fy + 28;
    const y2 = up ? ly - 28 : ly + 28;
    const x1 = first.cx + (up?NOTE_R_X-1:-(NOTE_R_X-1));
    const x2 = last.cx + (up?NOTE_R_X-1:-(NOTE_R_X-1));
    nodes.push(<Beam key="beam-final" x1={x1} y1={y1} x2={x2} y2={y2} />);
    if (first.duration === "sixteenth") {
      nodes.push(<Beam key="beam2-final" x1={x1} y1={y1+(up?4:-4)} x2={x2} y2={y2+(up?4:-4)} />);
    }
  }

  return nodes;
}

// ── Main SheetMusic Component ──────────────────────────────────────────────
export default function SheetMusic({
  exercise = null,
  // Legacy props for backwards compat
  notes = [], type = "single", highlightNotes = [], hand = "right", bassNotes = [],
  className = "",
  onNoteClick = null,
}) {
  // If exercise is provided (new format), use it; otherwise convert legacy
  let ex = exercise;
  if (!ex) {
    ex = legacyToExercise({ notes, type, hand, bassNotes });
  }

  const measures = ex.measures || [];
  const showRH = ex.mode !== "left";
  const showLH = ex.mode === "left" || ex.mode === "both";
  const showGrand = showRH && showLH;

  // ── Layout ──────────────────────────────────────────────────────────────
  const MARGIN_L = 8;
  const HEADER_W = CLEF_W + TIMESIG_W + 8;
  const rightHandEvents = measures.flatMap(m => m.rightHand || []);
  const leftHandEvents = measures.flatMap(m => m.leftHand || []);
  const treblePad = staffPadding(staffExtents(rightHandEvents, "treble"));
  const bassPad = staffPadding(staffExtents(leftHandEvents, "bass"));

  function eventCount(measure) {
    return (measure.rightHand || []).length + (measure.leftHand || []).length;
  }

  function hasFastNotes(measure) {
    return [...(measure.rightHand || []), ...(measure.leftHand || [])]
      .some(event => event.duration === "sixteenth" || event.duration === "triplet");
  }

  function beatWidthForMeasure(measure) {
    if (hasFastNotes(measure)) return 58;
    if (eventCount(measure) >= 16) return 50;
    if (eventCount(measure) >= 10) return 44;
    return BEAT_W;
  }

  function measureWidthDyn(measure, beatW) {
    const rhBeats = (measure.rightHand || []).reduce((s, e) => s + (DUR_BEATS[e.duration] || 1), 0);
    const lhBeats = (measure.leftHand  || []).reduce((s, e) => s + (DUR_BEATS[e.duration] || 1), 0);
    const beats = Math.max(rhBeats, lhBeats, 4);
    return beats * beatW + MEASURE_PAD * 2;
  }

  function layoutMeasureDyn(events, startX, beatW) {
    let x = startX;
    return events.map(ev => {
      const beats = DUR_BEATS[ev.duration] || 1;
      const cx = x + beats * beatW / 2;
      x += beats * beatW;
      return { ...ev, cx, beats };
    });
  }

  const measureLayouts = measures.map((measure) => {
    const beatW = beatWidthForMeasure(measure);
    return { measure, beatW, width: measureWidthDyn(measure, beatW) };
  });

  const maxSystemContentW = MAX_SVG_W - MARGIN_L - HEADER_W - 20;
  const systems = [];
  let currentSystem = [];
  let currentWidth = 0;
  for (const item of measureLayouts) {
    const wouldOverflow = currentSystem.length > 0 && currentWidth + item.width > maxSystemContentW;
    if (wouldOverflow) {
      systems.push(currentSystem);
      currentSystem = [];
      currentWidth = 0;
    }
    currentSystem.push(item);
    currentWidth += item.width;
  }
  if (currentSystem.length) systems.push(currentSystem);

  // Staff positions, padded so generated ledger-line notes do not clip.
  const TOP_PAD = 18;
  const singlePad = showRH ? treblePad : bassPad;
  const SINGLE_TOP = TOP_PAD + singlePad.above;
  const TREBLE_TOP = showRH ? TOP_PAD + treblePad.above : SINGLE_TOP;
  const BASS_TOP = showGrand
    ? TREBLE_TOP + STAFF_H + treblePad.below + GRAND_GAP + bassPad.above
    : SINGLE_TOP;
  const systemH = showGrand
    ? BASS_TOP + STAFF_H + bassPad.below + 18
    : SINGLE_TOP + STAFF_H + singlePad.below + 18;
  const SYSTEM_GAP = 26;
  const svgH = systems.length * systemH + Math.max(0, systems.length - 1) * SYSTEM_GAP;
  const svgW = Math.max(
    320,
    ...systems.map(system => MARGIN_L + HEADER_W + system.reduce((sum, item) => sum + item.width, 0) + 20)
  );

  // Grand staff brace + connecting line
  const staffColor = "hsl(45,15%,50%)";

  // Only highlight if notes are being played (non-empty)
  const hls = highlightNotes.length > 0 ? new Set(highlightNotes) : new Set();

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={`select-none ${className}`}
      style={{ maxWidth: svgW, display: "block" }}
    >
      {systems.map((system, systemIndex) => {
        const systemY = systemIndex * (systemH + SYSTEM_GAP);
        const trebleTop = TREBLE_TOP + systemY;
        const bassTop = BASS_TOP + systemY;
        const staffTop = showRH ? trebleTop : bassTop;
        const systemW = MARGIN_L + HEADER_W + system.reduce((sum, item) => sum + item.width, 0) + 20;
        let curX = MARGIN_L + HEADER_W;

        return (
          <g key={`system-${systemIndex}`}>
            {showGrand && (
              <line
                x1={MARGIN_L + CLEF_W - 6} y1={trebleTop}
                x2={MARGIN_L + CLEF_W - 6} y2={bassTop + STAFF_H}
                stroke={staffColor} strokeWidth={2}
              />
            )}

            {showRH && <TrebleClef x={MARGIN_L} staffTop={trebleTop} />}
            {showLH && <BassClef x={MARGIN_L} staffTop={showGrand ? bassTop : staffTop} />}

            {showRH && <TimeSignature x={MARGIN_L + CLEF_W + 10} staffTop={trebleTop} top={4} bottom={4} />}
            {showLH && <TimeSignature x={MARGIN_L + CLEF_W + 10} staffTop={showGrand ? bassTop : staffTop} top={4} bottom={4} />}

            {showRH && <StaffLines x={MARGIN_L + CLEF_W - 4} width={systemW - MARGIN_L - CLEF_W + 4} staffTop={trebleTop} />}
            {showLH && <StaffLines x={MARGIN_L + CLEF_W - 4} width={systemW - MARGIN_L - CLEF_W + 4} staffTop={showGrand ? bassTop : staffTop} />}

            {showGrand ? (
              <Barline x={MARGIN_L + HEADER_W - 4} top={trebleTop} bottom={bassTop + STAFF_H} />
            ) : (
              <Barline x={MARGIN_L + HEADER_W - 4} top={staffTop} bottom={staffTop + STAFF_H} />
            )}

            {system.map((item, measureIndex) => {
              const mx = curX;
              curX += item.width;
              const m = item.measure;
              const rhEvents = layoutMeasureDyn(m.rightHand || [], mx + MEASURE_PAD, item.beatW);
              const lhEvents = layoutMeasureDyn(m.leftHand || [], mx + MEASURE_PAD, item.beatW);
              const globalIndex = systems.slice(0, systemIndex).reduce((sum, previous) => sum + previous.length, 0) + measureIndex;
              const isLast = globalIndex === measures.length - 1;
              const bx = mx + item.width;

              return (
                <g key={`m${globalIndex}`}>
                  {showRH && renderMeasureEvents({
                    events: rhEvents,
                    staffTop: trebleTop,
                    clef: "treble",
                    highlightNotes: hls,
                    stemUp: null,
                    onNoteClick,
                  })}
                  {showLH && renderMeasureEvents({
                    events: lhEvents,
                    staffTop: showGrand ? bassTop : staffTop,
                    clef: "bass",
                    highlightNotes: hls,
                    stemUp: null,
                    onNoteClick,
                  })}
                  {isLast ? (
                    showGrand
                      ? <FinalBarline x={bx - 2} top={trebleTop} bottom={bassTop + STAFF_H} />
                      : <FinalBarline x={bx - 2} top={staffTop} bottom={staffTop + STAFF_H} />
                  ) : (
                    showGrand
                      ? <Barline x={bx - 2} top={trebleTop} bottom={bassTop + STAFF_H} />
                      : <Barline x={bx - 2} top={staffTop} bottom={staffTop + STAFF_H} />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── Legacy conversion ──────────────────────────────────────────────────────
// Converts old flat notes[] format into a minimal exercise object
function legacyToExercise({ notes, type, hand, bassNotes }) {
  const treble = hand === "left" ? [] : notes;
  const bass   = hand === "left" ? notes : (bassNotes || []);
  const mode   = hand === "both" ? "both" : hand === "left" ? "left" : "right";

  function toEvents(ns, dur) {
    if (type === "chord" || type === "single") {
      return ns.length ? [{ keys: ns, duration: "whole", beat: 1, rest: false }] : [];
    }
    return ns.map((n, i) => ({ keys: [n], duration: "quarter", beat: i + 1, rest: false }));
  }

  return {
    id: "legacy",
    mode,
    measures: [{
      number: 1,
      rightHand: toEvents(treble, "quarter"),
      leftHand: toEvents(bass, "quarter"),
    }],
    trebleNotes: treble,
    bassNotes: bass,
  };
}
