import React from 'react';
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
import { theme } from '../lib/theme';
import { Subarea } from '../types/content';

type Objective = {
  id: string;
  title: string;
  description: string;
};

type SubareaData = {
  subarea: Subarea;
  title: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  objectives: Objective[];
};

const subareas: SubareaData[] = [
  {
    subarea: 'Meaning & Communication',
    title: 'Subarea I: Meaning and Communication',
    color: '#2D8A7E',
    icon: 'comment-text',
    objectives: [
      {
        id: 'obj1',
        title: 'Understand how language functions in context',
        description: 'Study language use, context clues, and effective communication strategies.',
      },
      {
        id: 'obj2',
        title: 'Identify elements of effective communication',
        description: 'Learn rhetorical devices, clarity, and audience awareness.',
      },
    ],
  },
  {
    subarea: 'Literature & Understanding',
    title: 'Subarea II: Literature and Understanding',
    color: '#C8A96A',
    icon: 'book-open-page-variant',
    objectives: [
      {
        id: 'obj3',
        title: 'Analyze literary elements, devices, and structures',
        description: 'Explore metaphor, symbolism, foreshadowing, and narrative techniques.',
      },
      {
        id: 'obj4',
        title: 'Recognize genre, theme, and author purpose',
        description: 'Study poetry, prose, drama, and thematic analysis.',
      },
    ],
  },
  {
    subarea: 'Genre & Craft',
    title: 'Subarea III: Genre and Craft',
    color: '#8B5A3C',
    icon: 'feather',
    objectives: [
      {
        id: 'obj5',
        title: 'Evaluate writing techniques and stylistic choices',
        description: 'Examine tone, voice, sentence structure, and clarity.',
      },
      {
        id: 'obj6',
        title: 'Identify the influence of audience and purpose on writing',
        description: 'Understand how writers adapt style for different contexts.',
      },
    ],
  },
  {
    subarea: 'Skills & Processes',
    title: 'Subarea IV: Skills and Processes',
    color: '#4A5D7C',
    icon: 'chart-timeline-variant',
    objectives: [
      {
        id: 'obj7',
        title: 'Understand the stages of reading and writing development',
        description: 'Learn literacy development, writing processes, and revision strategies.',
      },
      {
        id: 'obj8',
        title: 'Apply assessment strategies for literacy and composition',
        description: 'Study evaluation methods, research skills, and citation formats.',
      },
    ],
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  const handleObjectiveTap = (subarea: Subarea) => {
    router.push({
      pathname: '/objective-study',
      params: { subarea },
    });
  };

  const handleGetStarted = () => {
    router.push('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>MTTC English (002)</Text>
          <Text style={styles.subtitle}>Objectives</Text>
          <Text style={styles.description}>
            Tap an objective to explore study questions that match it.
          </Text>
        </View>

        {subareas.map((area, index) => (
          <View key={index} style={styles.subareaCard}>
            <View style={styles.subareaHeader}>
              <View style={[styles.iconCircle, { backgroundColor: area.color }]}>
                <MaterialCommunityIcons name={area.icon} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.subareaTitle}>{area.title}</Text>
            </View>

            {area.objectives.map((objective, objIndex) => (
              <TouchableOpacity
                key={objIndex}
                style={styles.objectiveCard}
                onPress={() => handleObjectiveTap(area.subarea)}
                activeOpacity={0.7}
              >
                <View style={styles.objectiveContent}>
                  <View style={styles.objectiveBullet}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={area.color}
                    />
                  </View>
                  <View style={styles.objectiveText}>
                    <Text style={styles.objectiveTitle}>{objective.title}</Text>
                    <Text style={styles.objectiveDescription}>{objective.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.examButton} onPress={() => router.push('/(tabs)/exam')}>
            <MaterialCommunityIcons name="chart-box" size={20} color="#FFFFFF" />
            <Text style={styles.examButtonText}>View Performance by Subarea</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started with Full Access</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.footerText}>
            Sign up for a 3-day free trial to unlock all features
          </Text>
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
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.accent,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  subareaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subareaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  subareaTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  objectiveCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  objectiveContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  objectiveBullet: {
    marginTop: 2,
    marginRight: theme.spacing.sm,
  },
  objectiveText: {
    flex: 1,
  },
  objectiveTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  objectiveDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  examButton: {
    backgroundColor: '#7B68EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    width: '90%',
  },
  examButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
  getStartedButton: {
    backgroundColor: theme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  getStartedText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginRight: theme.spacing.sm,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
