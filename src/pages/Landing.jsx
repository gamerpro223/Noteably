import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Music, Mic, Flame, BarChart2, CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth?.() || {};

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      if (!user?.email) {
        setError("Create an account or sign in before subscribing.");
        setLoading(false);
        return;
      }
      const response = await base44.functions.invoke("create-checkout", {
        email: user.email,
      });
      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        setError("Could not start checkout. Please try again.");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Music, title: "Sheet Music Puzzles", desc: "Real notation — single notes, intervals, chords, and sequences — just like a real musician reads." },
    { icon: Mic, title: "Microphone Detection", desc: "Play on your piano and the app listens in real time. Get it right and the next card appears instantly." },
    { icon: Flame, title: "Daily Streaks", desc: "Build the habit with streak tracking and daily goals of 10 or 15 minutes." },
    { icon: BarChart2, title: "Progress Analytics", desc: "Watch your level, accuracy, and XP grow over time with a beautiful dashboard." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading text-lg text-primary">Noteably</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-all"
            >
              {loading ? "Loading…" : "Subscribe"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative">
        {/* Background piano keys */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="absolute bg-foreground" style={{
              left: `${(i / 14) * 100}%`, top: 0, bottom: 0, width: "1px", opacity: 0.3
            }} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <Star className="w-3 h-3" fill="currentColor" />
            Daily piano practice, reimagined
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-6 leading-tight">
            Learn piano like<br />
            <span className="text-primary">a grandmaster</span><br />
            learns chess.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Flashcard-style sheet music puzzles that build real musical intuition. Play on your piano, the app listens, and you level up — 10 minutes a day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full sm:w-auto"
            >
              {loading ? "Redirecting…" : "Subscribe — $5/month"}
            </button>
            <Link to="/register" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Create an account first →
            </Link>
          </div>
          {error && <p className="text-destructive text-sm mt-4">{error}</p>}
        </motion.div>

        {/* Mini piano preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 mx-auto max-w-2xl"
        >
          <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
            <div className="text-xs text-muted-foreground mb-4 text-left font-medium tracking-wider uppercase">Current Puzzle</div>
            {/* Simplified staff preview */}
            <div className="bg-background/60 rounded-xl p-4 mb-4 border border-border/50 relative h-28 flex items-center justify-center">
              <svg viewBox="0 0 240 80" className="w-full max-w-xs opacity-90">
                {[0,1,2,3,4].map(i => (
                  <line key={i} x1="30" y1={15 + i*12} x2="210" y2={15+i*12} stroke="hsl(45,20%,55%)" strokeWidth="1" opacity="0.6" />
                ))}
                <text x="30" y="57" fontSize="48" fill="hsl(45,25%,55%)" fontFamily="serif" opacity="0.8">𝄞</text>
                <ellipse cx="130" cy="27" rx="7" ry="5.5" fill="#EFE4C8" transform="rotate(-15,130,27)" />
                <line x1="136" y1="27" x2="136" y2="-3" stroke="#EFE4C8" strokeWidth="1.5" />
                {/* Ledger line for middle C */}
                <line x1="118" y1="63" x2="142" y2="63" stroke="hsl(45,20%,55%)" strokeWidth="1" opacity="0.6" />
                <ellipse cx="130" cy="63" rx="7" ry="5.5" fill="#EFE4C8" transform="rotate(-15,130,63)" opacity="0.5" />
              </svg>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Listening for your note…</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-4">How it works</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Just like Duolingo built a language habit, Noteably builds a music reading habit — one puzzle at a time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-border/40">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">Simple pricing</h2>
          <p className="text-muted-foreground mb-10">One plan. Everything included. Cancel anytime.</p>
          <div className="bg-card border-2 border-primary/40 rounded-2xl p-8 shadow-xl shadow-primary/5">
            <div className="text-5xl font-heading text-primary mb-1">$5</div>
            <div className="text-muted-foreground mb-6">per month</div>
            <ul className="space-y-3 text-sm mb-8 text-left">
              {[
                "Unlimited daily puzzles",
                "Microphone pitch detection",
                "Streak tracking & daily goals",
                "XP system & level progression",
                "Practice history & analytics",
                "New puzzles added regularly",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all"
            >
              {loading ? "Loading…" : "Get Started"}
            </button>
            {error && <p className="text-destructive text-xs mt-3">{error}</p>}
            <p className="text-xs text-muted-foreground mt-4">No commitment. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-muted-foreground text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Music className="w-3 h-3 text-primary" />
          <span className="font-heading text-primary">Noteably</span>
        </div>
            <p>© {new Date().getFullYear()} Noteably. All rights reserved.</p>
      </footer>
    </div>
  );
}
