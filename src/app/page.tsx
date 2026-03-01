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

          </div>
        </div>
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

function MatchupCard({ match }: { match: RoundSchedule["matches"][number] }) {
  return (
    <div className="relative min-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="relative mb-3 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white/85">
          {match.id}
        </span>
        <span className="text-sm font-semibold text-white/90">Match {match.id}</span>
      </div>

      <div className="relative flex min-w-0 flex-col gap-3">
        <PairStack pair={match.left} />
        <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          vs
        </div>
        <PairStack pair={match.right} />
      </div>
    </div>
  );
}

function Scorecard({ title, left, right }: { title: string; left: Pair; right: Pair }) {
  const frontNine = Array.from({ length: 9 }, (_, i) => i + 1);
  const backNine = Array.from({ length: 9 }, (_, i) => i + 10);
  const rowTeams = [
    [getPlayerName(left[0]), getPlayerName(left[1])],
    [getPlayerName(right[0]), getPlayerName(right[1])],
  ];

  const ScoreStrip = ({
    players,
    showTopBorder,
  }: {
    players: [string, string];
    showTopBorder?: boolean;
  }) => (
    <div
      className={
        "grid grid-cols-[110px_repeat(10,minmax(0,1fr))_56px] overflow-hidden sm:grid-cols-[130px_repeat(10,minmax(0,1fr))_62px] " +
        (showTopBorder ? "border-t border-white/10" : "")
      }
    >
      <div className="row-span-2 flex min-h-[96px] flex-col justify-center border-r border-white/10 px-2 py-3 text-[11px] font-semibold leading-5 text-white/85 sm:px-3 sm:text-xs">
        <span className="truncate">{players[0]}</span>
        <span className="truncate text-white/65">{players[1]}</span>
      </div>

      {[...frontNine, "OUT"].map((hole) => (
        <div
          key={`front-label-${players[0]}-${hole}`}
          className="flex h-[48px] min-w-0 flex-col items-center justify-center border-b border-white/10 bg-white/[0.05] px-0 text-center"
        >
          <span className="text-[10px] font-semibold uppercase tracking-tight text-white/70 sm:text-[11px]">
            {hole}
          </span>
          <span className="mt-1 text-sm font-semibold leading-none text-white/35">—</span>
        </div>
      ))}

      <div className="row-span-2 flex min-h-[96px] flex-col items-center justify-center border-l border-white/10 px-1 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60 sm:text-[11px]">
          Tot
        </span>
        <span className="mt-2 text-base font-semibold text-white/35 sm:text-lg">—</span>
      </div>

      {[...backNine, "IN"].map((hole) => (
        <div
          key={`back-label-${players[0]}-${hole}`}
          className="flex h-[48px] min-w-0 flex-col items-center justify-center px-0 text-center"
        >
          <span className="text-[10px] font-semibold uppercase tracking-tight text-white/70 sm:text-[11px]">
            {hole}
          </span>
          <span className="mt-1 text-sm font-semibold leading-none text-white/35">—</span>
        </div>
      ))}
    </div>
  );

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

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20">
          <ScoreStrip players={rowTeams[0] as [string, string]} />
          <ScoreStrip players={rowTeams[1] as [string, string]} showTopBorder />
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
  const [activeMatchupRound, setActiveMatchupRound] = useState<"Round 1" | "Round 2" | "Round 3">(
    "Round 1",
  );
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

  const activeMatchupSchedule =
    rounds.find((r) => r.roundLabel === activeMatchupRound) ?? rounds[0];
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

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Cockboys Invitational 2026
              </h1>

            </div>

            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Countdown to Draft</div>
                  <div className="mt-1 text-xs text-white/60">
                    {draftDate.toLocaleString()}
                  </div>
                </div>
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
            />

          <div className="flex flex-wrap items-center gap-2">
            {(["Round 1", "Round 2", "Round 3"] as const).map((r) => {
              const active = r === activeMatchupRound;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveMatchupRound(r)}
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

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur sm:p-5">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-lime-300/10 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-white">{activeMatchupSchedule.roundLabel}</div>

              </div>
              <Pill>Matches</Pill>
            </div>

            <div className="relative mt-4 overflow-x-auto pb-1">
              <div className="grid min-w-[1180px] grid-cols-4 gap-4">
                {activeMatchupSchedule.matches.map((match) => (
                  <MatchupCard key={`${activeMatchupSchedule.roundLabel}-${match.id}`} match={match} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SCORECARDS */}
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Scorecards"
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

      </main>
    </div>
  );
}
