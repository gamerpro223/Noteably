import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flame, Star, Music, BarChart2, Calendar, TrendingUp, Award, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format, subDays } from "date-fns";
import { loadSubscriptionStatus } from "@/lib/subscription";

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className={`text-3xl font-heading ${color} mb-1`}>{value}</div>
      <div className="text-sm text-foreground font-medium">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function StreakCalendar({ sessions }) {
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = subDays(new Date(), 34 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const session = sessions.find(s => s.date === dateStr);
    return { date, dateStr, session };
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
        <div key={d} className="text-xs text-muted-foreground text-center pb-1">{d}</div>
      ))}
      {days.map(({ date, dateStr, session }) => {
        const intensity = session
          ? session.duration_seconds >= 600 ? "bg-primary" : "bg-primary/50"
          : "bg-secondary";
        return (
          <div
            key={dateStr}
            title={session ? `${Math.round(session.duration_seconds / 60)} min practiced` : dateStr}
            className={`aspect-square rounded-sm ${intensity} transition-all hover:opacity-80`}
          />
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const subscriptionStatus = await loadSubscriptionStatus();
        if (!subscriptionStatus.isAuthenticated) { setLoading(false); return; }

        const [progressRecords, sessionRecords] = await Promise.all([
          base44.entities.UserProgress.list(),
          base44.entities.PracticeSession.list("-date", 35),
        ]);

        setUser(subscriptionStatus.user);
        if (progressRecords.length > 0) setProgress(progressRecords[0]);
        setSessions(sessionRecords);
        setIsSubscribed(subscriptionStatus.isSubscribed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const streak = progress?.current_streak || 0;
  const totalXp = progress?.total_xp || 0;
  const level = progress?.current_level || 1;
  const totalPuzzles = progress?.total_puzzles_completed || 0;
  const todaySession = sessions.find(s => s.date === format(new Date(), "yyyy-MM-dd"));
  const todayMinutes = todaySession ? Math.round(todaySession.duration_seconds / 60) : 0;
  const goalMinutes = progress?.daily_goal_minutes || 10;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Music className="w-4 h-4 text-primary" />
          </div>
          <span className="font-heading text-lg text-primary">Noteably</span>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-muted-foreground hidden sm:block">{user.full_name || user.email}</span>}
          <Link to="/settings" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="font-display text-3xl mb-1">
            {user?.full_name ? `Hello, ${user.full_name.split(" ")[0]}` : "Welcome back"} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {streak > 0 ? `${streak}-day streak — keep it going!` : "Start today's practice to build your streak."}
          </p>
        </div>

        {/* Today's goal */}
        {isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-heading text-lg">Today's Goal</div>
                <div className="text-sm text-muted-foreground">
                  {todayMinutes}/{goalMinutes} minutes practiced
                </div>
              </div>
              <Link
                to="/practice"
                className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all"
              >
                {todayMinutes > 0 ? "Continue" : "Practice Now"}
              </Link>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, (todayMinutes / goalMinutes) * 100)}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Subscribe CTA */}
        {isSubscribed === false && (
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 text-center">
            <Music className="w-8 h-8 text-primary mx-auto mb-3" />
            <h2 className="font-display text-xl mb-2">Unlock Noteably</h2>
            <p className="text-muted-foreground text-sm mb-4">Get unlimited puzzles, streak tracking, and full progress analytics for $5/month.</p>
            <Link to="/" className="inline-block bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all">
              Subscribe — $5/month
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Flame} label="Day Streak" value={streak} sub="consecutive days" color="text-orange-400" />
          <StatCard icon={Star} label="Total XP" value={totalXp.toLocaleString()} sub="points earned" />
          <StatCard icon={TrendingUp} label="Level" value={level} sub={`of 20`} />
          <StatCard icon={Award} label="Puzzles" value={totalPuzzles} sub="completed total" />
        </div>

        {/* Practice calendar */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-heading text-lg">Practice History</h2>
          </div>
          <StreakCalendar sessions={sessions} />
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-secondary" /> No practice
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary/50" /> Short session
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" /> Goal met
            </div>
          </div>
        </div>

        {/* Pro Practice CTA */}
        {isSubscribed && (
          <div className="bg-primary/5 border border-primary/30 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <div className="font-heading text-base">Advanced Practice</div>
                <div className="text-xs text-muted-foreground mt-0.5">Structured exercises, AI-assisted sheet segments, and recording review.</div>
              </div>
            </div>
            <Link to="/pro-practice" className="text-xs bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-all whitespace-nowrap ml-3">
              Open
            </Link>
          </div>
        )}

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-4 h-4 text-primary" />
              <h2 className="font-heading text-lg">Recent Sessions</h2>
            </div>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((s, i) => {
                const accuracy = s.puzzles_completed > 0
                  ? Math.round((s.puzzles_correct / s.puzzles_completed) * 100)
                  : 0;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{s.date}</div>
                      <div className="text-xs text-muted-foreground">{s.puzzles_completed} puzzles · {accuracy}% accuracy</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-primary font-medium">+{s.xp_earned || 0} XP</div>
                      <div className="text-xs text-muted-foreground">{Math.round(s.duration_seconds / 60)} min</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
