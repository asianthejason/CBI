"use client";

import { useEffect, useMemo, useState } from "react";

type Pair = [string, string];

const playerNames: Record<string, string> = {
  A1: "Jason Huang",
  A2: "Mason Lee",
  A3: "Noah Kim",
  A4: "Ethan Park",
  B1: "Liam Chen",
  B2: "Owen Tran",
  B3: "Lucas Wong",
  B4: "Daniel Yu",
  C1: "Ryan Patel",
  C2: "Aiden Smith",
  C3: "Caleb Nguyen",
  C4: "Jack Wilson",
  D1: "Ben Thompson",
  D2: "Cole Anderson",
  D3: "Tyler Brown",
  D4: "Logan Martin",
};

function getPlayerName(label: string) {
  return playerNames[label] ?? `Player ${label}`;
}

function PlayerBadge({ label }: { label: string }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90 shadow-sm">
      <span className="shrink-0 font-semibold text-emerald-200">{label}</span>
      <span className="min-w-0 truncate text-white/70">{getPlayerName(label)}</span>
    </div>
  );
}

function PairStack({ pair }: { pair: Pair }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-2">
        <PlayerBadge label={pair[0]} />
        <PlayerBadge label={pair[1]} />
      </div>
    </div>
  );
}

type RoundSchedule = {
  roundLabel: "Round 1" | "Round 2" | "Round 3";
  teamPairs: Record<"A" | "B" | "C" | "D", Pair[]>;
  matches: { id: number; left: Pair; right: Pair }[];
};

function format2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function useCountdown(target: Date) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    if (!now) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
    }
    const diffMs = target.getTime() - now.getTime();
    const done = diffMs <= 0;
    const totalSec = Math.floor(Math.max(0, diffMs) / 1000);
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return { days, hours, minutes, seconds, done };
  }, [now, target]);
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/90 shadow-sm">
      {children}
    </span>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      {subtitle ? (
        <p className="text-sm text-white/70">{subtitle}</p>
      ) : null}
    </div>
  );
}

