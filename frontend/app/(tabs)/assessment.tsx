import 'react-native-get-random-values';
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, Alert, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { balancedPickBySubarea, Question } from "../../utils/selection";
import Countdown from "../../components/Countdown";
import { saveSession, updateReadinessEma } from "../../storage/sessions";
import { getMasteredQuestionIds, updateMasteredQuestion } from "../../storage/mastery";
import { v4 as uuid } from "uuid";
import { theme } from "../../lib/theme";
import { DataLoader } from "../../lib/data-loader";
import { useAppStore } from "../../lib/store";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PER_SUBAREA = { "SA-1": 5, "SA-2": 5, "SA-3": 5, "SA-4": 5 } as const;
const TOTAL = 20;
const SECONDS = 20 * 60; // 20 minutes

// Generate session ID once outside component
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function DiagnosticScreen() {
  const { canTakeAssessment, incrementAssessments } = useAppStore();
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Check if user can take assessment on mount
  useEffect(() => {
    if (!canTakeAssessment()) {
      setShowPaywall(true);
    }
  }, []);
  
  // Load mastered question IDs on mount
  useEffect(() => {
    (async () => {
      const ids = await getMasteredQuestionIds();
      setMasteredIds(ids);
    })();
  }, []);
  
  // Build a fresh pool on mount, excluding mastered questions
  const pool: Question[] = useMemo(() => {
    try {
      const allMCQs = DataLoader.getAllMCQs();
      // Filter for assessment questions and exclude mastered ones
      const mcqs = allMCQs.filter(
        (q: any) => q.assessment === true && !masteredIds.includes(q.id)
      ).map((q: any) => ({
        ...q,
        subareaId: q.subareaId || (
          q.subarea === 'Meaning & Communication' ? 'SA-1' :
          q.subarea === 'Literature & Understanding' ? 'SA-2' :
          q.subarea === 'Genre & Craft' ? 'SA-3' :
          q.subarea === 'Skills & Processes' ? 'SA-4' : ''
        ),
        question: q.stem || q.question || '',
        answer: q.options?.[q.correctIndex] || '',
      }));
      
      if (mcqs.length === 0) {
        console.log('No assessment questions found');
        return [];
      }
      
      const picked = balancedPickBySubarea(mcqs as Question[], PER_SUBAREA);
      return picked.slice(0, TOTAL);
    } catch (error) {
      console.error("Error creating question pool:", error);
      return [];
    }
  }, [masteredIds]);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [correct, setCorrect] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const sessionId = useMemo(() => generateSessionId(), []);

  const q = pool[idx];

  const submit = async () => {
    if (!q) return;
    const isCorrect = selected === q.answer;
    
    // Track user answer
    setUserAnswers(prev => ({ ...prev, [q.id]: selected }));
    
    // Update mastered question tracking
    await updateMasteredQuestion(q.id, isCorrect);
    
    if (isCorrect) setCorrect(c => c + 1); else setWrongIds(w => [...w, q.id]);
    setSelected("");
    const next = idx + 1;
    if (next >= pool.length) return finish();
    setIdx(next);
  };

  const finish = async () => {
    const score01 = pool.length ? correct / pool.length : 0;
    // include current question if user answered just now
    const adjScore01 = pool.length ? (correct + (selected === q?.answer ? 1 : 0)) / pool.length : score01;

    await saveSession({
      id: sessionId,
      date: new Date().toISOString(),
      score01: adjScore01,
      total: pool.length,
      wrongIds
    });

    const ema = await updateReadinessEma(adjScore01);
    
    // Increment assessment count (premium enforcement)
    incrementAssessments();
    
    // Prepare wrong questions with details
    const wrongQuestions = pool.filter(question => wrongIds.includes(question.id));
    
    router.replace({
      pathname: "/diagnostic-results",
      params: {
        score01: adjScore01.toString(),
        total: pool.length.toString(),
        wrongIds: JSON.stringify(wrongIds),
        readiness: Math.round(ema * 100).toString(),
        wrongQuestions: JSON.stringify(wrongQuestions),
        userAnswers: JSON.stringify(userAnswers)
      }
    });
  };

  const timeUp = () => {
    Alert.alert("Time's up", "Submitting your answers.", [
      { text: "OK", onPress: finish }
    ]);
  };

  if (!q) {
    return <View style={styles.container}>
      <Text style={styles.errorText}>No questions found for diagnostic.</Text>
    </View>;
  }

  // Show paywall modal if user can't take assessment
  if (showPaywall) {
    return (
      <View style={styles.container}>
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallModal}>
            <MaterialCommunityIcons name="lock" size={64} color={theme.colors.accent} />
            <Text style={styles.paywallTitle}>Unlock Unlimited Assessments</Text>
            <Text style={styles.paywallText}>
              You've used your free assessment.{'\n\n'}
              Upgrade to Premium for unlimited practice exams and more!
            </Text>
            <TouchableOpacity
              style={styles.paywallButton}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.paywallButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.paywallCloseButton}
              onPress={() => router.back()}
            >
              <Text style={styles.paywallCloseText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{`Question ${idx + 1} / ${pool.length}`}</Text>
        <Countdown seconds={SECONDS} onExpire={timeUp} style={styles.timer} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.questionText}>{q.question}</Text>

        {q.options.map((item, index) => (
          <Pressable
            key={`${item}-${index}`}
            onPress={() => setSelected(item)}
            style={[
              styles.optionButton,
              selected === item && styles.optionButtonSelected
            ]}>
            <Text style={[
              styles.optionText,
              selected === item && styles.optionTextSelected
            ]}>{item}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={submit}
          disabled={!selected}
          style={[
            styles.submitButton,
            !selected && styles.submitButtonDisabled
          ]}>
          <Text style={styles.submitButtonText}>
            {idx + 1 >= pool.length ? "Submit" : "Next"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding at bottom for submit button
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  timer: {
    fontWeight: "bold",
    fontSize: 18,
    color: theme.colors.accent,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    color: theme.colors.text,
    lineHeight: 26,
  },
  optionButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  optionButtonSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}15`,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  optionTextSelected: {
    color: theme.colors.accent,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: theme.colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  paywallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallModal: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.xl,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  paywallTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  paywallText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  paywallButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  paywallButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    textAlign: 'center',
  },
  paywallCloseButton: {
    marginTop: theme.spacing.md,
  },
  paywallCloseText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
});
