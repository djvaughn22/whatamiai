"use client";
// 7-Day Starter — pick a goal, three taps, get a day-by-day starter plan
// plus your obstacle's blind spot. A local streak tracker (current + best)
// lives at the top once a plan exists. Everything stays on this device.

import { useEffect, useState } from "react";
import { composeHabitsResult, currentStreak, HABIT_GOALS, HABIT_OBSTACLES, HABIT_WHEN, loadStreak, markToday, todayMarked, type Streak } from "../lib/habitsEngine";
import type { Reflection } from "../lib/types";
import ResultView from "../components/ResultView";
import { Card, Eyebrow, GhostBtn, PageHead, PrimaryBtn, Shell, TopBar, usePalette, type Palette } from "../components/ui";

function StreakCard({ pal, streak, onMark }: { pal: Palette; streak: Streak; onMark: () => void }) {
  const goal = HABIT_GOALS.find((g) => g.id === streak.goalId);
  const cur = currentStreak(streak);
  const done = todayMarked(streak);
  return (
    <Card pal={pal} accent style={{ marginBottom: 20, textAlign: "center" }}>
      <Eyebrow pal={pal}>Your streak — {goal ? `${goal.emoji} ${goal.label.toLowerCase()}` : "current habit"}</Eyebrow>
      <p style={{ fontSize: 34, fontWeight: 900, color: pal.text, margin: "0 0 2px" }}>
        {cur} day{cur === 1 ? "" : "s"} 🔥
      </p>
      <p style={{ fontSize: 13.5, fontWeight: 700, color: pal.sub, margin: "0 0 14px" }}>Best ever: {Math.max(streak.best, cur)} day{Math.max(streak.best, cur) === 1 ? "" : "s"}</p>
      <PrimaryBtn pal={pal} disabled={done} onClick={onMark}>
        {done ? "✓ Today is in the books" : "I did today's step"}
      </PrimaryBtn>
    </Card>
  );
}

export default function HabitsPage() {
  const pal = usePalette();
  const [goalId, setGoalId] = useState("");
  const [level, setLevel] = useState(-1);
  const [obstacle, setObstacle] = useState("");
  const [when, setWhen] = useState("");
  const [result, setResult] = useState<Reflection | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreak(loadStreak());
  }, []);

  const goal = HABIT_GOALS.find((g) => g.id === goalId);
  const ready = goal && level >= 0 && obstacle && when;

  const run = () => {
    if (!ready || !goal) return;
    setResult(composeHabitsResult({ goalId: goal.id, level, obstacle, when }));
    window.scrollTo(0, 0);
  };

  const restart = () => {
    setResult(null);
    setGoalId("");
    setLevel(-1);
    setObstacle("");
    setWhen("");
    window.scrollTo(0, 0);
  };

  const mark = () => {
    // on a fresh result, the streak belongs to the plan's goal; on the
    // intro screen it belongs to whatever goal the existing streak tracks
    const gid = result ? goal?.id : streak?.goalId;
    if (!gid) return;
    setStreak(markToday(gid));
  };

  if (result) {
    const emoji = typeof result.meta?.goalEmoji === "string" ? result.meta.goalEmoji : "✅";
    return (
      <Shell pal={pal} narrow>
        <TopBar pal={pal} label="7-Day Starter" />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }} aria-hidden>{emoji}</div>
          <h1 style={{ fontSize: "clamp(1.6rem, 8vw, 2.2rem)", fontWeight: 900, color: pal.text, margin: 0, lineHeight: 1.15 }}>Your week is built</h1>
          <p style={{ fontSize: 14.5, color: pal.sub, margin: "8px 0 0", lineHeight: 1.6 }}>Come back each day and tap the streak button — the streak is the plan&apos;s engine.</p>
        </div>
        {(streak || goal) && (
          <StreakCard pal={pal} streak={streak && streak.goalId === goal?.id ? streak : { goalId: goal?.id ?? "", days: [], best: streak?.best ?? 0 }} onMark={mark} />
        )}
        <ResultView pal={pal} reflection={result} onRestart={restart} restartLabel="Build a different week" />
      </Shell>
    );
  }

  return (
    <Shell pal={pal} narrow>
      <TopBar pal={pal} label="7-Day Starter" />
      <PageHead
        pal={pal}
        title="One habit. One week. Sized to real life."
        sub="Pick the habit, answer three taps, get a day-by-day starter plan — small on purpose, with a streak to keep."
      />

      {streak && <StreakCard pal={pal} streak={streak} onMark={mark} />}

      <Card pal={pal} style={{ marginBottom: 18 }}>
        <Eyebrow pal={pal}>What are we building?</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {HABIT_GOALS.map((g) => {
            const selected = goalId === g.id;
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={selected}
                onClick={() => { setGoalId(g.id); setLevel(-1); }}
                style={{ background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 14, padding: "14px 12px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", textAlign: "left", minHeight: 56 }}
              >
                {g.emoji} {g.label}
              </button>
            );
          })}
        </div>
      </Card>

      {goal && (
        <Card pal={pal} style={{ marginBottom: 18 }}>
          <Eyebrow pal={pal}>{goal.levelQ}</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goal.levels.map((l, i) => {
              const selected = level === i;
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLevel(i)}
                  style={{ textAlign: "left", background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 14, padding: "13px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer", minHeight: 48 }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {goal && level >= 0 && (
        <Card pal={pal} style={{ marginBottom: 18 }}>
          <Eyebrow pal={pal}>What usually kills it?</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {HABIT_OBSTACLES.map((o) => {
              const selected = obstacle === o;
              return (
                <button key={o} type="button" aria-pressed={selected} onClick={() => setObstacle(o)}
                  style={{ background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 50, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 44 }}>
                  {o}
                </button>
              );
            })}
          </div>
          <Eyebrow pal={pal}>Your most reliable pocket of time?</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {HABIT_WHEN.map((w) => {
              const selected = when === w;
              return (
                <button key={w} type="button" aria-pressed={selected} onClick={() => setWhen(w)}
                  style={{ background: selected ? pal.brand : pal.card, color: selected ? pal.ink : pal.text, border: `2px solid ${selected ? pal.brand : pal.border}`, borderRadius: 50, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 44 }}>
                  {w}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <PrimaryBtn pal={pal} full disabled={!ready} onClick={run}>
        {ready ? "Build my week →" : "Pick a habit and answer the taps"}
      </PrimaryBtn>

      {streak === null && (
        <p style={{ fontSize: 12.5, color: pal.sub, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          Plans and streaks stay in this browser — no account, nothing sent anywhere.
        </p>
      )}
      <p style={{ textAlign: "center", marginTop: 14 }}>
        <GhostBtn pal={pal} small onClick={() => (window.location.href = "/")}>← All modes</GhostBtn>
      </p>
    </Shell>
  );
}
