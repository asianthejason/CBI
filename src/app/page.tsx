"use client";

import { useEffect, useMemo, useState } from "react";

type TeamKey = "A" | "B" | "C" | "D";
type RoundLabel = "Round 1" | "Round 2" | "Round 3";
type PlayerSlot =
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "D1"
  | "D2"
  | "D3"
  | "D4";

type Pair = [PlayerSlot, PlayerSlot];

type TeamRosterEntry = {
  slot: PlayerSlot;
  rosterLabel: string;
  name: string;
};

type TeamData = {
  key: TeamKey;
  title: string;
  season: string;
  roster: TeamRosterEntry[];
};

type MatchData = {
  id: number;
  left: Pair;
  right: Pair;
};

type RoundSchedule = {
  roundLabel: RoundLabel;
  matches: MatchData[];
};

type ScoreRow = {
  front9: Array<number | null>;
  back9: Array<number | null>;
};

type MatchScorecard = {
  left: ScoreRow;
  right: ScoreRow;
};

type LeagueData = {
  teams: Record<TeamKey, TeamData>;
  rounds: RoundSchedule[];
  scores: Partial<Record<`${RoundLabel}-${number}`, MatchScorecard>>;
};

const initialLeagueData: LeagueData = {
  teams: {
    A: {
      key: "A",
      title: "Team A",
      season: "2026",
      roster: [
        { slot: "A1", rosterLabel: "C", name: "Jason Huang" },
        { slot: "A2", rosterLabel: "1", name: "Mason Lee" },
        { slot: "A3", rosterLabel: "2", name: "Noah Kim" },
        { slot: "A4", rosterLabel: "3", name: "Ethan Park" },
      ],
    },
    B: {
      key: "B",
      title: "Team B",
      season: "2026",
      roster: [
        { slot: "B1", rosterLabel: "C", name: "Liam Chen" },
        { slot: "B2", rosterLabel: "1", name: "Owen Tran" },
        { slot: "B3", rosterLabel: "2", name: "Lucas Wong" },
        { slot: "B4", rosterLabel: "3", name: "Daniel Yu" },
      ],
    },
    C: {
      key: "C",
      title: "Team C",
      season: "2026",
      roster: [
        { slot: "C1", rosterLabel: "C", name: "Ryan Patel" },
        { slot: "C2", rosterLabel: "1", name: "Aiden Smith" },
        { slot: "C3", rosterLabel: "2", name: "Caleb Nguyen" },
        { slot: "C4", rosterLabel: "3", name: "Jack Wilson" },
      ],
    },
    D: {
      key: "D",
      title: "Team D",
      season: "2026",
      roster: [
        { slot: "D1", rosterLabel: "C", name: "Ben Thompson" },
        { slot: "D2", rosterLabel: "1", name: "Cole Anderson" },
        { slot: "D3", rosterLabel: "2", name: "Tyler Brown" },
        { slot: "D4", rosterLabel: "3", name: "Logan Martin" },
      ],
    },
  },
  rounds: [
    {
      roundLabel: "Round 1",
      matches: [
        { id: 1, left: ["A1", "A2"], right: ["B1", "B2"] },
        { id: 2, left: ["A3", "A4"], right: ["B3", "B4"] },
        { id: 3, left: ["C1", "C2"], right: ["D1", "D2"] },
        { id: 4, left: ["C3", "C4"], right: ["D3", "D4"] },
      ],
    },
    {
      roundLabel: "Round 2",
      matches: [
        { id: 1, left: ["A1", "A3"], right: ["C1", "C3"] },
        { id: 2, left: ["A2", "A4"], right: ["C2", "C4"] },
        { id: 3, left: ["B1", "B3"], right: ["D1", "D3"] },
        { id: 4, left: ["B2", "B4"], right: ["D2", "D4"] },
      ],
    },
    {
      roundLabel: "Round 3",
      matches: [
        { id: 1, left: ["A1", "A4"], right: ["D1", "D4"] },
        { id: 2, left: ["A2", "A3"], right: ["D2", "D3"] },
        { id: 3, left: ["B1", "B4"], right: ["C1", "C4"] },
        { id: 4, left: ["B2", "B3"], right: ["C2", "C3"] },
      ],
    },
  ],
  // Future admin page can write live score data into this object.
  // Keys intentionally match the visible scorecard ids.
  scores: {},
};

function buildPlayerLookup(teams: LeagueData["teams"]) {
  return (Object.values(teams).flatMap((team) => team.roster) as TeamRosterEntry[]).reduce(
    (acc, player) => {
      acc[player.slot] = player;
      return acc;
    },
    {} as Record<PlayerSlot, TeamRosterEntry>,
  );
}

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

