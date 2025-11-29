import React, { useEffect, useState } from 'react';
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
import { theme } from '../../lib/theme';
import { Subarea } from '../../types/content';
import { loadSessions, loadReadinessEma, SessionSummary } from '../../storage/sessions';
import { 
  getMasteredQuestions, 
  reinstateMasteredQuestion, 
  reinstateAllMastered, 
  MasteredQuestion, 
  isMastered,
  getMasteredFlashcards,
  reinstateMasteredFlashcard,
  reinstateAllMasteredFlashcards,
  MasteredFlashcard,
  isFlashcardMastered
} from '../../storage/mastery';
import { DataLoader } from '../../lib/data-loader';
import { Question } from '../../utils/selection';
import { Card } from '../../types/content';

export default function ProgressScreen() {
  const { readinessBySubarea, mcqHistory, cardReviews, streakDays } = useAppStore();
  const [diagnosticReadiness, setDiagnosticReadiness] = useState<number>(0);
  const [diagnosticHistory, setDiagnosticHistory] = useState<SessionSummary[]>([]);
  const [masteredQuestions, setMasteredQuestions] = useState<Record<string, MasteredQuestion>>({});
  const [masteredFlashcards, setMasteredFlashcards] = useState<Record<string, MasteredFlashcard>>({});
  const [showMastered, setShowMastered] = useState(false);
  const [showMasteredFlashcards, setShowMasteredFlashcards] = useState(false);

  useEffect(() => {
    (async () => {
      const ema = await loadReadinessEma();
      if (Number.isFinite(ema)) setDiagnosticReadiness(Math.round(ema * 100));
      const sessions = await loadSessions();
      setDiagnosticHistory(sessions);
      const mastered = await getMasteredQuestions();
      setMasteredQuestions(mastered);
      const masteredCards = await getMasteredFlashcards();
      setMasteredFlashcards(masteredCards);
    })();
  }, []);
  
  const refreshMastered = async () => {
    const mastered = await getMasteredQuestions();
    setMasteredQuestions(mastered);
    const masteredCards = await getMasteredFlashcards();
    setMasteredFlashcards(masteredCards);
  };
  
  const handleReinstate = async (questionId: string) => {
    await reinstateMasteredQuestion(questionId);
    await refreshMastered();
  };
  
  const handleReinstateFlashcard = async (flashcardId: string) => {
    await reinstateMasteredFlashcard(flashcardId);
    await refreshMastered();
  };
  
  const handleReinstateAll = () => {
    Alert.alert(
      'Reinstate All Questions',
      'Are you sure you want to reinstate all mastered questions? They will appear in future assessments.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reinstate All', 
          onPress: async () => {
            await reinstateAllMastered();
            await refreshMastered();
          }
        }
      ]
    );
  };
  
  const handleReinstateAllFlashcards = () => {
    Alert.alert(
      'Reinstate All Flashcards',
      'Are you sure you want to reinstate all mastered flashcards? They will appear in Learn mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reinstate All', 
          onPress: async () => {
            await reinstateAllMasteredFlashcards();
            await refreshMastered();
          }
        }
      ]
    );
  };
  
  const masteredList = Object.values(masteredQuestions).filter(q => isMastered(q));
  const masteredCount = masteredList.length;
  
  const masteredFlashcardsList = Object.values(masteredFlashcards).filter(f => isFlashcardMastered(f));
  const masteredFlashcardsCount = masteredFlashcardsList.length;

  const calculateOverallReadiness = () => {
    const values = Object.values(readinessBySubarea);
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  const calculateAccuracyBySubarea = () => {
    const subareas: Subarea[] = [
      'Meaning & Communication',
      'Literature & Understanding',
      'Genre & Craft',
      'Skills & Processes',
    ];

    return subareas.map((subarea) => {
      const subareaHistory = Object.values(mcqHistory).filter((h) => {
        // This is simplified - in production, you'd track subarea per MCQ
        return true;
      });

      const total = subareaHistory.reduce((sum, h) => sum + h.attempts, 0);
      const correct = subareaHistory.reduce((sum, h) => sum + h.correct, 0);
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      return { subarea, accuracy, total, correct };
    });
  };

  const overallReadiness = calculateOverallReadiness();
  const subareaStats = calculateAccuracyBySubarea();
  const totalQuestions = Object.keys(mcqHistory).length;
  const totalCards = Object.keys(cardReviews).length;

  const getReadinessColor = (readiness: number) => {
    if (readiness >= 80) return theme.colors.success;
    if (readiness >= 60) return theme.colors.accent;
    return theme.colors.error;
  };

  const getReadinessMessage = (readiness: number) => {
    if (readiness >= 80) return 'Excellent! You\'re ready!';
    if (readiness >= 60) return 'Good progress, keep going!';
    if (readiness >= 40) return 'Getting there...';
    return 'Keep studying!';
  };

  return (
    <SafeAreaView style={styles.container}>
      <TrialBanner />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Mastered Questions Section - Always show */}
          <View style={styles.masteredCard}>
            <TouchableOpacity 
              style={styles.masteredHeader}
              onPress={() => setShowMastered(!showMastered)}
            >
              <View style={styles.masteredTitleRow}>
                <MaterialCommunityIcons 
                  name="trophy-variant" 
                  size={24} 
                  color={theme.colors.success} 
                />
                <Text style={styles.masteredTitle}>
                  Questions Mastered ({masteredCount})
                </Text>
              </View>
              <MaterialCommunityIcons 
                name={showMastered ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showMastered && (
              <View style={styles.masteredContent}>
                {masteredCount > 0 ? (
                  <>
                    <Text style={styles.masteredDescription}>
                      These questions won't appear in future assessments. Tap to reinstate them.
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.reinstateAllButton}
                      onPress={handleReinstateAll}
                    >
                      <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.accent} />
                      <Text style={styles.reinstateAllText}>Reinstate All</Text>
                    </TouchableOpacity>
                    
                    {masteredList.map((item) => {
                      // Use DataLoader to safely get question data
                      const question = DataLoader.getAllQuestions().find(q => q.id === item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.masteredItem}
                          onPress={() => handleReinstate(item.id)}
                        >
                          <View style={styles.masteredItemContent}>
                            <Text style={styles.masteredItemId}>{item.id}</Text>
                            <Text style={styles.masteredItemText} numberOfLines={2}>
                              {question?.question || question?.stem || 'Unknown question'}
                            </Text>
                            <Text style={styles.masteredItemCount}>
                              Correct: {item.correctCount} times
                            </Text>
                          </View>
                          <MaterialCommunityIcons 
                            name="restore" 
                            size={20} 
                            color={theme.colors.accent} 
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : (
                  <Text style={styles.masteredDescription}>
                    No questions mastered yet. Keep practicing to see your progress here!
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {/* Mastered Flashcards Section - Always show */}
          <View style={styles.masteredCard}>
            <TouchableOpacity 
              style={styles.masteredHeader}
              onPress={() => setShowMasteredFlashcards(!showMasteredFlashcards)}
            >
              <View style={styles.masteredTitleRow}>
                <MaterialCommunityIcons 
                  name="cards" 
                  size={24} 
                  color={theme.colors.accent} 
                />
                <Text style={styles.masteredTitle}>
                  Flashcards Mastered ({masteredFlashcardsCount})
                </Text>
              </View>
              <MaterialCommunityIcons 
                name={showMasteredFlashcards ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showMasteredFlashcards && (
              <View style={styles.masteredContent}>
                {masteredFlashcardsCount > 0 ? (
                  <>
                    <Text style={styles.masteredDescription}>
                      These flashcards won't appear in Learn mode. Tap to reinstate them.
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.reinstateAllButton}
                      onPress={handleReinstateAllFlashcards}
                    >
                      <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.accent} />
                      <Text style={styles.reinstateAllText}>Reinstate All</Text>
                    </TouchableOpacity>
                    
                    {masteredFlashcardsList.map((item) => {
                      // Use DataLoader to safely get flashcard data
                      const flashcard = DataLoader.getAllFlashcards().find(f => f.id === item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.masteredItem}
                          onPress={() => handleReinstateFlashcard(item.id)}
                        >
                          <View style={styles.masteredItemContent}>
                            <Text style={styles.masteredItemId}>{item.id}</Text>
                            <Text style={styles.masteredItemText} numberOfLines={2}>
                              {flashcard?.question || 'Unknown flashcard'}
                            </Text>
                            <Text style={styles.masteredItemCount}>
                              Correct: {item.correctCount} times
                            </Text>
                          </View>
                          <MaterialCommunityIcons 
                            name="restore" 
                            size={20} 
                            color={theme.colors.accent} 
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : (
                  <Text style={styles.masteredDescription}>
                    No flashcards mastered yet. Keep studying to see your progress here!
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {diagnosticReadiness > 0 && (
            <View style={styles.readinessCard}>
              <Text style={styles.diagnosticLabel}>Diagnostic Readiness:</Text>
              <Text style={[styles.diagnosticValue, { color: getReadinessColor(diagnosticReadiness) }]}>
                {diagnosticReadiness}%
              </Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="fire"
                size={32}
                color={theme.colors.accent}
              />
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="cards"
                size={32}
                color={theme.colors.success}
              />
              <Text style={styles.statValue}>{totalCards}</Text>
              <Text style={styles.statLabel}>Cards Reviewed</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="clipboard-check"
                size={32}
                color={theme.colors.accent}
              />
              <Text style={styles.statValue}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Questions Answered</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Performance by Subarea</Text>

          {subareaStats.map((stat, index) => {
            const readiness = readinessBySubarea[stat.subarea];
            return (
              <View key={index} style={styles.subareaCard}>
                <View style={styles.subareaHeader}>
                  <Text style={styles.subareaTitle}>{stat.subarea}</Text>
                  <Text
                    style={[
                      styles.subareaReadiness,
                      { color: getReadinessColor(readiness) },
                    ]}
                  >
                    {readiness}%
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${readiness}%`,
                        backgroundColor: getReadinessColor(readiness),
                      },
                    ]}
                  />
                </View>

                {stat.total > 0 && (
                  <View style={styles.subareaStats}>
                    <Text style={styles.subareaStatText}>
                      Accuracy: {stat.accuracy}% ({stat.correct}/{stat.total})
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {diagnosticHistory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Diagnostics</Text>
              {diagnosticHistory.map((session) => (
                <View key={session.id} style={styles.diagnosticCard}>
                  <View style={styles.diagnosticHeader}>
                    <Text style={styles.diagnosticDate}>
                      {new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={[styles.diagnosticScore, { color: getReadinessColor(Math.round(session.score01 * 100)) }]}>
                      {Math.round(session.score01 * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.diagnosticDetails}>
                    {Math.round(session.score01 * session.total)}/{session.total} correct
                  </Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.tipsCard}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={24}
              color={theme.colors.accent}
            />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Study Tips</Text>
              <Text style={styles.tipsText}>
                Review flashcards daily for best retention.{"\n\n"}
                Focus on your weakest subareas first.{"\n\n"}
                Take practice exams to simulate test conditions.{"\n\n"}
                Maintain your study streak for consistent progress.
              </Text>
            </View>
          </View>
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
  readinessCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readinessLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  readinessCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  readinessPercentage: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
  },
  readinessMessage: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  subareaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  subareaTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  subareaReadiness: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subareaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subareaStatText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  tipsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  diagnosticReadiness: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  diagnosticLabel: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    marginRight: theme.spacing.sm,
  },
  diagnosticValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
  },
  diagnosticCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  diagnosticDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  diagnosticScore: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  diagnosticDetails: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  masteredCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  masteredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masteredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  masteredTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  masteredContent: {
    marginTop: theme.spacing.md,
  },
  masteredDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  reinstateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.accent}15`,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  reinstateAllText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.md,
  },
  masteredItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masteredItemContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  masteredItemId: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  masteredItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  masteredItemCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.semibold,
  },
});