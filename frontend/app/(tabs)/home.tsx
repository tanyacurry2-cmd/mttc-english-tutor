import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { TrialBanner } from '../../components/TrialBanner';
import { StarryBackground } from '../../components/StarryBackground';
import { theme } from '../../lib/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import flashcardsData from '../../data/flashcards.json';
import mcqData from '../../data/mcq.json';
import { Subarea } from '../../types/content';

type FeatureTile = {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
  route: string;
  color: string;
  requiresPaid?: boolean;
};

const features: FeatureTile[] = [
  {
    id: 'learn',
    title: 'Learn',
    icon: 'cards',
    description: 'Master concepts with flashcards',
    route: '/(tabs)/learn',
    color: theme.colors.success,
  },
  {
    id: 'drill',
    title: 'Drill',
    icon: 'clipboard-check',
    description: 'Practice with MCQs',
    route: '/(tabs)/drill',
    color: theme.colors.accent,
  },
  {
    id: 'assessment',
    title: 'Assessment',
    icon: 'clipboard-text',
    description: '20-question diagnostic',
    route: '/(tabs)/assessment',
    color: '#2D8A7E',
  },
  {
    id: 'progress',
    title: 'Progress',
    icon: 'chart-line',
    description: 'Track your readiness',
    route: '/(tabs)/progress',
    color: '#C8A96A',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, readinessBySubarea, cardReviews, mcqHistory, checkTrialStatus } = useAppStore();
  const logout = useAppStore((state) => state.logout);
  const hasAccess = checkTrialStatus();

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    router.replace('/signup');
  };

  const calculateNextBestStep = (): { subarea: Subarea; type: string; count: number } => {
    // Find the weakest subarea
    const subareas = Object.entries(readinessBySubarea) as [Subarea, number][];
    const weakest = subareas.reduce((min, curr) => 
      curr[1] < min[1] ? curr : min
    );

    // Count available items in that subarea
    const mcqCount = mcqData.filter(q => q.subarea === weakest[0]).length;
    
    return {
      subarea: weakest[0],
      type: 'Drill',
      count: mcqCount,
    };
  };

  const nextStep = calculateNextBestStep();
  const overallReadiness = Math.round(
    Object.values(readinessBySubarea).reduce((sum, val) => sum + val, 0) / 4
  );

  const handleFeaturePress = (feature: FeatureTile) => {
    if (feature.requiresPaid && !hasAccess) {
      router.push('/paywall');
    } else {
      router.push(feature.route as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TrialBanner />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user.email?.split('@')[0]}</Text>
            <Text style={styles.subtitle}>Ready to ace the MTTC?</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{overallReadiness}%</Text>
            <Text style={styles.statLabel}>Readiness</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Object.keys(cardReviews).length}</Text>
            <Text style={styles.statLabel}>Cards Reviewed</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Object.keys(mcqHistory).length}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <MaterialCommunityIcons name="lightbulb" size={24} color={theme.colors.accent} />
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Next Best Step</Text>
            <Text style={styles.recommendationText}>
              {nextStep.type} {nextStep.subarea} ({nextStep.count} items)
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Study Modes</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureTile}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                <MaterialCommunityIcons name={feature.icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              {feature.requiresPaid && !hasAccess && (
                <View style={styles.lockBadge}>
                  <MaterialCommunityIcons name="lock" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
    </StarryBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    marginTop: 0,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.accent,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  recommendationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
  },
  featureTile: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: '1.5%',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});