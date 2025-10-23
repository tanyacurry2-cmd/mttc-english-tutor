import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { TrialBanner } from '../../components/TrialBanner';
import { theme } from '../../lib/theme';
import { Subarea } from '../../types/content';
import { loadSessions, loadReadinessEma, SessionSummary } from '../../storage/sessions';

export default function ProgressScreen() {
  const { readinessBySubarea, mcqHistory, cardReviews, streakDays } = useAppStore();
  const [diagnosticReadiness, setDiagnosticReadiness] = useState<number>(0);
  const [diagnosticHistory, setDiagnosticHistory] = useState<SessionSummary[]>([]);

  useEffect(() => {
    (async () => {
      const ema = await loadReadinessEma();
      if (Number.isFinite(ema)) setDiagnosticReadiness(Math.round(ema * 100));
      const sessions = await loadSessions();
      setDiagnosticHistory(sessions);
    })();
  }, []);

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
          <View style={styles.readinessCard}>
            <Text style={styles.readinessLabel}>Overall Readiness</Text>
            <View style={styles.readinessCircle}>
              <Text
                style={[
                  styles.readinessPercentage,
                  { color: getReadinessColor(overallReadiness) },
                ]}
              >
                {overallReadiness}%
              </Text>
            </View>
            <Text style={styles.readinessMessage}>
              {getReadinessMessage(overallReadiness)}
            </Text>
            {diagnosticReadiness > 0 && (
              <View style={styles.diagnosticReadiness}>
                <Text style={styles.diagnosticLabel}>Diagnostic Readiness:</Text>
                <Text style={[styles.diagnosticValue, { color: getReadinessColor(diagnosticReadiness) }]}>
                  {diagnosticReadiness}%
                </Text>
              </View>
            )}
          </View>

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
});