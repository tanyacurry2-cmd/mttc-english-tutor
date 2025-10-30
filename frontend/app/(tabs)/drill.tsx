import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAppStore } from '../../lib/store';
import { TrialBanner } from '../../components/TrialBanner';
import { StarryBackground } from '../../components/StarryBackground';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';
import mcqData from '../../data/mcq.json';
import { MCQ } from '../../types/content';
import { playSuccessSound, playErrorSound, initializeAudio } from '../../lib/soundUtils';
import { loadStats, bumpAttempt } from '../../storage/stats';
import { prioritizedPool, shuffle } from '../../utils/selection';
import { getConsecutiveCorrect, incrementConsecutive, resetConsecutive } from '../../storage/mastery';

// Map subarea names to IDs
const subareaNameToId: { [key: string]: string } = {
  'Meaning & Communication': 'SA-1',
  'Literature & Understanding': 'SA-2',
  'Genre & Craft': 'SA-3',
  'Skills & Processes': 'SA-4',
};

export default function DrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mcqHistory, updateMCQHistory } = useAppStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // Confetti ref
  const confettiRef = useRef<any>(null);

  // Animation values
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Load consecutive count on mount
  useEffect(() => {
    (async () => {
      const count = await getConsecutiveCorrect();
      setConsecutiveCorrect(count);
    })();
  }, []);

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
  }, []);

  // Filter and initialize questions with prioritized selection
  useEffect(() => {
    (async () => {
      const stats = await loadStats();
      let allQuestions = mcqData as MCQ[];
      
      // Filter by subarea if param is provided
      if (params.subareaId) {
        allQuestions = allQuestions.filter((q: any) => {
          const qSubareaId = subareaNameToId[q.subarea] || '';
          return qSubareaId === params.subareaId;
        });
      }
      
      // Convert to Question type for prioritizedPool
      const questionsFormat = allQuestions.map(q => ({
        id: q.id,
        type: "mcq" as const,
        mode: "Drill" as const,
        subareaId: (subareaNameToId[q.subarea] || 'SA-1') as any,
        question: q.stem,
        options: q.options,
        answer: q.options[q.correctIndex],
        rationales: q.rationales,
        correctIndex: q.correctIndex
      }));
      
      // Get prioritized pool and shuffle
      const prioritized = prioritizedPool(questionsFormat, stats, {
        subareaId: params.subareaId as any,
        preferUnseen: true,
        freshnessMs: 1000 * 60 * 60 * 8 // 8 hours
      });
      
      const shuffled = shuffle(prioritized);
      
      // Convert back to MCQ format
      const prioritizedMCQs = shuffled.map(q => 
        allQuestions.find(mcq => mcq.id === q.id)
      ).filter(q => q !== undefined) as MCQ[];
      
      setQuestions(prioritizedMCQs);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowRationale(false);
    })();
  }, [params.subareaId]);

  // Shuffle questions
  const handleShuffle = async () => {
    const stats = await loadStats();
    const questionsFormat = questions.map(q => ({
      id: q.id,
      type: "mcq" as const,
      mode: "Drill" as const,
      subareaId: (subareaNameToId[q.subarea] || 'SA-1') as any,
      question: q.stem,
      options: q.options,
      answer: q.options[q.correctIndex],
      rationales: q.rationales,
      correctIndex: q.correctIndex
    }));
    const shuffled = shuffle(questionsFormat);
    const shuffledMCQs = shuffled.map(q => 
      questions.find(mcq => mcq.id === q.id)
    ).filter(q => q !== undefined) as MCQ[];
    
    setQuestions(shuffledMCQs);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowRationale(false);
  };

  const playBounceAnimation = () => {
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const playShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const displayLimit = questions.length;

  if (questions.length === 0) {
    return (
      <StarryBackground>
        <SafeAreaView style={styles.container}>
          <TrialBanner />
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No questions available</Text>
            <Text style={styles.emptyText}>Check back later or try a different subarea</Text>
          </View>
        </SafeAreaView>
      </StarryBackground>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectAnswer = (index: number) => {
    if (showRationale) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    updateMCQHistory(currentQuestion.id, isCorrect);
    
    // Track attempt in stats
    await bumpAttempt(currentQuestion.id, isCorrect);
    
    setShowRationale(true);
    
    // Handle consecutive tracking
    if (isCorrect) {
      const newCount = await incrementConsecutive();
      setConsecutiveCorrect(newCount);
      
      // Show confetti celebration at 10 consecutive
      if (newCount === 10) {
        setShowStreakModal(true);
        confettiRef.current?.start();
      }
      
      playSuccessSound();
      playBounceAnimation();
    } else {
      await resetConsecutive();
      setConsecutiveCorrect(0);
      playErrorSound();
      playShakeAnimation();
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < displayLimit - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowRationale(false);
    } else {
      // Restart or show completion
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowRationale(false);
    }
  };

  return (
    <StarryBackground>
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.header}>
          {params.subareaName && (
            <Text style={styles.subareaName}>{params.subareaName}</Text>
          )}
          <TouchableOpacity onPress={handleShuffle} style={styles.shuffleButton}>
            <MaterialCommunityIcons name="shuffle-variant" size={24} color={theme.colors.accent} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
            <Text style={styles.questionStem}>{currentQuestion.stem}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctIndex;
                const showIncorrect = showRationale && isSelected && !isCorrect;

                return (
                  <Animated.View
                    key={index}
                    style={{
                      transform: [
                        { scale: isSelected ? bounceAnim : 1 },
                        { translateX: showIncorrect ? shakeAnim : 0 },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        isSelected && styles.selectedOption,
                        showRationale && isCorrect && styles.correctOption,
                        showIncorrect && styles.incorrectOption,
                      ]}
                      onPress={() => handleSelectAnswer(index)}
                      disabled={showRationale}
                    >
                      <View style={styles.optionContent}>
                        {showRationale && isCorrect && (
                          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                        )}
                        {showIncorrect && (
                          <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.selectedOptionText,
                            showIncorrect && styles.incorrectOptionText,
                          ]}
                        >
                          {option}
                        </Text>
                      </View>

                      {showRationale && (
                        <Text style={styles.rationaleText}>
                          {currentQuestion.rationales[index]}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {showRationale ? (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.nextButton}
              />
            ) : (
              <Button
                title="Submit Answer"
                onPress={handleSubmit}
                disabled={selectedAnswer === null}
                style={styles.submitButton}
              />
            )}
          </View>
        </ScrollView>
        
        {/* Confetti Cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{x: -10, y: 0}}
          colors={['#00CED1', '#FFD700']} // Bright teal and gold
          fadeOut
          autoStart={false}
        />
        
        {/* 10 Consecutive Streak Modal */}
        <Modal
          visible={showStreakModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStreakModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <MaterialCommunityIcons 
                name="trophy" 
                size={64} 
                color="#FFD700" 
              />
              <Text style={styles.modalTitle}>🎉 Amazing Streak!</Text>
              <Text style={styles.modalText}>
                10 consecutive answers correct!
              </Text>
              <Text style={styles.modalSubtext}>
                Keep up the excellent work!
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowStreakModal(false)}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subareaName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  shuffleText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  questionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  questionStem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    marginBottom: theme.spacing.md,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  selectedOption: {
    borderColor: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}15`,
  },
  correctOption: {
    borderColor: theme.colors.success,
    backgroundColor: `${theme.colors.success}15`,
  },
  incorrectOption: {
    borderColor: theme.colors.error,
    backgroundColor: `${theme.colors.error}10`,
  },
  incorrectOptionText: {
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  optionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
  },
  rationaleText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  nextButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.success,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.accent,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    fontWeight: theme.fontWeight.semibold,
  },
  modalSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  modalButtonText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
