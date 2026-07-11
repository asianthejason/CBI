"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "../lib/firebase";
import {
  BACK_NINE,
  FRONT_NINE,
  ROUND_LABELS,
  getDefaultLeagueState,
  getPairLabel,
  getPlayerName,
  getRoundSchedule,
  getTeamName,
  getTeamPlayerLabels,
  sanitizeCountdownTarget,
  TEAM_IDS,
  type CaptainInfo,
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

function SectionSaveButton({
  label,
  disabled,
  isSaving,
  onClick,
}: {
  label: string;
  disabled: boolean;
  isSaving: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isSaving}
        className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_30px_-18px_rgba(52,211,153,0.9)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : label}
      </button>
    </div>
  );
}

function getInitials(name: string, fallback: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || fallback;
}

const MAX_CAPTAIN_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function getCaptainUploadMap(defaultValue = ""): Record<TeamId, string> {
  return { A: defaultValue, B: defaultValue, C: defaultValue, D: defaultValue };
}

function getCaptainUploadingMap(defaultValue = false): Record<TeamId, boolean> {
  return { A: defaultValue, B: defaultValue, C: defaultValue, D: defaultValue };
}

function CaptainPhotoUploader({
  team,
  captain,
  captainNumber,
  disabled,
  isUploading,
  message,
  onUpload,
  onRemove,
}: {
  team: TeamId;
  captain: CaptainInfo;
  captainNumber: number;
  disabled: boolean;
  isUploading: boolean;
  message: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const displayName = captain.name.trim() || `Captain ${captainNumber}`;
  const imageUrl = captain.imageUrl.trim();
  const inputId = `captain-photo-${team}`;

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      void onUpload(file);
    }
    event.currentTarget.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file && !disabled && !isUploading) {
      void onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={handleFileSelect}
      />

      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={
          "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-4 text-center transition " +
          (disabled || isUploading
            ? "border-white/10 bg-black/15 opacity-70"
            : isDragging
              ? "border-emerald-300/80 bg-emerald-300/10"
              : "border-white/15 bg-black/18 hover:border-emerald-300/45 hover:bg-emerald-300/5")
        }
      >
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-inner">
          {imageUrl ? (
            <div
              aria-label={`${displayName} captain preview`}
              className="h-full w-full bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-white/[0.04] text-center">
              <span className="text-2xl font-semibold text-white/85">{getInitials(displayName, team)}</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Photo</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold text-white">
            {isUploading ? "Uploading..." : imageUrl ? "Replace photo" : "Drop photo here"}
          </div>
          <div className="text-xs leading-5 text-white/55">or click to choose an image</div>
        </div>
      </label>

      {message ? <p className="text-xs leading-5 text-white/60">{message}</p> : null}

      {imageUrl ? (
        <button
          type="button"
          onClick={() => void onRemove()}
          disabled={disabled || isUploading}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove Photo
        </button>
      ) : null}
    </div>
  );
}

function ScoreValue({ value }: { value: number | null }) {
  return <span>{value ?? "—"}</span>;
}

function getHolePoint(score: number | null | undefined, opponentScore: number | null | undefined) {
  if (typeof score !== "number" || typeof opponentScore !== "number") {
    return null;
  }

  if (score === opponentScore) {
    return 0.5;
  }

  return score < opponentScore ? 1 : 0;
}

function calculateHolePoints(scores: (number | null)[], opponentScores: (number | null)[]) {
  return scores.map((score, index) => getHolePoint(score, opponentScores[index]));
}

function calculatePointTotals(points: (number | null)[]) {
  const totalRange = (start: number, end: number) => {
    const values = points.slice(start, end).filter((point): point is number => typeof point === "number");
    return values.length ? values.reduce((sum, point) => sum + point, 0) : null;
  };

  const out = totalRange(0, 9);
  const inward = totalRange(9, 18);
  const total = typeof out === "number" || typeof inward === "number" ? (out ?? 0) + (inward ?? 0) : null;

  return { out, in: inward, total };
}

function formatPoint(point: number | null) {
  return typeof point === "number" ? String(point) : "—";
}

function PointValue({ value }: { value: number | null }) {
  return <span>{formatPoint(value)}</span>;
}

function PointCell({ value }: { value: number | null }) {
  return (
    <div className="flex h-7 min-w-0 items-center justify-center px-0.5 text-center text-[11px] font-semibold text-emerald-100 sm:px-1 sm:text-xs">
      <PointValue value={value} />
    </div>
  );
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
    <div className="flex min-w-0 flex-col items-center gap-1 px-0.5 py-1.5 text-center sm:px-1 sm:py-2">
      <div className="text-[10px] font-semibold text-white/55 sm:text-[11px]">{hole}</div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="h-8 w-full min-w-0 rounded-md border border-white/10 bg-black/25 px-0.5 text-center text-xs font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-emerald-300/40 sm:h-9 sm:rounded-lg sm:text-sm"
        placeholder="—"
      />
    </div>
  );
}

