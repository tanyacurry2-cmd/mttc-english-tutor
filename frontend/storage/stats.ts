import AsyncStorage from "@react-native-async-storage/async-storage";

export type QStat = {
  id: string;
  seen: number;        // times shown (flashcard) or served (mcq)
  attempts: number;    // mcq only: total attempts
  correct: number;     // mcq only: correct attempts
  lastSeen: number;    // Date.now()
};

const KEY = "question_stats_v1";

export async function loadStats(): Promise<Record<string, QStat>> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) as Record<string, QStat> : {};
}

export async function saveStats(stats: Record<string, QStat>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(stats));
}

export async function bumpSeen(id: string) {
  const stats = await loadStats();
  const s = stats[id] ?? { id, seen: 0, attempts: 0, correct: 0, lastSeen: 0 };
  s.seen += 1;
  s.lastSeen = Date.now();
  stats[id] = s;
  await saveStats(stats);
}

export async function bumpAttempt(id: string, isCorrect: boolean) {
  const stats = await loadStats();
  const s = stats[id] ?? { id, seen: 0, attempts: 0, correct: 0, lastSeen: 0 };
  s.attempts += 1;
  if (isCorrect) s.correct += 1;
  s.lastSeen = Date.now();
  // also count serving an mcq as "seen"
  s.seen = Math.max(s.seen, 1);
  stats[id] = s;
  await saveStats(stats);
}

export async function resetStats() {
  await AsyncStorage.removeItem(KEY);
}
