"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export type TeamId = "A" | "B" | "C" | "D";
export type RoundLabel = "Round 1" | "Round 2" | "Round 3";
export type Pair = [string, string];

export type MatchScore = {
  left: number | null;
  right: number | null;
};

export type MatchScores = Record<RoundLabel, Record<number, MatchScore>>;

export type LeagueState = {
  playerNames: Record<string, string>;
  matchScores: MatchScores;
};

export type RoundSchedule = {
  roundLabel: RoundLabel;
  teamPairs: Record<TeamId, Pair[]>;
  matches: { id: number; left: Pair; right: Pair }[];
};

export const ROUND_LABELS: RoundLabel[] = ["Round 1", "Round 2", "Round 3"];
export const TEAM_IDS: TeamId[] = ["A", "B", "C", "D"];
export const TEAM_SLOT_LABELS = ["C", "1", "2", "3"] as const;
export const MATCH_IDS = [1, 2, 3, 4] as const;

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

export const DEFAULT_MATCH_SCORES: MatchScores = {
  "Round 1": {
    1: { left: null, right: null },
    2: { left: null, right: null },
    3: { left: null, right: null },
    4: { left: null, right: null },
  },
  "Round 2": {
    1: { left: null, right: null },
    2: { left: null, right: null },
    3: { left: null, right: null },
    4: { left: null, right: null },
  },
  "Round 3": {
    1: { left: null, right: null },
    2: { left: null, right: null },
    3: { left: null, right: null },
    4: { left: null, right: null },
  },
};

function leagueDocRef() {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return doc(db, "leagues", "cbi-2026");
}

export function getDefaultLeagueState(): LeagueState {
  return {
    playerNames: { ...DEFAULT_PLAYER_NAMES },
    matchScores: JSON.parse(JSON.stringify(DEFAULT_MATCH_SCORES)) as MatchScores,
  };
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

  const matchScores = { ...defaults.matchScores } as MatchScores;

  for (const round of ROUND_LABELS) {
    const sourceRound = maybe.matchScores?.[round];
    matchScores[round] = { ...defaults.matchScores[round] };

    for (const matchId of MATCH_IDS) {
      const score = sourceRound?.[matchId];
      matchScores[round][matchId] = {
        left: typeof score?.left === "number" ? score.left : null,
        right: typeof score?.right === "number" ? score.right : null,
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

export function subscribeToLeagueState(callback: (state: LeagueState) => void) {
  if (!isFirebaseConfigured() || !db) {
    callback(getDefaultLeagueState());
    return () => undefined;
  }

  return onSnapshot(
    leagueDocRef(),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(getDefaultLeagueState());
        return;
      }

      callback(sanitizeLeagueState(snapshot.data()));
    },
    () => {
      callback(getDefaultLeagueState());
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
  const configured = isFirebaseConfigured();

  useEffect(() => {
    const unsubscribe = subscribeToLeagueState((nextState) => {
      setState(nextState);
      setLoading(false);
    });

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
      saveState,
      resetState,
    }),
    [configured, loading, resetState, saveState, state],
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
