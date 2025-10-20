import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { TrialBanner } from '../../components/TrialBanner';
import { theme } from '../../lib/theme';
import flashcardsData from '../../data/flashcards.json';
import { Card } from '../../types/content';
import { calculateNextReview, ReviewQuality, isDueForReview, sortCardsByPriority, DEFAULT_SRS_CARD } from '../../lib/srs';
import { Button } from '../../components/Button';

export default function LearnScreen() {
  const { cardReviews, updateCardReview, checkTrialStatus, lastQuestionID, lastMode, setLastStudied } = useAppStore();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards] = useState<Card[]>(flashcardsData as Card[]);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const flipAnim = useState(new Animated.Value(0))[0];
  const hasAccess = checkTrialStatus();

  useEffect(() => {
    // Build review queue based on SRS
    const cardsWithSRS = cards.map(card => ({
      id: card.id,
      srs: cardReviews[card.id] || DEFAULT_SRS_CARD,
    }));

    const queue = sortCardsByPriority(cardsWithSRS);
    setReviewQueue(queue);
  }, [cardReviews]);

  const currentCard = cards.find(c => c.id === reviewQueue[currentCardIndex]);

  const flipCard = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleResponse = (quality: ReviewQuality) => {
    if (!currentCard) return;

    const currentSRS = cardReviews[currentCard.id] || DEFAULT_SRS_CARD;
    const newSRS = calculateNextReview(currentSRS, quality);
    updateCardReview(currentCard.id, newSRS);

    // Move to next card
    setIsFlipped(false);
    flipAnim.setValue(0);
    
    if (currentCardIndex < reviewQueue.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Reached end, rebuild queue
      setCurrentCardIndex(0);
    }
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.success} />
          <Text style={styles.emptyTitle}>All cards reviewed!</Text>
          <Text style={styles.emptyText}>Come back later for more reviews</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayLimit = reviewQueue.length; // Show all cards for demo/testing

  return (
    <SafeAreaView style={styles.container}>
      <TrialBanner />
      <View style={styles.content}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentCardIndex + 1) / displayLimit) * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.counter}>
          {currentCardIndex + 1} / {displayLimit}
        </Text>

        <TouchableOpacity
          style={styles.cardContainer}
          onPress={flipCard}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }] },
              isFlipped && styles.hiddenCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.subarea}>{currentCard.subarea}</Text>
              <Text style={styles.objective}>{currentCard.objective}</Text>
            </View>
            <Text style={styles.questionText}>{currentCard.question}</Text>
            <View style={styles.tapHint}>
              <MaterialCommunityIcons name="gesture-tap" size={24} color={theme.colors.textSecondary} />
              <Text style={styles.tapText}>Tap to flip</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] },
              !isFlipped && styles.hiddenCard,
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.subarea}>{currentCard.subarea}</Text>
            </View>
            <Text style={styles.answerLabel}>Answer:</Text>
            <Text style={styles.answerText}>{currentCard.answer}</Text>
            <View style={styles.explanationBox}>
              <ScrollView>
                <Text style={styles.explanationText}>{currentCard.explanation}</Text>
              </ScrollView>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {isFlipped && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.responseButton, styles.wrongButton]}
              onPress={() => handleResponse(ReviewQuality.WRONG)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Not Yet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.responseButton, styles.goodButton]}
              onPress={() => handleResponse(ReviewQuality.GOOD)}
            >
              <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  counter: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  limitMessage: {
    backgroundColor: theme.colors.accent,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  limitText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
  },
  cardContainer: {
    flex: 1,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  hiddenCard: {
    opacity: 0,
  },
  cardHeader: {
    marginBottom: theme.spacing.lg,
  },
  subarea: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    textTransform: 'uppercase',
  },
  objective: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  questionText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    lineHeight: 32,
    flex: 1,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  tapText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  answerLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  answerText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  explanationBox: {
    maxHeight: 150,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  explanationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.sm,
  },
  wrongButton: {
    backgroundColor: theme.colors.error,
  },
  goodButton: {
    backgroundColor: theme.colors.success,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});