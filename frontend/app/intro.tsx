import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function IntroScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text accessibilityRole="header" style={styles.title}>
        How Will This MTTC English Coach Resource Help You?
      </Text>

      {/* Feature List */}
      <View style={styles.card}>
        <Feature
          icon={<MaterialCommunityIcons name="shuffle-variant" size={22} color="#cfe0ff" />}
          title="Shuffled Flashcards & Drills"
          body="Every session feels new with randomized items for stronger recall."
        />
        <Separator />
        <Feature
          icon={<Ionicons name="layers-outline" size={22} color="#cfe0ff" />}
          title="560+ Exam-Aligned Questions"
          body="Items mapped directly to MTTC English 002 objectives."
        />
        <Separator />
        <Feature
          icon={<MaterialCommunityIcons name="target-account" size={22} color="#cfe0ff" />}
          title="Smart Review Logic"
          body="Prioritizes unseen or missed items; skips cards you've mastered."
        />
        <Separator />
        <Feature
          icon={<Ionicons name="timer-outline" size={22} color="#cfe0ff" />}
          title="Take an Assessment Anytime"
          body="Timed 20-question diagnostics; stores your last 5 scores."
        />
        <Separator />
        <Feature
          icon={<MaterialCommunityIcons name="folder-star-outline" size={22} color="#cfe0ff" />}
          title="Mastered Questions Folder"
          body="Keep mastered items separate, with an option to restore for spaced review."
        />
        <Separator />
        <Feature
          icon={<MaterialCommunityIcons name="chart-line" size={22} color="#cfe0ff" />}
          title="Daily Progress Tracker"
          body="See daily streak, flashcards reviewed, and questions answered."
        />
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.cta, styles.ctaPrimary]}
          onPress={() => router.push("/(tabs)/learn")}
          accessibilityLabel="Start learning now"
        >
          <Text style={styles.ctaPrimaryText}>Start Learning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cta, styles.ctaSecondary]}
          onPress={() => router.push("/(tabs)/exam")}
          accessibilityLabel="View performance by subarea"
        >
          <Text style={styles.ctaSecondaryText}>View Subareas</Text>
        </TouchableOpacity>
      </View>
      
      {/* Terms & Privacy Link */}
      <TouchableOpacity onPress={() => router.push('/terms')} style={styles.termsLink}>
        <Text style={styles.termsText}>Terms of Service & Privacy Policy</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1526" },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: "#cfe0ff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#111c33",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#1a2a4d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureTitle: { color: "white", fontWeight: "700", fontSize: 13, marginBottom: 2 },
  featureBody: { color: "#b9c7e6", fontSize: 11, lineHeight: 16 },
  sep: { height: 1, backgroundColor: "#233459", marginVertical: 10 },
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  cta: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: { backgroundColor: "#2a66ff" },
  ctaPrimaryText: { color: "white", fontWeight: "800", fontSize: 14 },
  ctaSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#3a4e7a" },
  ctaSecondaryText: { color: "#cfe0ff", fontWeight: "700", fontSize: 14 },
  tagline: {
    textAlign: "center",
    color: "#98acd3",
    marginTop: 16,
    fontSize: 12,
  },
  termsLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  termsText: {
    textAlign: "center",
    color: "#98acd3",
    fontSize: 11,
    textDecorationLine: "underline",
  },
});
