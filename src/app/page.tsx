"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  calculateScoreTotals,
  ROUND_LABELS,
  TEAM_IDS,
  TEAM_SLOT_LABELS,
  getPlayerName,
  getRoundSchedule,
  getTeamPlayerLabels,
  type MatchHoleScore,
  type Pair,
  type RoundLabel,
  type TeamId,
  useLeagueState,
} from "./lib/league-store";

function format2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function useCountdown(target: Date) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const safeNow = now ?? new Date();
  const diffMs = target.getTime() - safeNow.getTime();
  const totalSec = Math.floor(Math.max(0, diffMs) / 1000);
  const days = Math.floor(totalSec / (24 * 3600));
  const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return { days, hours, minutes, seconds };
}

function Pill({ children }: { children: ReactNode }) {
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

function PlayerBadge({
  label,
  playerNames,
}: {
  label: string;
  playerNames: Record<string, string>;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90 shadow-sm">
      <span className="shrink-0 font-semibold text-emerald-200">{label}</span>
      <span className="min-w-0 truncate text-white/70">{getPlayerName(playerNames, label)}</span>
    </div>
  );
}

function PairStack({
  pair,
  playerNames,
}: {
  pair: Pair;
  playerNames: Record<string, string>;
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-2">
        <PlayerBadge label={pair[0]} playerNames={playerNames} />
        <PlayerBadge label={pair[1]} playerNames={playerNames} />
      </div>
    </div>
  );
}

function TeamTable({
  team,
  playerNames,
}: {
  team: TeamId;
  playerNames: Record<string, string>;
}) {
  const labels = getTeamPlayerLabels(team);
  const rows: Array<[string, string]> = labels.map((label, index) => [
    TEAM_SLOT_LABELS[index],
    getPlayerName(playerNames, label),
  ]);

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
                  key={`${team}-${left}`}
                  className={idx % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
                >
                  <td className="w-12 border-r border-white/10 px-3 py-2 text-center text-xs font-semibold text-white/80">
                    {left}
                  </td>
                  <td className="px-3 py-2 text-sm text-white/90">
                    <span className="block truncate">{right}</span>
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

function formatMatchSummary(score: MatchHoleScore) {
  const leftTotals = calculateScoreTotals(score.left);
  const rightTotals = calculateScoreTotals(score.right);

  if (leftTotals.total === null && rightTotals.total === null) {
    return null;
  }

  return `${leftTotals.total ?? 0} - ${rightTotals.total ?? 0}`;
}

function MatchupCard({
  match,
  playerNames,
  score,
}: {
  match: { id: number; left: Pair; right: Pair };
  playerNames: Record<string, string>;
  score: MatchHoleScore;
}) {
  const summary = formatMatchSummary(score);

  return (
    <div className="relative min-w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white/85">
            {match.id}
          </span>
          <span className="text-sm font-semibold text-white/90">Match {match.id}</span>
        </div>
        {summary ? <Pill>{summary}</Pill> : null}
      </div>

      <div className="relative flex min-w-0 flex-col gap-3">
        <PairStack pair={match.left} playerNames={playerNames} />
        <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">vs</div>
        <PairStack pair={match.right} playerNames={playerNames} />
      </div>
    </div>
  );
}

function Scorecard({
  title,
  left,
  right,
  playerNames,
  score,
}: {
  title: string;
  left: Pair;
  right: Pair;
  playerNames: Record<string, string>;
  score: MatchHoleScore;
}) {
  const frontNine = Array.from({ length: 9 }, (_, i) => i + 1);
  const backNine = Array.from({ length: 9 }, (_, i) => i + 10);

  const leftName = `${getPlayerName(playerNames, left[0])} / ${getPlayerName(playerNames, left[1])}`;
  const rightName = `${getPlayerName(playerNames, right[0])} / ${getPlayerName(playerNames, right[1])}`;
  const leftTotals = calculateScoreTotals(score.left);
  const rightTotals = calculateScoreTotals(score.right);

  const Cell = ({ value, muted = false }: { value: ReactNode; muted?: boolean }) => (
    <div className={"flex h-11 min-w-[40px] items-center justify-center border-l border-white/10 px-1 text-center text-sm font-semibold " + (muted ? "text-white/60" : "text-white/88")}>
      {value}
    </div>
  );

  const ScoreRow = ({
    name,
    holes,
    totals,
    topBorder = false,
  }: {
    name: string;
    holes: Array<number | null>;
    totals: { out: number | null; in: number | null; total: number | null };
    topBorder?: boolean;
  }) => (
    <div
      className={
        "grid min-w-[980px] grid-cols-[200px_repeat(9,minmax(40px,1fr))_56px_repeat(9,minmax(40px,1fr))_56px_56px] bg-transparent " +
        (topBorder ? "border-t border-white/10" : "")
      }
    >
      <div className="flex h-11 items-center px-3 text-sm font-semibold text-white/88">{name}</div>
      {holes.slice(0, 9).map((value, index) => (
        <Cell key={`front-${name}-${index}`} value={value ?? "—"} />
      ))}
      <Cell value={totals.out ?? "—"} muted />
      {holes.slice(9, 18).map((value, index) => (
        <Cell key={`back-${name}-${index}`} value={value ?? "—"} />
      ))}
      <Cell value={totals.in ?? "—"} muted />
      <Cell value={totals.total ?? "—"} muted />
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
          <Pill>{formatMatchSummary(score) ?? "Score"}</Pill>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
          <div className="grid min-w-[980px] grid-cols-[200px_repeat(9,minmax(40px,1fr))_56px_repeat(9,minmax(40px,1fr))_56px_56px] border-b border-white/10 bg-white/[0.04]">
            <div className="flex h-11 items-center px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Pairing
            </div>
            {frontNine.map((hole) => (
              <Cell key={`head-front-${hole}`} value={hole} muted />
            ))}
            <Cell value="OUT" muted />
            {backNine.map((hole) => (
              <Cell key={`head-back-${hole}`} value={hole} muted />
            ))}
            <Cell value="IN" muted />
            <Cell value="TOT" muted />
          </div>

          <ScoreRow name={leftName} holes={score.left} totals={leftTotals} />
          <ScoreRow name={rightName} holes={score.right} totals={rightTotals} topBorder />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const draftDate = useMemo(() => new Date("2026-07-09T20:00:00"), []);
  const cd = useCountdown(draftDate);
  const { state } = useLeagueState();
  const [activeMatchupRound, setActiveMatchupRound] = useState<RoundLabel>("Round 1");
  const [activeRound, setActiveRound] = useState<RoundLabel>("Round 1");

  const activeMatchupSchedule = getRoundSchedule(activeMatchupRound);
  const activeSchedule = getRoundSchedule(activeRound);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.32),transparent_52%),radial-gradient(circle_at_90%_20%,rgba(34,197,94,0.24),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.92),rgba(2,6,23,1))]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-soft-light">
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.9)_0px,rgba(255,255,255,0.9)_1px,transparent_1px,transparent_16px)]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
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
                  <div className="mt-1 text-xs text-white/60">{draftDate.toLocaleString()}</div>
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
                    <div className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">{b.value}</div>
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
          <SectionTitle title="Teams" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM_IDS.map((team) => (
              <TeamTable key={team} team={team} playerNames={state.playerNames} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle title="Matchups" />

          <div className="flex flex-wrap items-center gap-2">
            {ROUND_LABELS.map((round) => {
              const active = round === activeMatchupRound;
              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => setActiveMatchupRound(round)}
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
                  <MatchupCard
                    key={`${activeMatchupSchedule.roundLabel}-${match.id}`}
                    match={match}
                    playerNames={state.playerNames}
                    score={state.matchScores[activeMatchupSchedule.roundLabel][match.id]}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle title="Scorecards" />

          <div className="flex flex-wrap items-center gap-2">
            {ROUND_LABELS.map((round) => {
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

          <div className="grid gap-4 lg:grid-cols-1">
            {activeSchedule.matches.map((match) => (
              <Scorecard
                key={`${activeSchedule.roundLabel}-${match.id}`}
                title={`${activeSchedule.roundLabel} — Match ${match.id}`}
                left={match.left}
                right={match.right}
                playerNames={state.playerNames}
                score={state.matchScores[activeSchedule.roundLabel][match.id]}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
