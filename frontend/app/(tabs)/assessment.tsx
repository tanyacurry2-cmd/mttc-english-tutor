import 'react-native-get-random-values';
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Alert, StyleSheet } from "react-native";
import { router } from "expo-router";
import { balancedPickBySubarea, Question } from "../../utils/selection";
import Countdown from "../../components/Countdown";
import { saveSession, updateReadinessEma } from "../../storage/sessions";
import { v4 as uuid } from "uuid";
import { theme } from "../../lib/theme";

// Load questions
import questionsData from "../../data/questions.json";

const PER_SUBAREA = { "SA-1": 5, "SA-2": 5, "SA-3": 5, "SA-4": 5 } as const;
const TOTAL = 20;
const SECONDS = 20 * 60; // 20 minutes

export default function DiagnosticScreen() {
  // Build a fresh pool on mount
  const pool: Question[] = useMemo(() => {
    const mcqs = (questionsData as Question[]).filter(q => q.type === "mcq" && q.mode === "Drill");
    const picked = balancedPickBySubarea(mcqs, PER_SUBAREA);
    // Fallback if any subarea was short
    return picked.slice(0, TOTAL);
  }, []);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [correct, setCorrect] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const sessionId = useMemo(() => uuid(), []);

  const q = pool[idx];

  const submit = () => {
    if (!q) return;
    const isCorrect = selected === q.answer;
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
    router.replace({
      pathname: "/diagnostic-results",
      params: {
        score01: adjScore01.toString(),
        total: pool.length.toString(),
        wrongIds: JSON.stringify(wrongIds),
        readiness: Math.round(ema * 100).toString()
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{`Question ${idx + 1} / ${pool.length}`}</Text>
        <Countdown seconds={SECONDS} onExpire={timeUp} style={styles.timer} />
      </View>

      <Text style={styles.questionText}>{q.question}</Text>

      <FlatList
        data={q.options}
        keyExtractor={(opt) => opt}
        renderItem={({ item }) => (
          <Pressable
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
        )}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
});
