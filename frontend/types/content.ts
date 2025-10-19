export type Subarea = 
  | 'Meaning & Communication'
  | 'Literature & Understanding'
  | 'Genre & Craft'
  | 'Skills & Processes';

export interface Card {
  id: string;
  subarea: Subarea;
  objective: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export interface MCQ {
  id: string;
  subarea: Subarea;
  objective: string;
  stem: string;
  options: string[];
  correctIndex: number;
  rationales: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  assessment?: boolean;
}

export interface UserProgress {
  userId: string;
  cardReviews: Record<string, {
    lastReviewed: Date;
    nextReview: Date;
    interval: number;
    easeFactor: number;
    repetitions: number;
  }>;
  mcqHistory: Record<string, {
    attempts: number;
    correct: number;
    lastAttempt: Date;
  }>;
  streakDays: number;
  lastStudyDate: string;
  readinessBySubarea: Record<Subarea, number>;
}

export interface UserState {
  email: string | null;
  uid: string | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  isPaid: boolean;
  purchaseType: 'monthly' | 'lifetime' | null;
  readinessPercent: number;
  weakSubareas: Subarea[];
}