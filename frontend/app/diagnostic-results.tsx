import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "../lib/theme";
import { Question } from "../utils/selection";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DiagnosticResults() {
  const params = useLocalSearchParams();
  const score01 = parseFloat(params.score01 as string);
  const total = parseInt(params.total as string);
  const wrongIds = JSON.parse(params.wrongIds as string) as string[];
  const readiness = parseInt(params.readiness as string);
  const wrongQuestions = JSON.parse(params.wrongQuestions as string) as Question[];
  const userAnswers = JSON.parse(params.userAnswers as string) as Record<string, string>;
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
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: theme.colors.text,
  },
  scoreText: {
    fontSize: 18,
    marginBottom: 12,
    color: theme.colors.text,
  },
  readinessText: {
    fontSize: 18,
    marginBottom: 24,
    color: theme.colors.accent,
    fontWeight: "600",
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 12,
    color: theme.colors.text,
  },
  perfectText: {
    fontSize: 16,
    color: theme.colors.success,
    marginBottom: 20,
  },
  wrongIdText: {
    marginBottom: 8,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  progressButton: {
    marginTop: 24,
    backgroundColor: theme.colors.success,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  progressButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  homeButton: {
    marginTop: 12,
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
