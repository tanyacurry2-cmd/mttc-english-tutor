// Centralized data loader with Supabase integration and local fallback
// Uses require() for local JSON files (React Native production builds)
// Fetches from Supabase when online, falls back to local data offline

import { supabase, MCQRow, FlashcardRow } from './supabase';

export interface Question {
  id: string;
  subarea: string;
  subareaId: string;
  objective: string;
  mode: string;
  type: string;
  difficulty: number;
  stem?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  rationales?: string[];
  explanation?: string;
  tags?: string[];
}

export interface Flashcard {
  id: string;
  subarea: string;
  subareaId?: string;
  objective: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
}

export interface MCQ {
  id: string;
  subarea: string;
  subareaId?: string;
  objective: string;
  stem: string;
  options: string[];
  correctIndex: number;
  rationales: string[];
  difficulty?: number;
  assessment?: boolean;
}

// Use require() to load local JSON files - works in React Native production
const localFlashcards: Flashcard[] = require('../data/flashcards.json');
const localMCQs: MCQ[] = require('../data/mcq.json');

// Cache for Supabase data
let cachedMCQs: MCQ[] | null = null;
let cachedFlashcards: Flashcard[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Map subarea names to IDs
const subareaToId: { [key: string]: string } = {
  'Meaning & Communication': 'SA-1',
  'Literature & Understanding': 'SA-2',
  'Genre & Craft': 'SA-3',
  'Skills & Processes': 'SA-4',
};

// Transform Supabase row to app format
function transformMCQRow(row: MCQRow): MCQ {
  return {
    id: row.id,
    subarea: row.subarea,
    subareaId: subareaToId[row.subarea] || '',
    objective: row.objective,
    stem: row.stem,
    options: row.options,
    correctIndex: row.correct_index,
    rationales: row.rationales,
    difficulty: row.difficulty,
    assessment: row.assessment,
  };
}

function transformFlashcardRow(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    subarea: row.subarea,
    subareaId: subareaToId[row.subarea] || '',
    objective: row.objective,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: row.tags,
  };
}

// Add subareaId to local data
function enrichLocalMCQs(): MCQ[] {
  return localMCQs.map(mcq => ({
    ...mcq,
    subareaId: subareaToId[mcq.subarea] || '',
  }));
}

function enrichLocalFlashcards(): Flashcard[] {
  return localFlashcards.map(card => ({
    ...card,
    subareaId: subareaToId[card.subarea] || '',
  }));
}

// Async fetch from Supabase with local fallback
async function fetchMCQsFromSupabase(): Promise<MCQ[]> {
  const now = Date.now();
  
  // Return cache if valid
  if (cachedMCQs && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedMCQs;
  }
  
  try {
    const { data, error } = await supabase
      .from('mcqs')
      .select('*')
      .order('id');
    
    if (error) {
      console.log('Supabase MCQ fetch error, using local data:', error.message);
      return enrichLocalMCQs();
    }
    
    if (data && data.length > 0) {
      cachedMCQs = data.map(transformMCQRow);
      lastFetchTime = now;
      console.log(`Loaded ${cachedMCQs.length} MCQs from Supabase`);
      return cachedMCQs;
    } else {
      // No data in Supabase yet, use local
      console.log('No MCQs in Supabase, using local data');
      return enrichLocalMCQs();
    }
  } catch (err) {
    console.log('Network error, using local MCQ data');
    return enrichLocalMCQs();
  }
}

async function fetchFlashcardsFromSupabase(): Promise<Flashcard[]> {
  const now = Date.now();
  
  // Return cache if valid
  if (cachedFlashcards && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedFlashcards;
  }
  
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .order('id');
    
    if (error) {
      console.log('Supabase flashcard fetch error, using local data:', error.message);
      return enrichLocalFlashcards();
    }
    
    if (data && data.length > 0) {
      cachedFlashcards = data.map(transformFlashcardRow);
      lastFetchTime = now;
      console.log(`Loaded ${cachedFlashcards.length} flashcards from Supabase`);
      return cachedFlashcards;
    } else {
      // No data in Supabase yet, use local
      console.log('No flashcards in Supabase, using local data');
      return enrichLocalFlashcards();
    }
  } catch (err) {
    console.log('Network error, using local flashcard data');
    return enrichLocalFlashcards();
  }
}

// Clear cache to force refresh
export function clearDataCache() {
  cachedMCQs = null;
  cachedFlashcards = null;
  lastFetchTime = 0;
}

// SYNC DataLoader object for backward compatibility
// These return local data immediately (for screens that don't use async)
export const DataLoader = {
  getAllQuestions: () => enrichLocalMCQs(), // For backward compatibility
  getAllFlashcards: () => enrichLocalFlashcards(),
  getAllMCQs: () => enrichLocalMCQs(),
  
  getQuestionById: (id: string) => enrichLocalMCQs().find(q => q.id === id),
  getFlashcardById: (id: string) => enrichLocalFlashcards().find(f => f.id === id),
  getMCQById: (id: string) => enrichLocalMCQs().find(m => m.id === id),
  
  getQuestionsBySubarea: (subareaId: string) => 
    enrichLocalMCQs().filter(q => q.subareaId === subareaId),
  getFlashcardsBySubarea: (subareaId: string) => 
    enrichLocalFlashcards().filter(f => f.subareaId === subareaId),
  getMCQsBySubarea: (subareaId: string) => 
    enrichLocalMCQs().filter(m => m.subareaId === subareaId),
};

// ASYNC methods that fetch from Supabase (use these for new features)
export const AsyncDataLoader = {
  getAllMCQs: fetchMCQsFromSupabase,
  getAllFlashcards: fetchFlashcardsFromSupabase,
  
  getMCQsBySubarea: async (subareaId: string) => {
    const allMCQs = await fetchMCQsFromSupabase();
    return allMCQs.filter(m => m.subareaId === subareaId);
  },
  
  getFlashcardsBySubarea: async (subareaId: string) => {
    const allFlashcards = await fetchFlashcardsFromSupabase();
    return allFlashcards.filter(f => f.subareaId === subareaId);
  },
  
  getAssessmentMCQs: async () => {
    const allMCQs = await fetchMCQsFromSupabase();
    return allMCQs.filter(m => m.assessment === true);
  },
  
  refreshData: async () => {
    clearDataCache();
    await fetchMCQsFromSupabase();
    await fetchFlashcardsFromSupabase();
  }
};
