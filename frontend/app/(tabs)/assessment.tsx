import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { TrialBanner } from '../../components/TrialBanner';
import { Button } from '../../components/Button';
import { theme } from '../../lib/theme';
import assessmentData from '../../data/assessment.json';
import { MCQ } from '../../types/content';

const TIME_LIMIT_MINUTES = 20;

export default function AssessmentScreen() {
  const { checkTrialStatus } = useAppStore();
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT_MINUTES * 60);
  const [questions] = useState<MCQ[]>(assessmentData as MCQ[]);
  const hasAccess = checkTrialStatus();

  // Timer effect
  useEffect(() => {
    if (!started || completed) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed]);

  const handleStart = () => {
    setStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeRemaining(TIME_LIMIT_MINUTES * 60);
    setCompleted(false);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    const unanswered = questions.length - Object.keys(selectedAnswers).length;
    if (unanswered > 0) {
      Alert.alert(
        'Incomplete Assessment',
        `You have ${unanswered} unanswered questions. Submit anyway?`,
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'Submit', onPress: () => setCompleted(true) },
        ]
      );
    } else {
      setCompleted(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctIndex) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.introContainer}>
          <MaterialCommunityIcons name="clipboard-check" size={80} color={theme.colors.accent} />
          <Text style={styles.introTitle}>Diagnostic Assessment</Text>
          <Text style={styles.introText}>
            This 20-question assessment will help identify your strengths and areas for improvement across all MTTC English 002 subareas.
          </Text>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="timer" size={20} color={theme.colors.text} />
              <Text style={styles.infoText}>Time Limit: {TIME_LIMIT_MINUTES} minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="format-list-numbered" size={20} color={theme.colors.text} />
              <Text style={styles.infoText}>Questions: {questions.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="lock-open" size={20} color={theme.colors.text} />
              <Text style={styles.infoText}>Navigate freely between questions</Text>
            </View>
          </View>
          <Button title="Start Assessment" onPress={handleStart} style={styles.startButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    const score = calculateScore();
    const passed = score.percentage >= 70;

    return (
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <ScrollView style={styles.scrollView}>
          <View style={styles.resultsContainer}>
            <MaterialCommunityIcons
              name={passed ? 'trophy' : 'clipboard-alert'}
              size={80}
              color={passed ? theme.colors.success : theme.colors.accent}
            />
            <Text style={styles.resultsTitle}>Assessment Complete!</Text>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreText}>{score.correct} / {score.total}</Text>
              <Text style={styles.percentageText}>{score.percentage}%</Text>
            </View>

            <View style={styles.resultsList}>
              <Text style={styles.resultsSubtitle}>Your Answers:</Text>
              {questions.map((q, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === q.correctIndex;
                const wasAnswered = userAnswer !== undefined;

                return (
                  <View key={q.id} style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultNumber}>Q{index + 1}</Text>
                      <MaterialCommunityIcons
                        name={wasAnswered ? (isCorrect ? 'check-circle' : 'close-circle') : 'help-circle'}
                        size={24}
                        color={wasAnswered ? (isCorrect ? theme.colors.success : theme.colors.error) : theme.colors.textSecondary}
                      />
                    </View>
                    <Text style={styles.resultSubarea}>{q.subarea}</Text>
                    <Text style={styles.resultStem} numberOfLines={2}>{q.stem}</Text>
                    {wasAnswered && !isCorrect && (
                      <Text style={styles.correctAnswerText}>Correct: {q.options[q.correctIndex]}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <Button title="Retake Assessment" onPress={handleStart} style={styles.retakeButton} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <SafeAreaView style={styles.container}>
      <TrialBanner />
      <View style={styles.header}>
        <View style={styles.timerBox}>
          <MaterialCommunityIcons name="timer" size={20} color={timeRemaining < 300 ? theme.colors.error : theme.colors.text} />
          <Text style={[styles.timerText, timeRemaining < 300 && styles.timerWarning]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
        <Text style={styles.progressText}>{answeredCount} / {questions.length} answered</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>

          <Text style={styles.counter}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.subarea}>{currentQuestion.subarea}</Text>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>L{currentQuestion.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.questionStem}>{currentQuestion.stem}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                    ]}
                    onPress={() => handleSelectAnswer(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionRadio,
                          isSelected && styles.selectedRadio,
                        ]}
                      >
                        {isSelected && (
                          <View style={styles.radioInner} />
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.navigationButtons}>
            <Button
              title="Previous"
              onPress={handlePrevious}
              disabled={currentQuestionIndex === 0}
              style={styles.navButton}
              variant="outline"
            />
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                title="Complete"
                onPress={handleComplete}
                style={styles.navButton}
              />
            ) : (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.navButton}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.questionNavigator}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {questions.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.navDot,
                index === currentQuestionIndex && styles.navDotActive,
                selectedAnswers[index] !== undefined && styles.navDotAnswered,
              ]}
              onPress={() => setCurrentQuestionIndex(index)}
            >
              <Text style={[
                styles.navDotText,
                index === currentQuestionIndex && styles.navDotTextActive,
              ]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  introContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  introText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  startButton: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  timerWarning: {
    color: theme.colors.error,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
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
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
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
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  navButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  questionNavigator: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  navDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  navDotActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  navDotAnswered: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.success,
  },
  navDotText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },
  navDotTextActive: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  scoreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  percentageText: {
    fontSize: theme.fontSize.xxl,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
    marginTop: theme.spacing.sm,
  },
  resultsList: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  resultsSubtitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  resultItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  resultNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  resultSubarea: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  resultStem: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  correctAnswerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  retakeButton: {
    width: '100%',
  },
});