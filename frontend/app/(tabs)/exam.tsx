import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { TrialBanner } from '../../components/TrialBanner';
import { useAppStore } from '../../lib/store';
import flashcardsData from '../../data/flashcards.json';
import mcqData from '../../data/mcq.json';

type Subarea = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

const subareas: Subarea[] = [
  {
    id: 'SA-1',
    name: 'Meaning & Communication',
    icon: 'chat-processing',
    color: '#00968880',
  },
  {
    id: 'SA-2',
    name: 'Literature & Understanding',
    icon: 'book-open-page-variant',
    color: '#C6945580',
  },
  {
    id: 'SA-3',
    name: 'Genre & Craft',
    icon: 'pen',
    color: '#7B68EE80',
  },
  {
    id: 'SA-4',
    name: 'Skills & Processes',
    icon: 'cog',
    color: '#FF8C0080',
  },
];

// Map subarea names to IDs
const subareaNameToId: { [key: string]: string } = {
  'Meaning & Communication': 'SA-1',
  'Literature & Understanding': 'SA-2',
  'Genre & Craft': 'SA-3',
  'Skills & Processes': 'SA-4',
};

export default function ExamScreen() {
  const router = useRouter();
  const { cardReviews, mcqHistory } = useAppStore();

  // Calculate counts and performance for each subarea
  const subareaStats = useMemo(() => {
    return subareas.map((subarea) => {
      // Get subarea ID from name mapping
      const subareaId = subarea.id;
      
      // Count flashcards for this subarea
      const flashcardCount = flashcardsData.filter((card: any) => {
        const cardSubareaId = subareaNameToId[card.subarea] || '';
        return cardSubareaId === subareaId;
      }).length;

      // Count drill questions for this subarea
      const drillCount = mcqData.filter((q: any) => {
        const qSubareaId = subareaNameToId[q.subarea] || '';
        return qSubareaId === subareaId;
      }).length;

      // Calculate accuracy for this subarea
      const subareaQuestions = mcqData.filter((q: any) => {
        const qSubareaId = subareaNameToId[q.subarea] || '';
        return qSubareaId === subareaId;
      });

      let totalAttempts = 0;
      let correctAttempts = 0;

      subareaQuestions.forEach((q: any) => {
        const history = mcqHistory[q.id];
        if (history) {
          totalAttempts += history.attempts;
          correctAttempts += history.correct;
        }
      });

      const accuracy = totalAttempts > 0 
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : null;

      return {
        ...subarea,
        flashcardCount,
        drillCount,
        accuracy,
        totalAttempts,
      };
    });
  }, [mcqHistory]);

  const handleSubareaPress = (subarea: Subarea, mode: 'Learn' | 'Drill') => {
    if (mode === 'Learn') {
      router.push({
        pathname: '/(tabs)/learn',
        params: { subareaId: subarea.id, subareaName: subarea.name },
      });
    } else {
      router.push({
        pathname: '/(tabs)/drill',
        params: { subareaId: subarea.id, subareaName: subarea.name },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TrialBanner />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="chart-box" size={32} color={theme.colors.accent} />
            <Text style={styles.title}>Performance by Subarea</Text>
          </View>
          <Text style={styles.subtitle}>
            Select a subarea to practice specific content
          </Text>

          <View style={styles.grid}>
            {subareaStats.map((subarea) => (
              <View key={subarea.id} style={styles.cardWrapper}>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: subarea.color },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name={subarea.icon as any}
                      size={32}
                      color={theme.colors.text}
                    />
                    <Text style={styles.cardTitle}>{subarea.name}</Text>
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                      <MaterialCommunityIcons name="cards" size={16} color={theme.colors.text} />
                      <Text style={styles.statText}>
                        {subarea.flashcardCount} Flashcards
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <MaterialCommunityIcons name="clipboard-check" size={16} color={theme.colors.text} />
                      <Text style={styles.statText}>
                        {subarea.drillCount} Drill Questions
                      </Text>
                    </View>
                    {subarea.accuracy !== null && (
                      <View style={styles.statRow}>
                        <MaterialCommunityIcons name="chart-line" size={16} color={theme.colors.text} />
                        <Text style={styles.statText}>
                          Accuracy: {subarea.accuracy}%
                        </Text>
                      </View>
                    )}
                    {subarea.totalAttempts === 0 && (
                      <View style={styles.statRow}>
                        <MaterialCommunityIcons name="information" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                          No attempts yet
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSubareaPress(subarea, 'Learn')}
                      disabled={subarea.flashcardCount === 0}
                    >
                      <MaterialCommunityIcons name="cards" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Learn</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.drillButton]}
                      onPress={() => handleSubareaPress(subarea, 'Drill')}
                      disabled={subarea.drillCount === 0}
                    >
                      <MaterialCommunityIcons name="clipboard-check" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Drill</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statsContainer: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  drillButton: {
    backgroundColor: theme.colors.success,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.xs,
  },
});