function sumNullable(values: Array<number | null>) {
  const total = values.reduce((sum, value) => sum + (value ?? 0), 0);
  const hasAnyScore = values.some((value) => value !== null);
  return hasAnyScore ? total : null;
}

function getScoreDisplay(value: number | null) {
  return value === null ? "—" : String(value);
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
      {subtitle ? <p className="text-sm text-white/70">{subtitle}</p> : null}
    </div>
  );
}

function TeamTable({ team }: { team: TeamData }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.14),transparent_55%)]" />
      </div>
      <div className="relative flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
            {team.key}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{team.title}</div>
            <div className="text-xs text-white/65">Roster (admin-ready source)</div>
          </div>
        </div>
        <Pill>{team.season}</Pill>
      </div>

      <div className="relative px-4 pb-4 pt-3">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full table-fixed">
            <tbody>
              <tr className="bg-white/8">
                <td className="w-12 border-r border-white/10 px-3 py-2 text-center text-xs font-semibold text-white/80">
                  
                </td>
                <td className="px-3 py-2 text-sm text-white/90">Name</td>
              </tr>
              {team.roster.map((player, idx) => (
                <tr
                  key={player.slot}
                  className={idx % 2 === 1 ? "bg-white/[0.03]" : "bg-transparent"}
                >
                  <td className="w-12 border-r border-white/10 px-3 py-2 text-center text-xs font-semibold text-white/80">
                    {player.rosterLabel}
                  </td>
                  <td className="px-3 py-2 text-sm text-white/90">{player.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlayerBadge({
  slot,
  player,
}: {
  slot: PlayerSlot;
  player: TeamRosterEntry | undefined;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90 shadow-sm">
      <span className="shrink-0 font-semibold text-emerald-200">{slot}</span>
      <span className="min-w-0 truncate text-white/70">{player?.name ?? `Player ${slot}`}</span>
    </div>
  );
}

function PairStack({
  pair,
  playersBySlot,
}: {
  pair: Pair;
  playersBySlot: Record<PlayerSlot, TeamRosterEntry>;
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-2">
        <PlayerBadge slot={pair[0]} player={playersBySlot[pair[0]]} />
        <PlayerBadge slot={pair[1]} player={playersBySlot[pair[1]]} />
      </div>
    </div>
  );
}

function MatchupsRoundCard({
  round,
  playersBySlot,
}: {
  round: RoundSchedule;
  playersBySlot: Record<PlayerSlot, TeamRosterEntry>;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-white">{round.roundLabel}</div>
          <div className="mt-1 text-xs text-white/65">Matches</div>
        </div>
        <Pill>{round.matches.length} groups</Pill>
      </div>

      <div className="relative mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="mb-3 text-xs font-semibold tracking-wide text-white/70">Matches</div>
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
                <PairStack pair={m.left} playersBySlot={playersBySlot} />
                <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                  vs
                </div>
                <PairStack pair={m.right} playersBySlot={playersBySlot} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ScoreTeamCell({ players }: { players: TeamRosterEntry[] }) {
  return (
    <div className="flex min-w-0 flex-col leading-tight">
      <span className="truncate">{players[0]?.name ?? "TBD"}</span>
      <span className="truncate text-white/65">{players[1]?.name ?? "TBD"}</span>
    </div>
  );
}

function ScorecardTable({
  label,
  columns,
  suffixColumns,
  rowTeams,
  side,
}: {
  label: string;
  columns: number[];
  suffixColumns: string[];
  rowTeams: TeamRosterEntry[][];
  side: "front" | "back";
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-white/[0.06]">
            <th className="w-32 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-white/70 sm:w-40 sm:px-3 sm:text-[11px] lg:w-44">
              {label}
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-0.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/70 sm:px-1 sm:text-[11px]"
              >
                {col}
              </th>
            ))}
            {suffixColumns.map((col) => (
              <th
                key={col}
                className="px-0.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/70 sm:px-1 sm:text-[11px]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowTeams.map((players, index) => {
            const scoreRow = {
              front9: Array.from({ length: 9 }, () => null),
              back9: Array.from({ length: 9 }, () => null),
            };
            const visibleScores = side === "front" ? scoreRow.front9 : scoreRow.back9;
            const outTotal = sumNullable(scoreRow.front9);
            const inTotal = sumNullable(scoreRow.back9);
            const grandTotal =
              outTotal === null && inTotal === null
                ? null
                : (outTotal ?? 0) + (inTotal ?? 0);

            return (
              <tr key={`${side}-${index}`} className="border-t border-white/10 align-top">
                <td className="px-2 py-2 text-[11px] font-semibold text-white/80 sm:px-3 sm:text-xs">
                  <ScoreTeamCell players={players} />
                </td>
                {visibleScores.map((score, scoreIndex) => (
                  <td
                    key={`${side}-${index}-${columns[scoreIndex]}`}
                    className="px-0.5 py-2 text-center text-[11px] font-semibold text-white/35 sm:px-1 sm:text-sm"
                  >
                    {getScoreDisplay(score)}
                  </td>
                ))}
                {side === "front" ? (
                  <td className="px-0.5 py-2 text-center text-[11px] font-semibold text-white/35 sm:px-1 sm:text-sm">
                    {getScoreDisplay(outTotal)}
                  </td>
                ) : (
                  <>
                    <td className="px-0.5 py-2 text-center text-[11px] font-semibold text-white/35 sm:px-1 sm:text-sm">
                      {getScoreDisplay(inTotal)}
                    </td>
                    <td className="px-0.5 py-2 text-center text-[11px] font-semibold text-white/35 sm:px-1 sm:text-sm">
                      {getScoreDisplay(grandTotal)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Scorecard({
  title,
  left,
  right,
  playersBySlot,
}: {
  title: string;
  left: Pair;
  right: Pair;
  playersBySlot: Record<PlayerSlot, TeamRosterEntry>;
}) {
  const frontNine = Array.from({ length: 9 }, (_, i) => i + 1);
  const backNine = Array.from({ length: 9 }, (_, i) => i + 10);
  const rowTeams = [
    [playersBySlot[left[0]], playersBySlot[left[1]]],
    [playersBySlot[right[0]], playersBySlot[right[1]]],
  ];

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

        <div className="mt-4 flex flex-col gap-3">
          <ScorecardTable
            label="Team"
            columns={frontNine}
            suffixColumns={["Out"]}
            rowTeams={rowTeams}
            side="front"
          />
          <ScorecardTable
            label="Team"
            columns={backNine}
            suffixColumns={["In", "Tot"]}
            rowTeams={rowTeams}
            side="back"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/55">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Admin page can plug scores into the same data model later
          </span>
          <span className="hidden sm:inline">Front 9 and back 9 are split for easier mobile reading</span>
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
  const [activeRound, setActiveRound] = useState<RoundLabel>("Round 1");

  // Single source of truth for the page.
  // Later, your admin page can replace this with DB-backed data and the UI below will auto-refresh.
  const league = useMemo(() => initialLeagueData, []);
  const playersBySlot = useMemo(() => buildPlayerLookup(league.teams), [league]);
  const rounds = league.rounds;
  const teams = Object.values(league.teams);
  const activeSchedule = rounds.find((r) => r.roundLabel === activeRound) ?? rounds[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.32),transparent_52%),radial-gradient(circle_at_90%_20%,rgba(34,197,94,0.24),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.92),rgba(2,6,23,1))]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-soft-light">
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.9)_0px,rgba(255,255,255,0.9)_1px,transparent_1px,transparent_16px)]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
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

        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Teams"
            subtitle="This roster table is now the single source of truth for player names, so a future admin page can update these names once and auto-populate matchups + scorecards below."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => (
              <TeamTable key={team.key} team={team} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Matchups"
            subtitle="Player names here are now derived from the team roster data above, so they are ready to auto-update when an admin editor is added later."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {rounds.map((round) => (
              <MatchupsRoundCard
                key={round.roundLabel}
                round={round}
                playersBySlot={playersBySlot}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Scorecards"
            subtitle="These scorecards now read the same shared roster data too, so team names will stay in sync with the admin-managed team list later."
          />

          <div className="flex flex-wrap items-center gap-2">
            {(["Round 1", "Round 2", "Round 3"] as const).map((round) => {
              const active = round === activeRound;
              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => setActiveRound(round)}
                  className={
                    "rounded-full px-4 py-2 text-sm font-semibold transition-all " +
                    (active
                      ? "bg-emerald-400 text-black shadow-[0_10px_30px_-18px_rgba(52,211,153,0.9)]"
                      : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/8")
                  }
                  aria-pressed={active}
                >
                  {round}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {activeSchedule.matches.map((match) => (
              <Scorecard
                key={`${activeSchedule.roundLabel}-${match.id}`}
                title={`${activeSchedule.roundLabel} — Match ${match.id}`}
                left={match.left}
                right={match.right}
                playersBySlot={playersBySlot}
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
