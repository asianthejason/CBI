"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ROUND_LABELS,
  ROUND_SCHEDULES,
  TEAM_IDS,
  TEAM_SLOT_LABELS,
  getDefaultLeagueState,
  getPlayerName,
  getTeamPlayerLabels,
  type LeagueState,
  type RoundLabel,
  type TeamId,
  useAdminAuth,
  useLeagueState,
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

export default function AdminPage() {
  const { state: liveState, configured, saveState, resetState } = useLeagueState();
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
    setDraftState(liveState);
  }, [liveState]);

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
    }, 500);

    return () => window.clearTimeout(timer);
  }, [configured, draftState, isDirty, saveState, user]);

  const activeSchedule = useMemo(
    () => ROUND_SCHEDULES.find((round) => round.roundLabel === activeRound) ?? ROUND_SCHEDULES[0],
    [activeRound],
  );

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

  const updateScore = (roundLabel: RoundLabel, matchId: number, side: "left" | "right", value: string) => {
    const parsed = value === "" ? null : Number(value);

    setDraftState((current) => ({
      ...current,
      matchScores: {
        ...current.matchScores,
        [roundLabel]: {
          ...current.matchScores[roundLabel],
          [matchId]: {
            ...current.matchScores[roundLabel][matchId],
            [side]: Number.isFinite(parsed) ? parsed : null,
          },
        },
      },
    }));
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
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">League Admin</h1>
              <p className="mt-3 text-sm text-white/65 sm:text-base">
                Update team names and match scores here. Firestore pushes those changes live to the homepage.
              </p>
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
              <SectionTitle title="Match Scores" subtitle="Enter a total for each side in each match." />

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

              <div className="grid gap-4 lg:grid-cols-2">
                {activeSchedule.matches.map((match) => (
                  <div
                    key={`${activeSchedule.roundLabel}-${match.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur"
                  >
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="h-full w-full bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.18),transparent_50%),radial-gradient(circle_at_90%_100%,rgba(16,185,129,0.14),transparent_55%)]" />
                    </div>

                    <div className="relative mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {activeSchedule.roundLabel} — Match {match.id}
                        </div>
                        <div className="mt-1 text-xs text-white/55">Live updates flow to matchup cards and scorecards.</div>
                      </div>
                      <Pill>Match {match.id}</Pill>
                    </div>

                    <div className="relative space-y-3">
                      {([
                        { side: "left", pair: match.left },
                        { side: "right", pair: match.right },
                      ] as const).map((entry) => (
                        <div
                          key={`${activeSchedule.roundLabel}-${match.id}-${entry.side}`}
                          className="rounded-xl border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-white/90">
                                {getPlayerName(draftState.playerNames, entry.pair[0])} / {getPlayerName(draftState.playerNames, entry.pair[1])}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">
                                {entry.pair[0]} · {entry.pair[1]}
                              </div>
                            </div>

                            <label className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Score</span>
                              <input
                                type="number"
                                min="0"
                                value={draftState.matchScores[activeSchedule.roundLabel][match.id][entry.side] ?? ""}
                                onChange={(event) =>
                                  updateScore(activeSchedule.roundLabel, match.id, entry.side, event.target.value)
                                }
                                className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/40"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
