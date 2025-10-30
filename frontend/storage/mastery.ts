import AsyncStorage from '@react-native-async-storage/async-storage';

const MASTERED_KEY = 'masteredQuestions';
const MASTERED_FLASHCARDS_KEY = 'masteredFlashcards';
const CONSECUTIVE_KEY = 'consecutiveCorrect';

// Question is considered mastered if answered correctly in last 2 assessments
export interface MasteredQuestion {
  id: string;
  correctCount: number;
  lastCorrect: string; // ISO date
}

// Flashcard is considered mastered if marked correct 3 times
export interface MasteredFlashcard {
  id: string;
  correctCount: number;
  lastCorrect: string;
}

export const getMasteredQuestions = async (): Promise<Record<string, MasteredQuestion>> => {
  try {
    const data = await AsyncStorage.getItem(MASTERED_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting mastered questions:', error);
    return {};
  }
};

export const updateMasteredQuestion = async (questionId: string, wasCorrect: boolean) => {
  try {
    const mastered = await getMasteredQuestions();
    
    if (wasCorrect) {
      if (mastered[questionId]) {
        mastered[questionId].correctCount += 1;
        mastered[questionId].lastCorrect = new Date().toISOString();
      } else {
        mastered[questionId] = {
          id: questionId,
          correctCount: 1,
          lastCorrect: new Date().toISOString()
        };
      }
    } else {
      // Reset if answered incorrectly
      if (mastered[questionId]) {
        mastered[questionId].correctCount = 0;
      }
    }
    
    await AsyncStorage.setItem(MASTERED_KEY, JSON.stringify(mastered));
  } catch (error) {
    console.error('Error updating mastered question:', error);
  }
};

export const isMastered = (question: MasteredQuestion | undefined): boolean => {
  return question ? question.correctCount >= 2 : false;
};

export const getMasteredQuestionIds = async (): Promise<string[]> => {
  const mastered = await getMasteredQuestions();
  return Object.keys(mastered).filter(id => isMastered(mastered[id]));
};

export const reinstateMasteredQuestion = async (questionId: string) => {
  try {
    const mastered = await getMasteredQuestions();
    if (mastered[questionId]) {
      delete mastered[questionId];
      await AsyncStorage.setItem(MASTERED_KEY, JSON.stringify(mastered));
    }
  } catch (error) {
    console.error('Error reinstating question:', error);
  }
};

export const reinstateAllMastered = async () => {
  try {
    await AsyncStorage.removeItem(MASTERED_KEY);
  } catch (error) {
    console.error('Error reinstating all:', error);
  }
};

// FLASHCARD MASTERY FUNCTIONS
export const getMasteredFlashcards = async (): Promise<Record<string, MasteredFlashcard>> => {
  try {
    const data = await AsyncStorage.getItem(MASTERED_FLASHCARDS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting mastered flashcards:', error);
    return {};
  }
};

export const updateMasteredFlashcard = async (flashcardId: string, wasCorrect: boolean) => {
  try {
    const mastered = await getMasteredFlashcards();
    
    if (wasCorrect) {
      if (mastered[flashcardId]) {
        mastered[flashcardId].correctCount += 1;
        mastered[flashcardId].lastCorrect = new Date().toISOString();
      } else {
        mastered[flashcardId] = {
          id: flashcardId,
          correctCount: 1,
          lastCorrect: new Date().toISOString()
        };
      }
    } else {
      // Reset if marked incorrect
      if (mastered[flashcardId]) {
        mastered[flashcardId].correctCount = 0;
      }
    }
    
    await AsyncStorage.setItem(MASTERED_FLASHCARDS_KEY, JSON.stringify(mastered));
  } catch (error) {
    console.error('Error updating mastered flashcard:', error);
  }
};

export const isFlashcardMastered = (flashcard: MasteredFlashcard | undefined): boolean => {
  return flashcard ? flashcard.correctCount >= 3 : false;
};

export const getMasteredFlashcardIds = async (): Promise<string[]> => {
  const mastered = await getMasteredFlashcards();
  return Object.keys(mastered).filter(id => isFlashcardMastered(mastered[id]));
};

export const reinstateMasteredFlashcard = async (flashcardId: string) => {
  try {
    const mastered = await getMasteredFlashcards();
    if (mastered[flashcardId]) {
      delete mastered[flashcardId];
      await AsyncStorage.setItem(MASTERED_FLASHCARDS_KEY, JSON.stringify(mastered));
    }
  } catch (error) {
    console.error('Error reinstating flashcard:', error);
  }
};

export const reinstateAllMasteredFlashcards = async () => {
  try {
    await AsyncStorage.removeItem(MASTERED_FLASHCARDS_KEY);
  } catch (error) {
    console.error('Error reinstating all flashcards:', error);
  }
};

// Consecutive correct tracking (session-based, resets on app restart)
export const getConsecutiveCorrect = async (): Promise<number> => {
  try {
    const data = await AsyncStorage.getItem(CONSECUTIVE_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Error getting consecutive:', error);
    return 0;
  }
};

export const incrementConsecutive = async (): Promise<number> => {
  try {
    const current = await getConsecutiveCorrect();
    const newValue = current + 1;
    await AsyncStorage.setItem(CONSECUTIVE_KEY, newValue.toString());
    return newValue;
  } catch (error) {
    console.error('Error incrementing consecutive:', error);
    return 0;
  }
};

export const resetConsecutive = async () => {
  try {
    await AsyncStorage.setItem(CONSECUTIVE_KEY, '0');
  } catch (error) {
    console.error('Error resetting consecutive:', error);
  }
};

// Call this on app startup to reset consecutive counter
export const initConsecutiveCounter = async () => {
  await resetConsecutive();
};
