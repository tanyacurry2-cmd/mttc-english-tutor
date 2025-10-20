import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { MCQ } from '../types/content';
import { Button } from './Button';

interface QuickFixQuizProps {
  visible: boolean;
  questions: MCQ[];
  onClose: () => void;
  onLearnAgain: () => void;
}

export const QuickFixQuiz: React.FC<QuickFixQuizProps> = ({
  visible,
  questions,
  onClose,
  onLearnAgain,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!visible || completed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit and move to next or complete
          handleAutoSubmit();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, currentIndex, completed]);

  useEffect(() => {
    // Reset when modal opens
    if (visible) {
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setTimeLeft(60);
      setScore(0);
      setCompleted(false);
    }
  }, [visible]);

  const currentQuestion = questions[currentIndex];

  const handleAutoSubmit = () => {
    // Auto-submit when time runs out
    if (selectedAnswer === currentQuestion.correctIndex) {
      setScore(score + 1);
    }

    // Move to next or complete
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(60);
    } else {
      setCompleted(true);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    if (selectedAnswer === currentQuestion.correctIndex) {
      setScore(score + 1);
    }

    // Move to next or complete
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(60);
    } else {
      setCompleted(true);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getTimerColor = () => {
    if (timeLeft > 40) return theme.colors.success;
    if (timeLeft > 20) return theme.colors.accent;
    return theme.colors.error;
  };

  if (completed) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <MaterialCommunityIcons
                name={score >= 3 ? 'trophy' : 'school'}
                size={64}
                color={score >= 3 ? theme.colors.accent : theme.colors.success}
              />
            </View>

            <Text style={styles.completedTitle}>Quick Fix Quiz Complete!</Text>
            <Text style={styles.scoreText}>
              You scored {score} out of {questions.length}
            </Text>

            {score >= 3 ? (
              <Text style={styles.feedbackText}>
                Great work! You're mastering this material.
              </Text>
            ) : (
              <Text style={styles.feedbackText}>
                Let's review this material again to strengthen your understanding.
              </Text>
            )}

            <View style={styles.buttonRow}>
              <Button
                title="Learn Again"
                onPress={() => {
                  onLearnAgain();
                  handleClose();
                }}
                style={styles.actionButton}
              />
              <Button
                title="Continue Drill"
                onPress={handleClose}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!currentQuestion) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick Fix Quiz</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.timerRow}>
            <View style={[styles.timer, { borderColor: getTimerColor() }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={getTimerColor()} />
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {timeLeft}s
              </Text>
            </View>
            <Text style={styles.questionCounter}>
              Question {currentIndex + 1}/{questions.length}
            </Text>
          </View>

          <ScrollView style={styles.questionContent}>
            <Text style={styles.questionText}>{currentQuestion.stem}</Text>

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
                    onPress={() => setSelectedAnswer(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.optionRadio,
                          isSelected && styles.selectedRadio,
                        ]}
                      />
                      <Text style={styles.optionText}>{option}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Button
            title="Submit Answer"
            onPress={handleSubmit}
            disabled={selectedAnswer === null}
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  timerText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginLeft: theme.spacing.sm,
  },
  questionCounter: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  questionContent: {
    flex: 1,
    marginBottom: theme.spacing.lg,
  },
  questionText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    lineHeight: 26,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
  },
  selectedRadio: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  optionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  completedTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  scoreText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  feedbackText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});
