import React from "react";
import { motion } from "framer-motion";
import { DIFFICULTY_TIERS, LEVEL_META } from "@/lib/puzzleEngine";
import { ChevronRight } from "lucide-react";



// Initial level picker (for new users — just the 4 tiers)
export function TierSelect({ onSelect }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🎹</div>
        <h1 className="font-display text-3xl mb-2">Choose your level</h1>
        <p className="text-muted-foreground text-sm mb-8">You can always change this in settings later.</p>
        <div className="flex flex-col gap-3">
          {Object.entries(DIFFICULTY_TIERS).map(([key, tier]) => (
            <button key={key} onClick={() => onSelect(key, tier.startLevel)}
              className={`border rounded-2xl p-5 text-left transition-all group ${key === "chopin" ? "bg-card border-red-900/60 hover:border-red-500/70 hover:bg-red-950/20" : "bg-card border-border hover:border-primary/50 hover:bg-card/80"}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tier.emoji}</span>
                <div>
                  <div className={`font-heading text-lg transition-colors ${key === "chopin" ? "text-red-400 group-hover:text-red-300" : "group-hover:text-primary"}`}>{tier.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tier.description}</div>
                  {key === "chopin" && <div className="text-xs text-red-500/80 mt-1 font-medium">⚠ 8 seconds per puzzle · No mercy</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Full level browser — shown when user wants to revisit a level
export default function LevelSelect({ onSelect, currentLevel = 1, totalXp = 0, onCancel }) {
  const isNewUser = !onCancel;

  // New users see the tier picker
  if (isNewUser) {
    return <TierSelect onSelect={onSelect} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h1 className="font-heading text-lg">Choose Level</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <p className="text-xs text-muted-foreground text-center mb-4">
          You can revisit any level you've reached. Puzzles generate fresh each time.
        </p>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 20 }, (_, i) => i + 1).map(lvl => {
            const meta = LEVEL_META[lvl];
            const isCurrent = lvl === currentLevel;
            const isGrandmaster = lvl === 20;

            return (
              <button key={lvl} onClick={() => onSelect(null, lvl)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  isGrandmaster ? "bg-red-950/20 border-red-900/60 hover:border-red-500/60" :
                  isCurrent ? "bg-primary/10 border-primary/40" :
                  "bg-card border-border hover:border-primary/30 hover:bg-card/80"
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isGrandmaster ? "bg-red-950/60 text-red-400" :
                    isCurrent ? "bg-primary/20 text-primary" :
                    "bg-secondary text-foreground"
                  }`}>
                    {lvl}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isGrandmaster ? "text-red-400" : isCurrent ? "text-primary" : ""}`}>
                      {isGrandmaster ? "💀 " : ""}{meta?.name ?? `Level ${lvl}`}
                      {isCurrent && <span className="ml-2 text-xs text-primary/70">(current)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{meta?.description ?? ""}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}