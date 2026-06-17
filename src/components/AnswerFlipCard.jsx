import React from "react";
import { getNoteDisplayName } from "@/lib/puzzleEngine";
import FullPianoKeyboard from "@/components/FullPianoKeyboard";

export default function AnswerFlipCard({ puzzle, isFlipped, onFlip }) {
  return (
    <div
      className="w-full max-w-sm"
      style={{ perspective: "1000px" }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          minHeight: "200px",
        }}
      >
        {/* Front — sheet music (always rendered by parent, this is invisible placeholder) */}
        <div
          style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className="bg-card border border-border rounded-2xl"
        />

        {/* Back — answer piano */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            inset: 0,
          }}
          className="bg-card border border-primary/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-3"
        >
          <div className="text-xs uppercase tracking-wider text-primary font-medium mb-1">Answer</div>
          <div className="font-heading text-lg text-foreground mb-2">{puzzle?.description}</div>
          <div className="w-full">
            <FullPianoKeyboard highlightNotes={puzzle?.notes || []} />
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center mt-1">
            {puzzle?.notes.map((n, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-medium">
                {getNoteDisplayName(n)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}