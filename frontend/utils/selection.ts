// Fisher–Yates shuffle + balanced pick per subarea
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export type Question = {
  id: string;
  type: "mcq" | "flashcard";
  mode: "Drill" | "Learn";
  subareaId: "SA-1" | "SA-2" | "SA-3" | "SA-4";
  difficulty?: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  answer: string;
  rationales?: string[];
  correctIndex?: number;
};

export const balancedPickBySubarea = (items: Question[], counts: Record<string, number>) => {
  const result: Question[] = [];
  Object.entries(counts).forEach(([sa, n]) => {
    // Filter by subareaId only - type check removed as MCQ data doesn't have type field
    const pool = items.filter(q => q.subareaId === sa);
    const picked = shuffle(pool).slice(0, Math.min(n, pool.length));
    result.push(...picked);
  });
  return shuffle(result);
};

type QStat = { id: string; seen: number; lastSeen: number; attempts: number; correct: number };

export function prioritizedPool<T extends Question>(
  items: T[],
  stats: Record<string, QStat>,
  opts?: {
    subareaId?: T["subareaId"];
    limit?: number;
    preferUnseen?: boolean;     // default true
    freshnessMs?: number;       // don't re-serve items seen within this window
  }
): T[] {
  const { subareaId, limit, preferUnseen = true, freshnessMs = 1000 * 60 * 60 * 8 } = opts || {};
  const now = Date.now();

  let pool = subareaId ? items.filter(i => i.subareaId === subareaId) : items.slice();

  // Annotate with stat fields
  const annotated = pool.map(i => {
    const s = stats[i.id] ?? { id: i.id, seen: 0, attempts: 0, correct: 0, lastSeen: 0 };
    const recentlySeen = s.lastSeen && now - s.lastSeen < freshnessMs;
    return { item: i, s, recentlySeen };
  });

  // Stage 1: Unseen items first (or not recent)
  let stageA = annotated.filter(a => a.s.seen === 0);
  if (preferUnseen && stageA.length) {
    return shuffle(stageA.map(a => a.item)).slice(0, limit ?? stageA.length);
  }

  // Stage 2: Not recently seen
  let stageB = annotated.filter(a => !a.recentlySeen);
  if (stageB.length) {
    // Sort by lowest seen count, then oldest lastSeen
    stageB.sort((a, b) =>
      (a.s.seen - b.s.seen) || (a.s.lastSeen - b.s.lastSeen)
    );
    const chosen = stageB.map(a => a.item);
    return (limit ? chosen.slice(0, limit) : chosen);
  }

  // Stage 3: Everything exhausted: least seen / oldest first
  annotated.sort((a, b) =>
    (a.s.seen - b.s.seen) || (a.s.lastSeen - b.s.lastSeen)
  );
  const fallback = annotated.map(a => a.item);
  const cut = limit ? fallback.slice(0, limit) : fallback;
  return shuffle(cut);
}
