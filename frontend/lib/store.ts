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
  setUser: (user: Partial<AppState['user']>) => void;
  initializeTrial: (uid: string, email: string) => void;
  setPurchase: (purchaseType: 'monthly' | 'lifetime') => void;
  updateCardReview: (cardId: string, srsData: SRSCard) => void;
  updateMCQHistory: (mcqId: string, correct: boolean) => void;
  updateReadiness: (subarea: Subarea, score: number) => void;
  updateStreak: () => void;
  setLastStudied: (questionId: string, mode: 'learn' | 'drill', subarea: Subarea) => void;
  clearLastStudied: () => void;
  checkTrialStatus: () => boolean;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  logout: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    email: 'testuser@mttc.app',
    uid: 'test-user-12345',
    trialStart: new Date(),
    trialEnd: new Date('2099-12-31'), // Far future date
    isPaid: true, // Always paid for TestFlight
    purchaseType: 'lifetime',
  },
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

  setUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData }
    }));
    get().saveToStorage();
  },

  initializeTrial: (uid: string, email: string) => {
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3);
    
    set((state) => ({
      user: {
        ...state.user,
        uid,
        email,
        trialStart,
        trialEnd,
      }
    }));
    get().saveToStorage();
  },

  setPurchase: (purchaseType) => {
    set((state) => ({
      user: {
        ...state.user,
        isPaid: true,
        purchaseType,
      }
    }));
    get().saveToStorage();
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

  checkTrialStatus: () => {
    // Always return true for TestFlight builds - user is always premium
    return true;
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('appState');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.user.trialStart) parsed.user.trialStart = new Date(parsed.user.trialStart);
        if (parsed.user.trialEnd) parsed.user.trialEnd = new Date(parsed.user.trialEnd);
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

  logout: () => {
    set({
      user: {
        email: null,
        uid: null,
        trialStart: null,
        trialEnd: null,
        isPaid: false,
        purchaseType: null,
      },
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
    });
    AsyncStorage.removeItem('appState');
  },
}));