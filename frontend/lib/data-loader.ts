import { supabase, MCQRow, FlashcardRow } from './supabase';
import localMCQs from '../data/mcq.json';
import localFlashcards from '../data/flashcards.json';
import { MCQ, Flashcard } from '../types/content';

// Cache for fetched data
let cachedMCQs: MCQ[] | null = null;
let cachedFlashcards: Flashcard[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Transform Supabase row to app format
function transformMCQRow(row: MCQRow): MCQ {
  return {
    id: row.id,
    subarea: row.subarea as MCQ['subarea'],
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
    subarea: row.subarea as Flashcard['subarea'],
    objective: row.objective,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: row.tags,
  };
}

// Fetch MCQs from Supabase with local fallback
export async function loadMCQs(): Promise<MCQ[]> {
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
      return localMCQs as MCQ[];
    }
    
    if (data && data.length > 0) {
      cachedMCQs = data.map(transformMCQRow);
      lastFetchTime = now;
      console.log(`Loaded ${cachedMCQs.length} MCQs from Supabase`);
      return cachedMCQs;
    } else {
      // No data in Supabase yet, use local
      console.log('No MCQs in Supabase, using local data');
      return localMCQs as MCQ[];
    }
  } catch (err) {
    console.log('Network error, using local MCQ data:', err);
    return localMCQs as MCQ[];
  }
}

// Fetch Flashcards from Supabase with local fallback
export async function loadFlashcards(): Promise<Flashcard[]> {
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
      return localFlashcards as Flashcard[];
    }
    
    if (data && data.length > 0) {
      cachedFlashcards = data.map(transformFlashcardRow);
      lastFetchTime = now;
      console.log(`Loaded ${cachedFlashcards.length} flashcards from Supabase`);
      return cachedFlashcards;
    } else {
      // No data in Supabase yet, use local
      console.log('No flashcards in Supabase, using local data');
      return localFlashcards as Flashcard[];
    }
  } catch (err) {
    console.log('Network error, using local flashcard data:', err);
    return localFlashcards as Flashcard[];
  }
}

// Clear cache to force refresh
export function clearDataCache() {
  cachedMCQs = null;
  cachedFlashcards = null;
  lastFetchTime = 0;
}

// Get specific MCQs by subarea
export async function loadMCQsBySubarea(subarea: string): Promise<MCQ[]> {
  const allMCQs = await loadMCQs();
  return allMCQs.filter(mcq => mcq.subarea === subarea);
}

// Get specific flashcards by subarea
export async function loadFlashcardsBySubarea(subarea: string): Promise<Flashcard[]> {
  const allFlashcards = await loadFlashcards();
  return allFlashcards.filter(card => card.subarea === subarea);
}

// Get assessment questions only
export async function loadAssessmentMCQs(): Promise<MCQ[]> {
  const allMCQs = await loadMCQs();
  return allMCQs.filter(mcq => mcq.assessment === true);
}
