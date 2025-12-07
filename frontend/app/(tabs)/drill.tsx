import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TrialBanner } from '../../components/TrialBanner';
import { StarryBackground } from '../../components/StarryBackground';
import { theme } from '../../lib/theme';
import { DataLoader } from '../../lib/data-loader';
import { Button } from '../../components/Button';
import { loadStats, bumpSeen } from '../../storage/stats';
import { prioritizedPool } from '../../utils/selection';
import { getMasteredQuestionIds, updateMasteredQuestion } from '../../storage/mastery';

// Map subarea names to IDs
const subareaNameToId: { [key: string]: string } = {
  'Meaning & Communication': 'SA-1',
  'Literature & Understanding': 'SA-2',
  'Genre & Craft': 'SA-3',
  'Skills & Processes': 'SA-4',
};

type Question = {
  id: string;
  subarea: string;
  objective: string;
  stem: string;
  options: string[];
  correctIndex: number;
  rationales: string[];
  [key: string]: any;
};

export default function DrillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { mcqHistory, updateMCQHistory, isPaid, canAccessDrillQuestion, lastQuestionID, lastMode, setLastStudied } = useAppStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load mastered IDs on mount
  useEffect(() => {
    (async () => {
      const mastered = await getMasteredQuestionIds();
      setMasteredIds(mastered);
    })();
  }, []);

  // Filter questions based on subarea param
  useEffect(() => {
    (async () => {
      const stats = await loadStats();
      let allQuestions = (DataLoader.getAllMCQs() as Question[]).filter(
        q => !masteredIds.includes(q.id) // Filter out mastered questions
      );
      
      // Filter by subarea if param is provided
      if (params.subareaId) {
        allQuestions = allQuestions.filter((q: any) => {
          const qSubareaId = subareaNameToId[q.subarea] || '';
          return qSubareaId === params.subareaId;
        });
      }

      // Convert to Question type for prioritizedPool
      const questionsWithMode = allQuestions.map((q: any) => ({
        ...q,
        mode: 'Drill',
        type: 'mcq'
      }));

      // Use prioritizedPool to select questions
      const selectedQuestions = prioritizedPool(
        questionsWithMode,
        stats,
        30 // Select 30 questions
      );

      setQuestions(selectedQuestions as Question[]);

      // Check if we should resume
      if (lastQuestionID && lastMode === 'Drill' && selectedQuestions.length > 0) {
        const lastIndex = selectedQuestions.findIndex((q: Question) => q.id === lastQuestionID);
        if (lastIndex >= 0) {
          setShowResumePrompt(true);
        }
      }
    })();
  }, [params.subareaId, masteredIds]);

  const handleResume = (resume: boolean) => {
    if (resume) {
      const lastIndex = questions.findIndex(q => q.id === lastQuestionID);
      if (lastIndex >= 0) {
        setCurrentQuestionIndex(lastIndex);
      }
    }
    setShowResumePrompt(false);
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Bump seen counter
    await bumpSeen(currentQuestion.id);

    // Save last studied position
    if (currentQuestionIndex < questions.length - 1) {
      setLastStudied(questions[currentQuestionIndex + 1].id, 'Drill');
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      
      // Check if user can access the next question (premium enforcement)
      if (!canAccessDrillQuestion(nextIndex)) {
        setShowPaywall(true);
        return;
      }
      
      // Animate out
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestionIndex(nextIndex);
        setSelectedOption(null);
        setShowResult(false);
        slideAnim.setValue(300);
        // Animate in
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // All questions completed - clear state and navigate safely
      try {
        setLastStudied('', ''); // Clear last studied
        setSelectedOption(null);
        setShowResult(false);
        // Use replace instead of back to avoid navigation issues
        router.replace('/(tabs)/home');
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to back if replace fails
        router.back();
      }
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setShowResult(true);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    updateMCQHistory(currentQuestion.id, isCorrect);
  };

  const handleMastery = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    await updateMasteredQuestion(currentQuestion.id);
    setMasteredIds([...masteredIds, currentQuestion.id]);
    // Move to next question
    handleNext();
  };

  // Premium enforcement will be added per-question, not blocking entire mode
  // TODO: Add check using canAccessDrillQuestion(index)

  if (showResumePrompt) {
    return (
      <StarryBackground>
        <SafeAreaView style={styles.container}>
          <TrialBanner />
          <View style={styles.resumePrompt}>
            <Text style={styles.resumeTitle}>Resume Your Practice?</Text>
            <Text style={styles.resumeText}>You have an unfinished drill session. Would you like to continue where you left off?</Text>
            <View style={styles.resumeButtons}>
              <Button
                title="Start Fresh"
                onPress={() => handleResume(false)}
                variant="outline"
                style={styles.resumeButton}
              />
              <Button
                title="Resume"
                onPress={() => handleResume(true)}
                style={styles.resumeButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </StarryBackground>
    );
  }

  if (questions.length === 0) {
    return (
      <StarryBackground>
        <SafeAreaView style={styles.container}>
          <TrialBanner />
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.success} />
            <Text style={styles.emptyText}>All questions mastered!</Text>
            <Text style={styles.emptySubtext}>Come back later for more practice</Text>
          </View>
        </SafeAreaView>
      </StarryBackground>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion.correctIndex;

  return (
    <StarryBackground>
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.header}>
          <Text style={styles.progress}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stem}>{currentQuestion.stem}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isThisCorrect = index === currentQuestion.correctIndex;
                let optionStyle = [styles.option];
                if (showResult) {
                  if (isThisCorrect) {
                    optionStyle.push(styles.correctOption);
                  } else if (isSelected) {
                    optionStyle.push(styles.incorrectOption);
                  }
                } else if (isSelected) {
                  optionStyle.push(styles.selectedOption);
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={optionStyle}
                    onPress={() => !showResult && setSelectedOption(index)}
                    disabled={showResult}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionNumber}>
                        <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                      {showResult && isThisCorrect && (
                        <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
                      )}
                      {showResult && isSelected && !isThisCorrect && (
                        <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showResult && (
              <View style={styles.resultContainer}>
                <View style={[styles.resultBanner, isCorrect ? styles.correctBanner : styles.incorrectBanner]}>
                  <MaterialCommunityIcons 
                    name={isCorrect ? "check-circle" : "close-circle"} 
                    size={24} 
                    color="#fff" 
                  />
                  <Text style={styles.resultText}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </Text>
                </View>
                <Text style={styles.rationaleTitle}>Explanation:</Text>
                <Text style={styles.rationaleText}>{currentQuestion.rationales[currentQuestion.correctIndex]}</Text>
                
                {isCorrect && (
                  <TouchableOpacity 
                    style={styles.masteryButton}
                    onPress={handleMastery}
                  >
                    <MaterialCommunityIcons name="star" size={20} color={theme.colors.accent} />
                    <Text style={styles.masteryButtonText}>Mark as Mastered</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        <View style={styles.footer}>
          {!showResult ? (
            <Button
              title="Submit"
              onPress={handleSubmit}
              disabled={selectedOption === null}
              style={styles.submitButton}
            />
          ) : (
            <Button
              title={currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete'}
              onPress={handleNext}
              style={styles.submitButton}
            />
          )}
        </View>
      </SafeAreaView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stem: {
    fontSize: 18,
    lineHeight: 26,
    color: theme.colors.text,
    marginBottom: 24,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    overflow: 'hidden',
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
    backgroundColor: `${theme.colors.error}15`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  resultContainer: {
    marginTop: 24,
    gap: 16,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  correctBanner: {
    backgroundColor: theme.colors.success,
  },
  incorrectBanner: {
    backgroundColor: theme.colors.error,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  rationaleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  rationaleText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  masteryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  masteryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    width: '100%',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  resumePrompt: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  resumeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  resumeText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  resumeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeButton: {
    flex: 1,
  },
});