function TeamTable({ team }: { team: "A" | "B" | "C" | "D" }) {
  const rows: Array<[string, string]> = [
    ["", "Name"],
    ["C", ""],
    ["1", ""],
    ["2", ""],
    ["3", ""],
  ];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.14),transparent_55%)]" />
      </div>
      <div className="relative flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
            {team}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Team {team}</div>
            <div className="text-xs text-white/65">Roster (placeholder)</div>
          </div>
        </div>
        <Pill>2026</Pill>
      </div>

      <div className="relative px-4 pb-4 pt-3">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full table-fixed">
            <tbody>
              {rows.map(([left, right], idx) => (
                <tr
                  key={idx}
                  className={
                    idx === 0
                      ? "bg-white/8"
                      : idx % 2 === 0
                        ? "bg-white/[0.03]"
                        : "bg-transparent"
                  }
                >
                  <td className="w-12 border-r border-white/10 px-3 py-2 text-center text-xs font-semibold text-white/80">
                    {left}
                  </td>
                  <td className="px-3 py-2 text-sm text-white/90">
                    {right || (
                      <span className="text-white/30">&nbsp;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MatchupsRoundCard({ round }: { round: RoundSchedule }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-white">{round.roundLabel}</div>
          <div className="mt-1 text-xs text-white/65">Matches</div>
        </div>
        <Pill>8 groups</Pill>
      </div>

      <div className="relative mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-3 text-xs font-semibold tracking-wide text-white/70">
          Matches
        </div>
        <ol className="flex flex-col gap-3">
          {round.matches.map((m) => (
            <li key={m.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white/85">
                  {m.id}
                </span>
                <span className="text-sm font-semibold text-white/90">Match {m.id}</span>
              </div>
              <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
                <PairStack pair={m.left} />
                <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  vs
                </div>
                <PairStack pair={m.right} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Scorecard({ title, left, right }: { title: string; left: Pair; right: Pair }) {
  const holes = Array.from({ length: 9 }, (_, i) => i + 1);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.18),transparent_50%),radial-gradient(circle_at_90%_100%,rgba(16,185,129,0.14),transparent_55%)]" />
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
              <Pill>
                {left[0]}–{left[1]}
              </Pill>
              <span className="text-white/45">vs</span>
              <Pill>
                {right[0]}–{right[1]}
              </Pill>
            </div>
          </div>
          <Pill>Score</Pill>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
          <table className="min-w-[520px] w-full table-fixed">
            <thead>
              <tr className="bg-white/[0.06]">
                <th className="w-28 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  Hole
                </th>
                {holes.map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-white/70"
                  >
                    {h}
                  </th>
                ))}
                <th className="w-14 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  TOT
                </th>
              </tr>
            </thead>
            <tbody>
              {[`(${left[0]}–${left[1]})`, `(${right[0]}–${right[1]})`].map((rowLabel) => (
                <tr key={rowLabel} className="border-t border-white/10">
                  <td className="px-3 py-2 text-xs font-semibold text-white/80">
                    {rowLabel}
                  </td>
                  {holes.map((h) => (
                    <td key={h} className="px-2 py-2 text-center text-sm text-white/35">
                      —
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center text-sm font-semibold text-white/35">
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/55">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Admin page coming soon for scores
          </span>
          <span className="hidden sm:inline">Swipe to view all holes →</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  // Draft countdown target in local time.
  // Leaving off the trailing "Z" keeps it in the viewer's local timezone.
  const draftDate = useMemo(() => new Date("2026-07-09T20:00:00"), []);
  const cd = useCountdown(draftDate);
  const [activeRound, setActiveRound] = useState<"Round 1" | "Round 2" | "Round 3">(
    "Round 1",
  );

  const rounds: RoundSchedule[] = useMemo(
    () => [
      {
        roundLabel: "Round 1",
        teamPairs: {
          A: [
            ["A1", "A2"],
            ["A3", "A4"],
          ],
          B: [
            ["B1", "B2"],
            ["B3", "B4"],
          ],
          C: [
            ["C1", "C2"],
            ["C3", "C4"],
          ],
          D: [
            ["D1", "D2"],
            ["D3", "D4"],
          ],
        },
        matches: [
          { id: 1, left: ["A1", "A2"], right: ["B1", "B2"] },
          { id: 2, left: ["A3", "A4"], right: ["B3", "B4"] },
          { id: 3, left: ["C1", "C2"], right: ["D1", "D2"] },
          { id: 4, left: ["C3", "C4"], right: ["D3", "D4"] },
        ],
      },
      {
        roundLabel: "Round 2",
        teamPairs: {
          A: [
            ["A1", "A3"],
            ["A2", "A4"],
          ],
          B: [
            ["B1", "B3"],
            ["B2", "B4"],
          ],
          C: [
            ["C1", "C3"],
            ["C2", "C4"],
          ],
          D: [
            ["D1", "D3"],
            ["D2", "D4"],
          ],
        },
        matches: [
          { id: 1, left: ["A1", "A3"], right: ["C1", "C3"] },
          { id: 2, left: ["A2", "A4"], right: ["C2", "C4"] },
          { id: 3, left: ["B1", "B3"], right: ["D1", "D3"] },
          { id: 4, left: ["B2", "B4"], right: ["D2", "D4"] },
        ],
      },
      {
        roundLabel: "Round 3",
        teamPairs: {
          A: [
            ["A1", "A4"],
            ["A2", "A3"],
          ],
          B: [
            ["B1", "B4"],
            ["B2", "B3"],
          ],
          C: [
            ["C1", "C4"],
            ["C2", "C3"],
          ],
          D: [
            ["D1", "D4"],
            ["D2", "D3"],
          ],
        },
        matches: [
          { id: 1, left: ["A1", "A4"], right: ["D1", "D4"] },
          { id: 2, left: ["A2", "A3"], right: ["D2", "D3"] },
          { id: 3, left: ["B1", "B4"], right: ["C1", "C4"] },
          { id: 4, left: ["B2", "B3"], right: ["C2", "C3"] },
        ],
      },
    ],
    [],
  );

  const activeSchedule = rounds.find((r) => r.roundLabel === activeRound) ?? rounds[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.32),transparent_52%),radial-gradient(circle_at_90%_20%,rgba(34,197,94,0.24),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.92),rgba(2,6,23,1))]">
      {/* subtle fairway lines */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-soft-light">
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.9)_0px,rgba(255,255,255,0.9)_1px,transparent_1px,transparent_16px)]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur sm:p-10">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                2026 Season
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Cockboys Invitational — Season Hub
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">
                Draft countdown, team rosters, matchups, and scorecards — all in one clean,
                golf-themed home page.
              </p>
            </div>

            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Countdown to Draft</div>
                  <div className="mt-1 text-xs text-white/60">
                    Target: {draftDate.toLocaleString()}
                  </div>
                </div>
                {cd.done ? <Pill>It’s draft time 🏌️</Pill> : <Pill>Lock in</Pill>}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                {[
                  { label: "Days", value: String(cd.days) },
                  { label: "Hours", value: format2(cd.hours) },
                  { label: "Mins", value: format2(cd.minutes) },
                  { label: "Secs", value: format2(cd.seconds) },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"
                  >
                    <div className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                      {b.value}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/60">
                      {b.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ROSTERS */}
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Teams"
            subtitle="Four tables side-by-side (mobile-friendly). Names + scores will be editable later on the admin page."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TeamTable team="A" />
            <TeamTable team="B" />
            <TeamTable team="C" />
            <TeamTable team="D" />
          </div>
        </section>

        {/* MATCHUPS */}
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Matchups"
            subtitle="Showing matches only so the layout stays cleaner and player labels + names have enough room."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {rounds.map((r) => (
              <MatchupsRoundCard key={r.roundLabel} round={r} />
            ))}
          </div>
        </section>

        {/* SCORECARDS */}
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Scorecards"
            subtitle="3 tabs (Round 1–3). Each tab shows 4 match scorecards."
          />

          <div className="flex flex-wrap items-center gap-2">
            {(
              ["Round 1", "Round 2", "Round 3"] as const
            ).map((r) => {
              const active = r === activeRound;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveRound(r)}
                  className={
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all " +
                    (active
                      ? "bg-emerald-400 text-black shadow-[0_10px_30px_-18px_rgba(52,211,153,0.9)]"
                      : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/8")
                  }
                  aria-pressed={active}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {activeSchedule.matches.map((m) => (
              <Scorecard
                key={`${activeSchedule.roundLabel}-${m.id}`}
                title={`${activeSchedule.roundLabel} — Match ${m.id}`}
                left={m.left}
                right={m.right}
              />
            ))}
          </div>
        </section>

        <footer className="pb-2 pt-6 text-center text-xs text-white/50">
          Built for the 2026 season — admin + scoring tools coming next.
        </footer>
      </main>
    </div>
  );
}
