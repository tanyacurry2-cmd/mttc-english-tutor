// Centralized data loader using require() for React Native production builds
// This avoids Metro bundler issues with large ES6 JSON imports

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
  subareaId: string;
  objective: string;
  question: string;
  answer: string;
  explanation?: string;
  tags?: string[];
}

export interface MCQ {
  id: string;
  subarea: string;
  subareaId: string;
  objective: string;
  stem: string;
  options: string[];
  correctIndex: number;
  rationales: string[];
}

// Use require() to load JSON files - works better in React Native production
const questionsData: Question[] = require('../data/questions.json');
const flashcardsData: Flashcard[] = require('../data/flashcards.json');
const mcqData: MCQ[] = require('../data/mcq.json');

export const DataLoader = {
  getAllQuestions: () => questionsData,
  getAllFlashcards: () => flashcardsData,
  getAllMCQs: () => mcqData,
  
  getQuestionById: (id: string) => questionsData.find(q => q.id === id),
  getFlashcardById: (id: string) => flashcardsData.find(f => f.id === id),
  getMCQById: (id: string) => mcqData.find(m => m.id === id),
  
  getQuestionsBySubarea: (subareaId: string) => 
    questionsData.filter(q => q.subareaId === subareaId),
  getFlashcardsBySubarea: (subareaId: string) => 
    flashcardsData.filter(f => f.subareaId === subareaId),
  getMCQsBySubarea: (subareaId: string) => 
    mcqData.filter(m => m.subareaId === subareaId),
};
