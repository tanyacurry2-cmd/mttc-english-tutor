import AsyncStorage from "@react-native-async-storage/async-storage";

export type SessionSummary = {
  id: string;                 // uuid-like string
  date: string;               // ISO
  score01: number;            // 0..1
  total: number;              // e.g., 20
  wrongIds: string[];         // for review
};

const KEY = "diagnostic_sessions";
const EMA_KEY = "readiness_ema"; // 0..1

export async function loadSessions(): Promise<SessionSummary[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSession(s: SessionSummary) {
  const list = await loadSessions();
  list.unshift(s);                          // newest first
  await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, 5))); // Keep only 5 most recent
}

export async function loadReadinessEma(): Promise<number> {
  const raw = await AsyncStorage.getItem(EMA_KEY);
  return raw ? Number(raw) : NaN;
}

export async function updateReadinessEma(latest01: number, alpha = 0.25): Promise<number> {
  const old = await loadReadinessEma();
  const ema = Number.isFinite(old) ? alpha * latest01 + (1 - alpha) * old : latest01;
  await AsyncStorage.setItem(EMA_KEY, String(ema));
  return ema; // 0..1
}
