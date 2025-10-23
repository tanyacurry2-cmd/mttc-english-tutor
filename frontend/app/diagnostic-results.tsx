import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "../lib/theme";
import { Question } from "../utils/selection";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DiagnosticResults() {
  const params = useLocalSearchParams();
  
  // Parse params with fallback values
  const score01 = params.score01 ? parseFloat(params.score01 as string) : 0;
  const total = params.total ? parseInt(params.total as string) : 0;
  const wrongIds = params.wrongIds ? JSON.parse(params.wrongIds as string) as string[] : [];
  const readiness = params.readiness ? parseInt(params.readiness as string) : 0;
  const wrongQuestions = params.wrongQuestions ? JSON.parse(params.wrongQuestions as string) as Question[] : [];
  const userAnswers = params.userAnswers ? JSON.parse(params.userAnswers as string) as Record<string, string> : {};
  const scorePct = Math.round(score01 * 100);

  const getScoreColor = () => {
    if (scorePct >= 80) return theme.colors.success;
    if (scorePct >= 60) return theme.colors.accent;
    return theme.colors.error;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.scoreCard, { borderColor: getScoreColor() }]}>
          <MaterialCommunityIcons 
            name={scorePct >= 80 ? "check-circle" : scorePct >= 60 ? "information" : "alert-circle"} 
            size={48} 
            color={getScoreColor()} 
          />
          <Text style={styles.title}>Diagnostic Complete</Text>
          <Text style={[styles.scoreText, { color: getScoreColor() }]}>
            {scorePct}%
          </Text>
          <Text style={styles.scoreDetails}>
            {Math.round(score01 * total)} out of {total} correct
          </Text>
          <View style={styles.readinessBadge}>
            <Text style={styles.readinessLabel}>Overall Readiness</Text>
            <Text style={[styles.readinessValue, { color: getScoreColor() }]}>
              {readiness}%
            </Text>
          </View>
        </View>

        {wrongQuestions.length === 0 ? (
          <View style={styles.perfectCard}>
            <MaterialCommunityIcons name="trophy" size={64} color={theme.colors.success} />
            <Text style={styles.perfectTitle}>Perfect Score!</Text>
            <Text style={styles.perfectText}>
              Excellent work! You answered all questions correctly.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Review Incorrect Answers ({wrongQuestions.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              Study these questions to improve your understanding
            </Text>

            {wrongQuestions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const correctIndex = question.options.indexOf(question.answer);
              const userIndex = question.options.indexOf(userAnswer);

              return (
                <View key={question.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Question #{index + 1}</Text>
                    <Text style={styles.questionId}>{question.id}</Text>
                  </View>

                  <Text style={styles.questionText}>{question.question}</Text>

                  <View style={styles.optionsContainer}>
                    {question.options.map((option, idx) => {
                      const isCorrect = idx === correctIndex;
                      const isUserAnswer = idx === userIndex;

                      return (
                        <View
                          key={idx}
                          style={[
                            styles.optionRow,
                            isCorrect && styles.correctOption,
                            isUserAnswer && !isCorrect && styles.wrongOption,
                          ]}
                        >
                          <View style={styles.optionContent}>
                            <MaterialCommunityIcons
                              name={
                                isCorrect
                                  ? "check-circle"
                                  : isUserAnswer
                                  ? "close-circle"
                                  : "circle-outline"
                              }
                              size={20}
                              color={
                                isCorrect
                                  ? theme.colors.success
                                  : isUserAnswer
                                  ? theme.colors.error
                                  : theme.colors.textSecondary
                              }
                            />
                            <Text
                              style={[
                                styles.optionText,
                                isCorrect && styles.correctOptionText,
                                isUserAnswer && !isCorrect && styles.wrongOptionText,
                              ]}
                            >
                              {option}
                            </Text>
                          </View>
                          {question.rationales && question.rationales[idx] && (
                            <Text style={styles.rationaleText}>
                              {question.rationales[idx]}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {userAnswer && (
                    <View style={styles.answerSummary}>
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Your Answer:</Text>
                        <Text style={styles.wrongAnswerValue}>{userAnswer}</Text>
                      </View>
                      <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                        <Text style={styles.correctAnswerValue}>{question.answer}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => router.push("/(tabs)/progress")}
            style={styles.progressButton}
          >
            <MaterialCommunityIcons name="chart-line" size={20} color="white" />
            <Text style={styles.buttonText}>View Progress</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/assessment")}
            style={styles.retryButton}
          >
            <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.accent} />
            <Text style={styles.retryButtonText}>Retake Assessment</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/home")}
            style={styles.homeButton}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
    color: theme.colors.text,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "800",
    marginBottom: 4,
  },
  scoreDetails: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  readinessBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  readinessLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  readinessValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  perfectCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  perfectTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  perfectText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accent,
  },
  questionId: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  questionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionRow: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
  },
  correctOption: {
    backgroundColor: `${theme.colors.success}15`,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  wrongOption: {
    backgroundColor: `${theme.colors.error}15`,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  optionText: {
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
  },
  correctOptionText: {
    fontWeight: "600",
    color: theme.colors.success,
  },
  wrongOptionText: {
    fontWeight: "600",
    color: theme.colors.error,
  },
  rationaleText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 28,
    fontStyle: "italic",
    lineHeight: 18,
  },
  answerSummary: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  answerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  wrongAnswerValue: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  correctAnswerValue: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionButtons: {
    marginTop: 8,
  },
  progressButton: {
    backgroundColor: theme.colors.success,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  retryButtonText: {
    color: theme.colors.accent,
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  homeButton: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  homeButtonText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
});
