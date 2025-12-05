import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subarea } from '../types/content';
import { SRSCard, DEFAULT_SRS_CARD } from './srs';

interface MCQHistory {
  attempts: number;
  correct: number;
  lastAttempt: Date;
}

interface AppState {
  // Premium State (no auth needed)
  isPaid: boolean;
  purchaseType: 'lifetime' | null;
  
  // Free tier tracking
  assessmentsCompleted: number;
  
  // Progress tracking
  cardReviews: Record<string, SRSCard>;
  mcqHistory: Record<string, MCQHistory>;
  streakDays: number;
  lastStudyDate: string | null;
  readinessBySubarea: Record<Subarea, number>;
  
  // Resume progress tracking
  lastQuestionID: string | null;
  lastMode: 'learn' | 'drill' | null;
  lastSubarea: Subarea | null;
  
  // Actions
  setPurchase: (purchaseType: 'lifetime') => void;
  incrementAssessments: () => void;
  canAccessPremium: () => boolean;
  canAccessFlashcard: (index: number) => boolean;
  canAccessDrillQuestion: (index: number) => boolean;
  canTakeAssessment: () => boolean;
  updateCardReview: (cardId: string, srsData: SRSCard) => void;
  updateMCQHistory: (mcqId: string, correct: boolean) => void;
  updateReadiness: (subarea: Subarea, score: number) => void;
  updateStreak: () => void;
  setLastStudied: (questionId: string, mode: 'learn' | 'drill', subarea: Subarea) => void;
  clearLastStudied: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  resetToFree: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Start as free user
  isPaid: false,
  purchaseType: null,
  assessmentsCompleted: 0,
  
  cardReviews: {},
  mcqHistory: {},
  streakDays: 0,
  lastStudyDate: null,
  readinessBySubarea: {
    'Meaning & Communication': 0,
    'Literature & Understanding': 0,
    'Genre & Craft': 0,
    'Skills & Processes': 0,
  },
  
  // Resume progress
  lastQuestionID: null,
  lastMode: null,
  lastSubarea: null,

  setPurchase: (purchaseType) => {
    set({
      isPaid: true,
      purchaseType,
    });
    get().saveToStorage();
  },

  incrementAssessments: () => {
    set((state) => ({
      assessmentsCompleted: state.assessmentsCompleted + 1,
    }));
    get().saveToStorage();
  },

  canAccessPremium: () => {
    return get().isPaid;
  },

  canAccessFlashcard: (index: number) => {
    const { isPaid } = get();
    // Free users: first 5 flashcards (index 0-4)
    // Premium: all flashcards
    return isPaid || index < 5;
  },

  canAccessDrillQuestion: (index: number) => {
    const { isPaid } = get();
    // Free users: first 5 questions (index 0-4)
    // Premium: all questions
    return isPaid || index < 5;
  },

  canTakeAssessment: () => {
    const { isPaid, assessmentsCompleted } = get();
    // Free users: 1 assessment
    // Premium: unlimited
    return isPaid || assessmentsCompleted < 1;
  },

  updateCardReview: (cardId, srsData) => {
    set((state) => ({
      cardReviews: {
        ...state.cardReviews,
        [cardId]: srsData,
      }
    }));
    get().updateStreak();
    get().saveToStorage();
  },

  updateMCQHistory: (mcqId, correct) => {
    set((state) => {
      const existing = state.mcqHistory[mcqId] || { attempts: 0, correct: 0, lastAttempt: new Date() };
      return {
        mcqHistory: {
          ...state.mcqHistory,
          [mcqId]: {
            attempts: existing.attempts + 1,
            correct: existing.correct + (correct ? 1 : 0),
            lastAttempt: new Date(),
          }
        }
      };
    });
    get().updateStreak();
    get().saveToStorage();
  },

  updateReadiness: (subarea, score) => {
    set((state) => ({
      readinessBySubarea: {
        ...state.readinessBySubarea,
        [subarea]: score,
      }
    }));
    get().saveToStorage();
  },

  updateStreak: () => {
    const today = new Date().toDateString();
    const state = get();
    
    if (state.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (state.lastStudyDate === yesterday.toDateString()) {
        // Continue streak
        set({ streakDays: state.streakDays + 1, lastStudyDate: today });
      } else {
        // Reset streak
        set({ streakDays: 1, lastStudyDate: today });
      }
      get().saveToStorage();
    }
  },

  setLastStudied: (questionId, mode, subarea) => {
    set({
      lastQuestionID: questionId,
      lastMode: mode,
      lastSubarea: subarea,
    });
    get().saveToStorage();
  },

  clearLastStudied: () => {
    set({
      lastQuestionID: null,
      lastMode: null,
      lastSubarea: null,
    });
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('appState');
      if (stored) {
        const parsed = JSON.parse(stored);
        set(parsed);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem('appState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  resetToFree: () => {
    set({
      isPaid: false,
      purchaseType: null,
      assessmentsCompleted: 0,
      cardReviews: {},
      mcqHistory: {},
      streakDays: 0,
      lastStudyDate: null,
      readinessBySubarea: {
        'Meaning & Communication': 0,
        'Literature & Understanding': 0,
        'Genre & Craft': 0,
        'Skills & Processes': 0,
      },
      lastQuestionID: null,
      lastMode: null,
      lastSubarea: null,
    });
    AsyncStorage.removeItem('appState');
  },
}));