import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || 'http://localhost:8001';

export interface Question {
  id: string;
  subarea: string;
  subareaId: string;
  objective: string;
  mode: string;
  type: string;
  difficulty: number;
  // MCQ fields
  stem?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
  rationales?: string[];
  // Flashcard fields
  explanation?: string;
  tags?: string[];
}

export interface QuestionFilters {
  type?: 'mcq' | 'flashcard';
  subareaId?: string;
  mode?: 'Learn' | 'Drill';
}

export const questionApi = {
  // Get all questions with optional filters
  async getQuestions(filters?: QuestionFilters): Promise<Question[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.subareaId) params.append('subareaId', filters.subareaId);
    if (filters?.mode) params.append('mode', filters.mode);
    
    const url = `${BACKEND_URL}/api/questions${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  // Get a single question by ID
  async getQuestion(id: string): Promise<Question> {
    const response = await fetch(`${BACKEND_URL}/api/questions/${id}`);
    return response.json();
  },

  // Get question statistics
  async getStats(): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/questions/stats`);
    return response.json();
  }
};
