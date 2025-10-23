import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { theme } from "../lib/theme";

export default function DiagnosticResults() {
  const params = useLocalSearchParams();
  const score01 = parseFloat(params.score01 as string);
  const total = parseInt(params.total as string);
  const wrongIds = JSON.parse(params.wrongIds as string) as string[];
  const readiness = parseInt(params.readiness as string);
  const scorePct = Math.round(score01 * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Diagnostic Complete
      </Text>
      <Text style={styles.scoreText}>
        Score: {scorePct}% ({Math.round(score01 * total)} / {total})
      </Text>
      <Text style={styles.readinessText}>
        Overall Readiness (local): {readiness}%
      </Text>

      <Text style={styles.sectionTitle}>Questions to Review</Text>
      {wrongIds.length === 0 ? (
        <Text style={styles.perfectText}>Nice work. No misses this time.</Text>
      ) : (
        <FlatList
          data={wrongIds}
          keyExtractor={(id) => id}
          renderItem={({ item }) => <Text style={styles.wrongIdText}>• {item}</Text>}
        />
      )}

      <Pressable
        onPress={() => router.push("/(tabs)/progress")}
        style={styles.progressButton}>
        <Text style={styles.progressButtonText}>Go to Progress</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(tabs)/home")}
        style={styles.homeButton}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </Pressable>
    </View>
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
