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
};

export const balancedPickBySubarea = (items: Question[], counts: Record<string, number>) => {
  const result: Question[] = [];
  Object.entries(counts).forEach(([sa, n]) => {
    const pool = items.filter(q => q.subareaId === sa && q.type === "mcq");
    const picked = shuffle(pool).slice(0, Math.min(n, pool.length));
    result.push(...picked);
  });
  return shuffle(result);
};
