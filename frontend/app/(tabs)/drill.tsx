import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { TrialBanner } from '../../components/TrialBanner';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';
import mcqData from '../../data/mcq.json';
import { MCQ } from '../../types/content';
import { playSuccessSound, playErrorSound, initializeAudio } from '../../lib/soundUtils';

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
  const { mcqHistory, updateMCQHistory, checkTrialStatus } = useAppStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const hasAccess = checkTrialStatus();
  
  // Animation refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
  }, []);

  // Filter and initialize questions based on subarea params
  useEffect(() => {
    let filteredQuestions = mcqData as MCQ[];
    
    // Filter by subarea if param is provided
    if (params.subareaId) {
      filteredQuestions = filteredQuestions.filter((q: any) => {
        const qSubareaId = subareaNameToId[q.subarea] || '';
        return qSubareaId === params.subareaId;
      });
    }
    
    setQuestions(filteredQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowRationale(false);
  }, [params.subareaId]);

  // Shuffle questions
  const handleShuffle = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowRationale(false);
  };

  // Bounce animation
  const playBounceAnimation = () => {
    bounceAnim.setValue(1);
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Shake animation
  const playShakeAnimation = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const displayLimit = questions.length; // Show all questions for demo/testing
  const currentQuestion = questions[currentQuestionIndex];

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-alert" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No questions found</Text>
          <Text style={styles.emptyText}>
            {params.subareaName 
              ? `No drill questions available for ${params.subareaName}`
              : 'No drill questions available'}
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleSelectAnswer = (index: number) => {
    if (showRationale) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    updateMCQHistory(currentQuestion.id, isCorrect);
    setShowRationale(true);
    
    // Play sound and animation
    if (isCorrect) {
      playSuccessSound();
      playBounceAnimation();
    } else {
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

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>All questions completed!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctIndex;
  const history = mcqHistory[currentQuestion.id];
  const accuracy = history ? Math.round((history.correct / history.attempts) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <TrialBanner />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {params.subareaName && (
            <View style={styles.subareaHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.accent} />
              </TouchableOpacity>
              <Text style={styles.subareaTitle}>{params.subareaName}</Text>
            </View>
          )}
          
          <View style={styles.header}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentQuestionIndex + 1) / displayLimit) * 100}%` },
                ]}
              />
            </View>
            <TouchableOpacity onPress={handleShuffle} style={styles.shuffleButton}>
              <MaterialCommunityIcons name="shuffle-variant" size={24} color={theme.colors.accent} />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.counter}>
            Question {currentQuestionIndex + 1} / {displayLimit}
          </Text>

          <Animated.View
            style={{
              transform: [
                { scale: bounceAnim },
                { translateX: shakeAnim },
              ],
            }}
          >
            <View style={styles.questionCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.subarea}>{currentQuestion.subarea}</Text>
                <Text style={styles.objective}>{currentQuestion.objective}</Text>
              </View>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>L{currentQuestion.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.questionStem}>{currentQuestion.stem}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctIndex;
                const showCorrect = showRationale && isCorrectAnswer;
                const showIncorrect = showRationale && isSelected && !isCorrectAnswer;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                      showCorrect && styles.correctOption,
                      showIncorrect && styles.incorrectOption,
                    ]}
                    onPress={() => handleSelectAnswer(index)}
                    activeOpacity={0.7}
                    disabled={showRationale}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionRadio,
                          isSelected && styles.selectedRadio,
                          showCorrect && styles.correctRadio,
                          showIncorrect && styles.incorrectRadio,
                        ]}
                      >
                        {showCorrect && (
                          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                        )}
                        {showIncorrect && (
                          <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </View>

                    {showRationale && (
                      <View style={styles.rationaleBox}>
                        <Text style={styles.rationaleText}>
                          {currentQuestion.rationales[index]}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {history && (
              <View style={styles.historyBox}>
                <Text style={styles.historyText}>
                  Your accuracy: {accuracy}% ({history.correct}/{history.attempts})
                </Text>
              </View>
            )}
          </View>
          </Animated.View>

          {!showRationale ? (
            <Button
              title="Submit Answer"
              onPress={handleSubmit}
              disabled={selectedAnswer === null}
              style={styles.submitButton}
            />
          ) : (
            <View style={styles.resultContainer}>
              <View
                style={[
                  styles.resultBadge,
                  isCorrect ? styles.correctBadge : styles.incorrectBadge,
                ]}
              >
                <MaterialCommunityIcons
                  name={isCorrect ? 'check-circle' : 'close-circle'}
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.resultText}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
              </View>
              <Button
                title="Next Question"
                onPress={handleNext}
                style={styles.nextButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  subareaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subareaTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.md,
  },
  shuffleText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  counter: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  limitMessage: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  limitText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  subarea: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    textTransform: 'uppercase',
  },
  objective: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  difficultyBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  questionStem: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: theme.spacing.lg,
  },
  optionsContainer: {
    marginTop: theme.spacing.md,
  },
  option: {
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  selectedOption: {
    borderColor: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}10`,
  },
  correctOption: {
    borderColor: theme.colors.success,
    backgroundColor: `${theme.colors.success}10`,
  },
  incorrectOption: {
    borderColor: theme.colors.error,
    backgroundColor: `${theme.colors.error}10`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  correctRadio: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success,
  },
  incorrectRadio: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error,
  },
  optionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  selectedOptionText: {
    fontWeight: theme.fontWeight.semibold,
  },
  rationaleBox: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rationaleText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  historyBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  historyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  resultContainer: {
    marginTop: theme.spacing.lg,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  correctBadge: {
    backgroundColor: theme.colors.success,
  },
  incorrectBadge: {
    backgroundColor: theme.colors.error,
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    marginLeft: theme.spacing.md,
  },
  nextButton: {
    marginTop: theme.spacing.sm,
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
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
  },
  backButton: {
    marginTop: theme.spacing.xl,
  },
});