"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export type TeamId = "A" | "B" | "C" | "D";
export type RoundLabel = "Round 1" | "Round 2" | "Round 3";
export type Pair = [string, string];
export type HoleScore = number | null;
export type HoleScores = HoleScore[];

export type MatchHoleScore = {
  left: HoleScores;
  right: HoleScores;
};

export type MatchScores = Record<RoundLabel, Record<number, MatchHoleScore>>;

export type LeagueState = {
  playerNames: Record<string, string>;
  matchScores: MatchScores;
};

export type RoundSchedule = {
  roundLabel: RoundLabel;
  teamPairs: Record<TeamId, Pair[]>;
  matches: { id: number; left: Pair; right: Pair }[];
};

export type ScoreTotals = {
  out: number | null;
  in: number | null;
  total: number | null;
};

export const ROUND_LABELS: RoundLabel[] = ["Round 1", "Round 2", "Round 3"];
export const TEAM_IDS: TeamId[] = ["A", "B", "C", "D"];
export const TEAM_SLOT_LABELS = ["C", "1", "2", "3"] as const;
export const MATCH_IDS = [1, 2, 3, 4] as const;
export const FRONT_NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const BACK_NINE = [10, 11, 12, 13, 14, 15, 16, 17, 18] as const;

export const ROUND_SCHEDULES: RoundSchedule[] = [
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
];

export const DEFAULT_PLAYER_NAMES: Record<string, string> = {
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

function createEmptyHoleScores(): HoleScores {
  return Array.from({ length: 18 }, () => null);
}

function createDefaultMatchHoleScore(): MatchHoleScore {
  return {
    left: createEmptyHoleScores(),
    right: createEmptyHoleScores(),
  };
}

export const DEFAULT_MATCH_SCORES: MatchScores = {
  "Round 1": {
    1: createDefaultMatchHoleScore(),
    2: createDefaultMatchHoleScore(),
    3: createDefaultMatchHoleScore(),
    4: createDefaultMatchHoleScore(),
  },
  "Round 2": {
    1: createDefaultMatchHoleScore(),
    2: createDefaultMatchHoleScore(),
    3: createDefaultMatchHoleScore(),
    4: createDefaultMatchHoleScore(),
  },
  "Round 3": {
    1: createDefaultMatchHoleScore(),
    2: createDefaultMatchHoleScore(),
    3: createDefaultMatchHoleScore(),
    4: createDefaultMatchHoleScore(),
  },
};

function leagueDocRef() {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return doc(db, "leagues", "cbi-2026");
}

function cloneMatchScores(source: MatchScores): MatchScores {
  return JSON.parse(JSON.stringify(source)) as MatchScores;
}

export function getDefaultLeagueState(): LeagueState {
  return {
    playerNames: { ...DEFAULT_PLAYER_NAMES },
    matchScores: cloneMatchScores(DEFAULT_MATCH_SCORES),
  };
}

function sanitizeHoleScores(raw: unknown): HoleScores {
  const empty = createEmptyHoleScores();

  if (!Array.isArray(raw)) {
    return empty;
  }

  return empty.map((_, index) => {
    const value = raw[index];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
}

function sanitizeLeagueState(raw: unknown): LeagueState {
  const defaults = getDefaultLeagueState();

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const maybe = raw as Partial<LeagueState>;
  const playerNames: Record<string, string> = { ...defaults.playerNames };

  if (maybe.playerNames && typeof maybe.playerNames === "object") {
    for (const [key, value] of Object.entries(maybe.playerNames)) {
      playerNames[key] = typeof value === "string" ? value : defaults.playerNames[key] ?? "";
    }
  }

  const matchScores = cloneMatchScores(defaults.matchScores);

  for (const round of ROUND_LABELS) {
    const sourceRound = maybe.matchScores?.[round];

    for (const matchId of MATCH_IDS) {
      const score = sourceRound?.[matchId] as Partial<MatchHoleScore> | undefined;
      matchScores[round][matchId] = {
        left: sanitizeHoleScores(score?.left),
        right: sanitizeHoleScores(score?.right),
      };
    }
  }

  return {
    playerNames,
    matchScores,
  };
}

export function getPlayerName(playerNames: Record<string, string>, label: string) {
  return playerNames[label]?.trim() || `Player ${label}`;
}

export function getTeamPlayerLabels(team: TeamId) {
  return [`${team}1`, `${team}2`, `${team}3`, `${team}4`] as const;
}

export function getRoundSchedule(roundLabel: RoundLabel) {
  return ROUND_SCHEDULES.find((round) => round.roundLabel === roundLabel) ?? ROUND_SCHEDULES[0];
}

export function getPairLabel(pair: Pair) {
  return `${pair[0]}–${pair[1]}`;
}

export function calculateScoreTotals(scores: HoleScores): ScoreTotals {
  const sumRange = (start: number, end: number) => {
    const slice = scores.slice(start, end);
    const numericValues = slice.filter((value): value is number => typeof value === "number");
    if (!numericValues.length) {
      return null;
    }
    return numericValues.reduce((total, value) => total + value, 0);
  };

  const out = sumRange(0, 9);
  const inn = sumRange(9, 18);
  const total = [out, inn].every((value) => value === null)
    ? null
    : (out ?? 0) + (inn ?? 0);

  return {
    out,
    in: inn,
    total,
  };
}

export function subscribeToLeagueState(
  onState: (state: LeagueState) => void,
  onError?: (error: Error | null) => void,
) {
  if (!isFirebaseConfigured() || !db) {
    onState(getDefaultLeagueState());
    onError?.(null);
    return () => undefined;
  }

  return onSnapshot(
    leagueDocRef(),
    (snapshot) => {
      if (!snapshot.exists()) {
        onState(getDefaultLeagueState());
        onError?.(null);
        return;
      }

      onState(sanitizeLeagueState(snapshot.data()));
      onError?.(null);
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error("Unable to read league data."));
    },
  );
}

export async function saveLeagueState(nextState: LeagueState) {
  if (!isFirebaseConfigured() || !db) {
    throw new Error("Firebase is not configured. Add your NEXT_PUBLIC_FIREBASE_* values first.");
  }

  await setDoc(leagueDocRef(), sanitizeLeagueState(nextState));
}

export async function resetLeagueState() {
  await saveLeagueState(getDefaultLeagueState());
}

export function useLeagueState() {
  const [state, setState] = useState<LeagueState>(() => getDefaultLeagueState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const configured = isFirebaseConfigured();

  useEffect(() => {
    const unsubscribe = subscribeToLeagueState(
      (nextState) => {
        setState(nextState);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError?.message ?? "");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const saveState = useCallback(async (nextState: LeagueState) => {
    await saveLeagueState(nextState);
  }, []);

  const resetState = useCallback(async () => {
    await resetLeagueState();
  }, []);

  return useMemo(
    () => ({
      state,
      loading,
      configured,
      error,
      saveState,
      resetState,
    }),
    [configured, error, loading, resetState, saveState, state],
  );
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) {
      return;
    }

    await signOut(auth);
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut: signOutUser,
    }),
    [loading, signIn, signOutUser, user],
  );
}