function ScoreboardRow({
  title,
  subtitle,
  scores,
  opponentScores,
  onHoleChange,
}: {
  title: string;
  subtitle: string;
  scores: (number | null)[];
  opponentScores: (number | null)[];
  onHoleChange: (holeIndex: number, value: string) => void;
}) {
  const totals = calculateScoreTotals(scores);
  const points = calculateHolePoints(scores, opponentScores);
  const pointTotals = calculatePointTotals(points);

  return (
    <div className="grid w-full grid-cols-[86px_minmax(0,1fr)_44px] border-t border-white/10 first:border-t-0 sm:grid-cols-[96px_minmax(0,1fr)_48px] md:grid-cols-[104px_minmax(0,1fr)_52px]">
      <div className="flex min-w-0 flex-col justify-center border-r border-white/10 bg-black/22 px-2 py-3 sm:px-3 sm:py-4">
        <div className="truncate text-[13px] font-semibold text-white sm:text-[14px]">{title}</div>
        <div className="mt-1 truncate text-[11px] text-white/72 sm:text-[12px]">{subtitle}</div>
      </div>

      <div className="grid min-w-0 grid-rows-[auto_28px_auto_28px]">
        <div className="grid grid-cols-10 border-b border-white/10 bg-white/[0.03]">
          {FRONT_NINE.map((hole) => (
            <HoleInput
              key={`${title}-front-${hole}`}
              hole={hole}
              value={scores[hole - 1] ?? null}
              onChange={(value) => onHoleChange(hole - 1, value)}
            />
          ))}
          <div className="flex flex-col items-center justify-center border-l border-white/10 px-1 py-1.5 text-center sm:px-1.5 sm:py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">O</div>
            <div className="mt-2 text-base font-semibold text-white/90 sm:text-lg">
              <ScoreValue value={totals.out} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-10 border-b border-white/10 bg-emerald-300/[0.05]">
          {FRONT_NINE.map((hole) => (
            <PointCell key={`${title}-front-point-${hole}`} value={points[hole - 1]} />
          ))}
          <div className="flex h-7 items-center justify-center border-l border-white/10 text-[11px] font-semibold text-emerald-100 sm:text-xs">
            <PointValue value={pointTotals.out} />
          </div>
        </div>

        <div className="grid grid-cols-10 border-b border-white/10 bg-white/[0.02]">
          {BACK_NINE.map((hole) => (
            <HoleInput
              key={`${title}-back-${hole}`}
              hole={hole}
              value={scores[hole - 1] ?? null}
              onChange={(value) => onHoleChange(hole - 1, value)}
            />
          ))}
          <div className="flex flex-col items-center justify-center border-l border-white/10 px-1 py-1.5 text-center sm:px-1.5 sm:py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">I</div>
            <div className="mt-2 text-base font-semibold text-white/90 sm:text-lg">
              <ScoreValue value={totals.in} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-10 bg-emerald-300/[0.035]">
          {BACK_NINE.map((hole) => (
            <PointCell key={`${title}-back-point-${hole}`} value={points[hole - 1]} />
          ))}
          <div className="flex h-7 items-center justify-center border-l border-white/10 text-[11px] font-semibold text-emerald-100 sm:text-xs">
            <PointValue value={pointTotals.in} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center border-l border-white/10 bg-black/22 px-1 py-3 text-center sm:px-2 sm:py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">TOT</div>
        <div className="mt-2 text-lg font-semibold text-white sm:text-xl">
          <ScoreValue value={totals.total} />
        </div>
        <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/70">
          PTS
        </div>
        <div className="mt-1 text-sm font-semibold text-emerald-100 sm:text-base">
          <PointValue value={pointTotals.total} />
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
  const [saveMessage, setSaveMessage] = useState("Ready to edit");
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("Email/password sign-in ready");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [captainUploadMessages, setCaptainUploadMessages] = useState<Record<TeamId, string>>(() =>
    getCaptainUploadMap(),
  );
  const [uploadingCaptains, setUploadingCaptains] = useState<Record<TeamId, boolean>>(() =>
    getCaptainUploadingMap(),
  );

  useEffect(() => {
    if (!isDirty) {
      setDraftState(liveState);
    }
  }, [isDirty, liveState]);

  useEffect(() => {
    if (liveError) {
      setSaveMessage(liveError);
    }
  }, [liveError]);

  const activeSchedule = useMemo(() => getRoundSchedule(activeRound), [activeRound]);

  const updateCountdownTarget = (value: string) => {
    setDraftState((current) => ({
      ...current,
      countdownTarget: value,
    }));
    setIsDirty(true);
    setSaveMessage("Unsaved changes. Click any Save All Changes button.");
  };

  const updateCaptainInfoValues = (team: TeamId, values: Partial<CaptainInfo>) => {
    setDraftState((current) => ({
      ...current,
      captains: {
        ...current.captains,
        [team]: {
          ...current.captains[team],
          ...values,
        },
      },
    }));
    setIsDirty(true);
    setSaveMessage("Unsaved changes. Click any Save All Changes button.");
  };

  const updateCaptainInfo = (team: TeamId, field: keyof CaptainInfo, value: string) => {
    updateCaptainInfoValues(team, { [field]: value });
  };

  const setCaptainUploadMessage = (team: TeamId, message: string) => {
    setCaptainUploadMessages((current) => ({ ...current, [team]: message }));
  };

  const setCaptainUploading = (team: TeamId, isUploading: boolean) => {
    setUploadingCaptains((current) => ({ ...current, [team]: isUploading }));
  };

  const handleCaptainImageUpload = async (team: TeamId, file: File) => {
    if (!user) {
      setCaptainUploadMessage(team, "Sign in first to upload captain photos.");
      return;
    }

    if (!configured || !auth?.currentUser) {
      setCaptainUploadMessage(team, "Firebase Auth is not ready yet.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setCaptainUploadMessage(team, "Choose an image file, such as JPG, PNG, or WebP.");
      return;
    }

    if (file.size > MAX_CAPTAIN_IMAGE_SIZE_BYTES) {
      setCaptainUploadMessage(team, "Image is too large. Use an image under 8 MB.");
      return;
    }

    try {
      setCaptainUploading(team, true);
      setCaptainUploadMessage(team, "Uploading to Supabase Storage...");

      const token = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("team", team);
      formData.append("file", file);

      const response = await fetch("/api/captain-image/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as
        | { imageUrl?: string; imagePath?: string; error?: string }
        | null;

      if (!response.ok || !result?.imageUrl || !result?.imagePath) {
        throw new Error(result?.error ?? "Photo upload failed.");
      }

      updateCaptainInfoValues(team, { imageUrl: result.imageUrl, imagePath: result.imagePath });
      setCaptainUploadMessage(team, "Photo uploaded. Click any Save All Changes button to update the live site.");
    } catch (error) {
      setCaptainUploadMessage(team, error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setCaptainUploading(team, false);
    }
  };

  const handleRemoveCaptainImage = async (team: TeamId) => {
    try {
      setCaptainUploading(team, true);
      setCaptainUploadMessage(team, "Removing photo from the draft card...");
      updateCaptainInfoValues(team, { imageUrl: "", imagePath: "" });
      setCaptainUploadMessage(team, "Photo removed. Click any Save All Changes button to update the live site.");
    } catch (error) {
      setCaptainUploadMessage(team, error instanceof Error ? error.message : "Photo removal failed.");
    } finally {
      setCaptainUploading(team, false);
    }
  };

  const updateTeamName = (team: TeamId, value: string) => {
    setDraftState((current) => ({
      ...current,
      teamNames: {
        ...current.teamNames,
        [team]: value,
      },
    }));
    setIsDirty(true);
    setSaveMessage("Unsaved changes. Click any Save All Changes button.");
  };

  const updatePlayerName = (label: string, value: string) => {
    setDraftState((current) => ({
      ...current,
      playerNames: {
        ...current.playerNames,
        [label]: value,
      },
    }));
    setIsDirty(true);
    setSaveMessage("Unsaved changes. Click any Save All Changes button.");
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
    setSaveMessage("Unsaved changes. Click any Save All Changes button.");
  };

  const handleSaveChanges = async () => {
    if (!user) {
      setSaveMessage("Sign in before saving.");
      return;
    }

    if (!configured) {
      setSaveMessage("Firebase is not configured.");
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(`Saving all changes...`);
      await saveState({
        ...draftState,
        countdownTarget: sanitizeCountdownTarget(draftState.countdownTarget),
      });
      setIsDirty(false);
      setSaveMessage(`All changes saved to the live site`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      setSaveMessage("Resetting...");
      await resetState();
      setIsDirty(false);
      setSaveMessage("League reset to defaults");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Reset failed");
    } finally {
      setIsSaving(false);
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
              <SectionTitle title="Countdown Timer" />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
                <label className="block max-w-md">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                    Countdown Date and Time
                  </div>
                  <input
                    type="datetime-local"
                    value={draftState.countdownTarget}
                    onChange={(event) => updateCountdownTarget(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40"
                  />
                </label>
              </div>

              <SectionSaveButton
                label="Save All Changes"
                disabled={!isDirty || !configured || Boolean(liveError)}
                isSaving={isSaving}
                onClick={() => void handleSaveChanges()}
              />
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle title="Captains" />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {TEAM_IDS.map((team: TeamId, index) => {
                  const captainNumber = index + 1;
                  const captain = draftState.captains[team];

                  return (
                    <div
                      key={team}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur"
                    >
                      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.14),transparent_55%)]" />
                      </div>

                      <div className="relative space-y-4">
                        <div className="text-sm font-semibold text-white">Captain {captainNumber}</div>

                        <CaptainPhotoUploader
                          team={team}
                          captain={captain}
                          captainNumber={captainNumber}
                          disabled={!user}
                          isUploading={uploadingCaptains[team]}
                          message={captainUploadMessages[team]}
                          onUpload={(file) => handleCaptainImageUpload(team, file)}
                          onRemove={() => handleRemoveCaptainImage(team)}
                        />

                        <label className="block">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                            Captain Name
                          </div>
                          <input
                            value={captain.name}
                            onChange={(event) => updateCaptainInfo(team, "name", event.target.value)}
                            placeholder={`Enter Captain ${captainNumber}`}
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <SectionSaveButton
                label="Save All Changes"
                disabled={!isDirty || !configured || Boolean(liveError)}
                isSaving={isSaving}
                onClick={() => void handleSaveChanges()}
              />
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SectionTitle title="Team Names" />
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  disabled={isSaving}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset All
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {TEAM_IDS.map((team: TeamId) => {
                  const labels = getTeamPlayerLabels(team);
                  const teamName = draftState.teamNames[team] ?? `Team ${team}`;
                  const displayTeamName = getTeamName(draftState.teamNames, team);
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
                        <div className="text-sm font-semibold text-white">{displayTeamName}</div>
                      </div>

                      <div className="relative space-y-3">
                        <label className="block">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                            Team Name
                          </div>
                          <input
                            value={teamName}
                            onChange={(event) => updateTeamName(team, event.target.value)}
                            placeholder={`Enter Team ${team} name`}
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-300/40"
                          />
                        </label>

                        <div className="h-px bg-white/10" />

                        {labels.map((label) => (
                          <label key={label} className="block">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                              {label}
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

              <SectionSaveButton
                label="Save All Changes"
                disabled={!isDirty || !configured || Boolean(liveError)}
                isSaving={isSaving}
                onClick={() => void handleSaveChanges()}
              />
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

              <div className="grid gap-6 lg:grid-cols-2">
                {activeSchedule.matches.map((match) => (
                  <section
                    key={`${activeSchedule.roundLabel}-${match.id}`}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07102a]/90 shadow-[0_18px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur lg:self-start"
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

                    <div>
                      <ScoreboardRow
                        title={getPlayerName(draftState.playerNames, match.left[0])}
                        subtitle={getPlayerName(draftState.playerNames, match.left[1])}
                        scores={draftState.matchScores[activeSchedule.roundLabel][match.id].left}
                        opponentScores={draftState.matchScores[activeSchedule.roundLabel][match.id].right}
                        onHoleChange={(holeIndex, value) =>
                          updateHoleScore(activeSchedule.roundLabel, match.id, "left", holeIndex, value)
                        }
                      />
                      <ScoreboardRow
                        title={getPlayerName(draftState.playerNames, match.right[0])}
                        subtitle={getPlayerName(draftState.playerNames, match.right[1])}
                        scores={draftState.matchScores[activeSchedule.roundLabel][match.id].right}
                        opponentScores={draftState.matchScores[activeSchedule.roundLabel][match.id].left}
                        onHoleChange={(holeIndex, value) =>
                          updateHoleScore(activeSchedule.roundLabel, match.id, "right", holeIndex, value)
                        }
                      />
                    </div>
                  </section>
                ))}
              </div>

              <SectionSaveButton
                label="Save All Changes"
                disabled={!isDirty || !configured || Boolean(liveError)}
                isSaving={isSaving}
                onClick={() => void handleSaveChanges()}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
