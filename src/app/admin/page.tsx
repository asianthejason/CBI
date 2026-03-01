"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  BACK_NINE,
  FRONT_NINE,
  ROUND_LABELS,
  getDefaultLeagueState,
  getPairLabel,
  getPlayerName,
  getRoundSchedule,
  getTeamPlayerLabels,
  TEAM_IDS,
  TEAM_SLOT_LABELS,
  type LeagueState,
  type RoundLabel,
  type TeamId,
  useAdminAuth,
  useLeagueState,
  calculateScoreTotals,
} from "../lib/league-store";

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

function ScoreValue({ value }: { value: number | null }) {
  return <span>{value ?? "—"}</span>;
}

function HoleInput({
  hole,
  value,
  onChange,
}: {
  hole: number;
  value: number | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 px-1.5 py-2 text-center">
      <div className="text-[11px] font-semibold text-white/55">{hole}</div>
      <input
        type="number"
        min="1"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-lg border border-white/10 bg-black/25 px-1 text-center text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-emerald-300/40"
        placeholder="—"
      />
    </div>
  );
}

function ScoreboardRow({
  title,
  subtitle,
  scores,
  onHoleChange,
}: {
  title: string;
  subtitle: string;
  scores: (number | null)[];
  onHoleChange: (holeIndex: number, value: string) => void;
}) {
  const totals = calculateScoreTotals(scores);

  return (
    <div className="grid min-w-[620px] grid-cols-[118px_minmax(0,1fr)_62px] border-t border-white/10 first:border-t-0">
      <div className="flex flex-col justify-center border-r border-white/10 bg-black/22 px-3 py-4 sm:px-4">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        <div className="mt-1 text-[12px] text-white/72">{subtitle}</div>
      </div>

      <div className="grid min-w-0 grid-rows-2">
        <div className="grid grid-cols-10 border-b border-white/10 bg-white/[0.03]">
          {FRONT_NINE.map((hole) => (
            <HoleInput
              key={`${title}-front-${hole}`}
              hole={hole}
              value={scores[hole - 1] ?? null}
              onChange={(value) => onHoleChange(hole - 1, value)}
            />
          ))}
          <div className="flex flex-col items-center justify-center border-l border-white/10 px-1.5 py-2 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">OUT</div>
            <div className="mt-2 text-lg font-semibold text-white/90">
              <ScoreValue value={totals.out} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-10 bg-white/[0.02]">
          {BACK_NINE.map((hole) => (
            <HoleInput
              key={`${title}-back-${hole}`}
              hole={hole}
              value={scores[hole - 1] ?? null}
              onChange={(value) => onHoleChange(hole - 1, value)}
            />
          ))}
          <div className="flex flex-col items-center justify-center border-l border-white/10 px-1.5 py-2 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">IN</div>
            <div className="mt-2 text-lg font-semibold text-white/90">
              <ScoreValue value={totals.in} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center border-l border-white/10 bg-black/22 px-2 py-4 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">TOT</div>
        <div className="mt-2 text-xl font-semibold text-white">
          <ScoreValue value={totals.total} />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { state: liveState, configured, error: liveError, saveState, resetState } = useLeagueState();
  const { user, loading: authLoading, signIn, signOut } = useAdminAuth();
  const [activeRound, setActiveRound] = useState<RoundLabel>("Round 1");
  const [draftState, setDraftState] = useState<LeagueState>(getDefaultLeagueState());
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Live sync ready");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("Email/password sign-in ready");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setDraftState(liveState);
    }
  }, [isDirty, liveState]);

  useEffect(() => {
    if (!user || !configured || !isDirty) {
      return;
    }

    setSaveMessage("Saving...");
    const timer = window.setTimeout(async () => {
      try {
        await saveState(draftState);
        setIsDirty(false);
        setSaveMessage("All changes saved");
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "Save failed");
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [configured, draftState, isDirty, saveState, user]);

  useEffect(() => {
    if (liveError) {
      setSaveMessage(liveError);
    }
  }, [liveError]);

  const activeSchedule = useMemo(() => getRoundSchedule(activeRound), [activeRound]);

  const updatePlayerName = (label: string, value: string) => {
    setDraftState((current) => ({
      ...current,
      playerNames: {
        ...current.playerNames,
        [label]: value,
      },
    }));
    setIsDirty(true);
    setSaveMessage("Unsaved changes");
  };

  const updateHoleScore = (
    roundLabel: RoundLabel,
    matchId: number,
    side: "left" | "right",
    holeIndex: number,
    value: string,
  ) => {
    const parsed = value.trim() === "" ? null : Number(value);

    setDraftState((current) => {
      const nextScores = [...current.matchScores[roundLabel][matchId][side]];
      nextScores[holeIndex] = Number.isFinite(parsed) ? parsed : null;

      return {
        ...current,
        matchScores: {
          ...current.matchScores,
          [roundLabel]: {
            ...current.matchScores[roundLabel],
            [matchId]: {
              ...current.matchScores[roundLabel][matchId],
              [side]: nextScores,
            },
          },
        },
      };
    });

    setIsDirty(true);
    setSaveMessage("Unsaved changes");
  };

  const handleReset = async () => {
    try {
      setSaveMessage("Resetting...");
      await resetState();
      setIsDirty(false);
      setSaveMessage("League reset to defaults");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Reset failed");
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setAuthMessage("Enter your admin email and password.");
      return;
    }

    try {
      setIsSigningIn(true);
      setAuthMessage("Signing in...");
      await signIn(email, password);
      setPassword("");
      setAuthMessage("Signed in");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.32),transparent_52%),radial-gradient(circle_at_90%_20%,rgba(34,197,94,0.24),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(2,6,23,0.92),rgba(2,6,23,1))]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-soft-light">
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.9)_0px,rgba(255,255,255,0.9)_1px,transparent_1px,transparent_16px)]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur sm:p-10">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">League Admin</h1>
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/8"
                >
                  Home
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill>{saveMessage}</Pill>
              <Pill>{user ? user.email ?? "Signed in" : authMessage}</Pill>
              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/8"
                >
                  Sign Out
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {!configured ? (
          <section className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-50 backdrop-blur">
            Add your Firebase web app keys to <span className="font-semibold">.env.local</span> locally and to Vercel project environment variables for the deployed site.
          </section>
        ) : authLoading ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75 backdrop-blur">
            Checking admin session...
          </section>
        ) : !user ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleSignIn}>
              <label className="block">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Admin Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Password</div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40"
                  placeholder="Enter password"
                />
              </label>

              <button
                type="submit"
                disabled={isSigningIn}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_-18px_rgba(52,211,153,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSigningIn ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </section>
        ) : (
          <>
            {liveError ? (
              <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5 text-sm text-rose-50 backdrop-blur">
                Firestore can&apos;t read or write this league document right now. Check your Firestore rules and make sure the signed-in email is allowed.
              </section>
            ) : null}

            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SectionTitle
                  title="Team Names"
                  subtitle="Edit each roster slot. Autosave updates the live homepage for everyone."
                />
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/8"
                >
                  Reset All
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {TEAM_IDS.map((team: TeamId) => {
                  const labels = getTeamPlayerLabels(team);
                  return (
                    <div
                      key={team}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur"
                    >
                      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.14),transparent_55%)]" />
                      </div>

                      <div className="relative flex items-center gap-3 pb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                          {team}
                        </div>
                        <div className="text-sm font-semibold text-white">Team {team}</div>
                      </div>

                      <div className="relative space-y-3">
                        {labels.map((label, index) => (
                          <label key={label} className="block">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                              {TEAM_SLOT_LABELS[index]}
                            </div>
                            <input
                              value={draftState.playerNames[label] ?? ""}
                              onChange={(event) => updatePlayerName(label, event.target.value)}
                              placeholder={`Enter ${label} name`}
                              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle title="Match Scores" />

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

              <div className="grid gap-6 xl:grid-cols-2">
                {activeSchedule.matches.map((match) => (
                  <section
                    key={`${activeSchedule.roundLabel}-${match.id}`}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07102a]/90 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur xl:self-start"
                  >
                    <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                          {activeSchedule.roundLabel} — Match {match.id}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-white/80">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
                            {getPairLabel(match.left)}
                          </span>
                          <span className="text-lg text-white/45">vs</span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium">
                            {getPairLabel(match.right)}
                          </span>
                        </div>
                      </div>

                      <Pill>Score</Pill>
                    </div>

                    <div className="overflow-x-auto">
                      <ScoreboardRow
                        title={getPlayerName(draftState.playerNames, match.left[0])}
                        subtitle={getPlayerName(draftState.playerNames, match.left[1])}
                        scores={draftState.matchScores[activeSchedule.roundLabel][match.id].left}
                        onHoleChange={(holeIndex, value) =>
                          updateHoleScore(activeSchedule.roundLabel, match.id, "left", holeIndex, value)
                        }
                      />
                      <ScoreboardRow
                        title={getPlayerName(draftState.playerNames, match.right[0])}
                        subtitle={getPlayerName(draftState.playerNames, match.right[1])}
                        scores={draftState.matchScores[activeSchedule.roundLabel][match.id].right}
                        onHoleChange={(holeIndex, value) =>
                          updateHoleScore(activeSchedule.roundLabel, match.id, "right", holeIndex, value)
                        }
                      />
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
