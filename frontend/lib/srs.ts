// Spaced Repetition System (SRS) implementation
// Based on SM-2 algorithm

export interface SRSCard {
  lastReviewed: Date;
  nextReview: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
}

export const DEFAULT_SRS_CARD: SRSCard = {
  lastReviewed: new Date(),
  nextReview: new Date(),
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
};

export enum ReviewQuality {
  WRONG = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3,
}

export function calculateNextReview(
  card: SRSCard,
  quality: ReviewQuality
): SRSCard {
  const now = new Date();
  let { interval, easeFactor, repetitions } = card;

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
  );

  // Calculate new interval
  if (quality < ReviewQuality.GOOD) {
    // Reset if answer was wrong or hard
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    lastReviewed: now,
    nextReview,
    interval,
    easeFactor,
    repetitions,
  };
}

export function isDueForReview(card: SRSCard): boolean {
  return new Date() >= new Date(card.nextReview);
}

export function sortCardsByPriority(cards: Array<{ id: string; srs: SRSCard }>): string[] {
  return cards
    .sort((a, b) => {
      const aDue = new Date(a.srs.nextReview).getTime();
      const bDue = new Date(b.srs.nextReview).getTime();
      return aDue - bDue;
    })
    .map(c => c.id);
}