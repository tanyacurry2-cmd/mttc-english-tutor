import questionsData from '../data/questions.json';

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

const allQuestions: Question[] = questionsData as Question[];

export const questionApi = {
  // Get all questions with optional filters
  async getQuestions(filters?: QuestionFilters): Promise<Question[]> {
    let filtered = allQuestions;
    
    if (filters?.type) {
      filtered = filtered.filter(q => q.type === filters.type);
    }
    if (filters?.subareaId) {
      filtered = filtered.filter(q => q.subareaId === filters.subareaId);
    }
    if (filters?.mode) {
      filtered = filtered.filter(q => q.mode === filters.mode);
    }
    
    return Promise.resolve(filtered);
  },

  // Get a single question by ID
  async getQuestion(id: string): Promise<Question> {
    const question = allQuestions.find(q => q.id === id);
    if (!question) {
      throw new Error(`Question ${id} not found`);
    }
    return Promise.resolve(question);
  },

  // Get question statistics
  async getStats(): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/questions/stats`);
    return response.json();
  }
};
