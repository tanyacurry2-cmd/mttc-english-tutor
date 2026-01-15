import React, { useState, useEffect } from 'react';
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
import { DataLoader, AsyncDataLoader } from '../../lib/data-loader';
import { Subarea } from '../../types/content';
import { getMasteredFlashcardIds, getMasteredQuestionIds } from '../../storage/mastery';

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
  const { isPaid, readinessBySubarea, cardReviews, mcqHistory, soundEnabled, toggleSound } = useAppStore();
  
  const [unmasteredFlashcards, setUnmasteredFlashcards] = useState(0);
  const [unmasteredQuestions, setUnmasteredQuestions] = useState(0);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Load counts from Supabase (with local fallback)
  useEffect(() => {
    (async () => {
      const masteredFlashcardIds = await getMasteredFlashcardIds();
      const masteredQuestionIds = await getMasteredQuestionIds();
      
      // Fetch from Supabase (falls back to local if unavailable)
      const allFlashcards = await AsyncDataLoader.getAllFlashcards();
      const allMCQs = await AsyncDataLoader.getAllMCQs();
      
      setTotalFlashcards(allFlashcards.length);
      setTotalQuestions(allMCQs.length);
      setUnmasteredFlashcards(allFlashcards.length - masteredFlashcardIds.length);
      setUnmasteredQuestions(allMCQs.length - masteredQuestionIds.length);
    })();
  }, []);

  const overallReadiness = Math.round(
    Object.values(readinessBySubarea).reduce((sum, val) => sum + val, 0) / 4
  );

  const handleFeaturePress = (feature: FeatureTile) => {
    if (feature.requiresPaid && !isPaid) {
      router.push('/paywall');
    } else {
      router.push(feature.route as any);
    }
  };

  return (
    <StarryBackground>
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>MTTC English Tutor</Text>
            <Text style={styles.subtitle}>Ready to ace the MTTC?</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={toggleSound} style={styles.soundButton}>
              <MaterialCommunityIcons 
                name={soundEnabled ? "volume-high" : "volume-off"} 
                size={24} 
                color={soundEnabled ? theme.colors.accent : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/intro')} style={styles.infoButton}>
              <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
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

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={[styles.quickAccessButton, styles.learnButton]}
            onPress={() => router.push('/(tabs)/learn')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cards" size={28} color="#FFFFFF" />
            <View style={styles.quickAccessTextContainer}>
              <Text style={styles.quickAccessTitle}>Learn</Text>
              <Text style={styles.quickAccessCount}>{unmasteredFlashcards} Flashcards</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAccessButton, styles.drillButton]}
            onPress={() => router.push('/(tabs)/drill')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="clipboard-check" size={28} color="#FFFFFF" />
            <View style={styles.quickAccessTextContainer}>
              <Text style={styles.quickAccessTitle}>Drill</Text>
              <Text style={styles.quickAccessCount}>{unmasteredQuestions} Questions</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Study Modes</Text>
        <View style={styles.featuresGrid}>
          {/* Writing Lab Button */}
          <TouchableOpacity
            style={[styles.featureTile, styles.writingLabTile]}
            onPress={() => router.push('/writing-lab')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil-box-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.featureTitle}>Writing Lab</Text>
            <Text style={styles.featureDescription}>AI-Scored Practice</Text>
          </TouchableOpacity>

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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoButton: {
    padding: theme.spacing.sm,
  },
  soundButton: {
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
  quickAccessContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  quickAccessButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  learnButton: {
    backgroundColor: '#DC3545', // Red color
  },
  drillButton: {
    backgroundColor: theme.colors.accent, // Accent color
  },
  quickAccessTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  quickAccessCount: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
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
  writingLabTile: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
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