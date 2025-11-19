import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { Subarea } from '../types/content';
import { DataLoader } from '../lib/data-loader';

export default function ObjectiveStudyScreen() {
  const router = useRouter();
  const { subarea } = useLocalSearchParams<{ subarea: Subarea }>();
  const [activeTab, setActiveTab] = useState<'learn' | 'drill'>('learn');

  const flashcards = flashcardsData.filter((card) => card.subarea === subarea);
  const questions = mcqData.filter((q) => q.subarea === subarea);

  const goToLearn = () => {
    router.push({
      pathname: '/(tabs)/learn',
      params: { filterSubarea: subarea },
    });
  };

  const goToDrill = () => {
    router.push({
      pathname: '/(tabs)/drill',
      params: { filterSubarea: subarea },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subarea}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="cards" size={32} color={theme.colors.accent} />
              <Text style={styles.statNumber}>{flashcards.length}</Text>
              <Text style={styles.statLabel}>Flashcards</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="clipboard-check"
                size={32}
                color={theme.colors.success}
              />
              <Text style={styles.statNumber}>{questions.length}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Study Modes</Text>

          <TouchableOpacity style={styles.modeCard} onPress={goToLearn} activeOpacity={0.7}>
            <View style={[styles.modeIcon, { backgroundColor: theme.colors.accent }]}>
              <MaterialCommunityIcons name="cards" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Learn Mode</Text>
              <Text style={styles.modeDescription}>
                Master concepts with {flashcards.length} flashcards
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.modeCard} onPress={goToDrill} activeOpacity={0.7}>
            <View style={[styles.modeIcon, { backgroundColor: theme.colors.success }]}>
              <MaterialCommunityIcons name="clipboard-check" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Drill Mode</Text>
              <Text style={styles.modeDescription}>
                Practice with {questions.length} MCQs
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.contentPreview}>
            <Text style={styles.previewTitle}>Preview Content</Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'learn' && styles.activeTab]}
                onPress={() => setActiveTab('learn')}
              >
                <Text style={[styles.tabText, activeTab === 'learn' && styles.activeTabText]}>
                  Flashcards
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'drill' && styles.activeTab]}
                onPress={() => setActiveTab('drill')}
              >
                <Text style={[styles.tabText, activeTab === 'drill' && styles.activeTabText]}>
                  Questions
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'learn' ? (
              <View style={styles.previewList}>
                {flashcards.slice(0, 3).map((card, index) => (
                  <View key={index} style={styles.previewItem}>
                    <MaterialCommunityIcons
                      name="circle-small"
                      size={20}
                      color={theme.colors.accent}
                    />
                    <Text style={styles.previewText}>{card.question}</Text>
                  </View>
                ))}
                {flashcards.length > 3 && (
                  <Text style={styles.moreText}>+{flashcards.length - 3} more flashcards</Text>
                )}
              </View>
            ) : (
              <View style={styles.previewList}>
                {questions.slice(0, 3).map((q, index) => (
                  <View key={index} style={styles.previewItem}>
                    <MaterialCommunityIcons
                      name="circle-small"
                      size={20}
                      color={theme.colors.success}
                    />
                    <Text style={styles.previewText}>{q.stem}</Text>
                  </View>
                ))}
                {questions.length > 3 && (
                  <Text style={styles.moreText}>+{questions.length - 3} more questions</Text>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.fullAccessButton}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.fullAccessText}>Sign Up for Full Access</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  modeDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  contentPreview: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  previewTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  previewList: {
    marginTop: theme.spacing.sm,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  previewText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  moreText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
    marginTop: theme.spacing.sm,
    marginLeft: 20,
  },
  fullAccessButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  fullAccessText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
});
