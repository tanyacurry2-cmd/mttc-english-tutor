import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionApi, Question } from './api';

const CACHE_KEY = 'questions_cache';
const CACHE_TIMESTAMP_KEY = 'questions_cache_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const questionCache = {
  // Load questions (from cache if available, otherwise from API)
  async loadQuestions(): Promise<Question[]> {
    try {
      // Check if cache exists and is fresh
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      
      const now = Date.now();
      const isCacheFresh = cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION;
      
      if (isCacheFresh && cachedData) {
        console.log('✅ Loading questions from cache');
        return JSON.parse(cachedData);
      }
      
      // Cache is stale or doesn't exist, fetch from API
      console.log('📡 Fetching questions from API');
      const questions = await questionApi.getQuestions();
      
      // Save to cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(questions));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      
      return questions;
    } catch (error) {
      console.error('Error loading questions:', error);
      
      // Try to return cached data as fallback
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        console.log('⚠️ Using stale cache due to API error');
        return JSON.parse(cachedData);
      }
      
      throw error;
    }
  },

  // Force refresh from API
  async refreshQuestions(): Promise<Question[]> {
    console.log('🔄 Force refreshing questions');
    const questions = await questionApi.getQuestions();
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(questions));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    return questions;
  },

  // Clear cache
  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
  }
};
