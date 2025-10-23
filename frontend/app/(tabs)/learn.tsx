import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TrialBanner } from '../../components/TrialBanner';
import { theme } from '../../lib/theme';
import flashcardsData from '../../data/flashcards.json';
import { Card } from '../../types/content';
import { calculateNextReview, ReviewQuality, isDueForReview, sortCardsByPriority, DEFAULT_SRS_CARD } from '../../lib/srs';
import { Button } from '../../components/Button';
import { loadViewedIds, saveViewedIds } from '../../storage/flashcards';

// Map subarea names to IDs
const subareaNameToId: { [key: string]: string } = {
  'Meaning & Communication': 'SA-1',
  'Literature & Understanding': 'SA-2',
  'Genre & Craft': 'SA-3',
  'Skills & Processes': 'SA-4',
};

export default function LearnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { cardReviews, updateCardReview, checkTrialStatus, lastQuestionID, lastMode, setLastStudied } = useAppStore();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<string>>(new Set());
  const flipAnim = useState(new Animated.Value(0))[0];
  const hasAccess = checkTrialStatus();
  const markingRef = useRef(false);

  // Filter cards based on subarea params
  useEffect(() => {
    let filteredCards = flashcardsData as Card[];
    
    // Filter by subarea if param is provided
    if (params.subareaId) {
      filteredCards = filteredCards.filter((card: any) => {
        const cardSubareaId = subareaNameToId[card.subarea] || '';
        return cardSubareaId === params.subareaId;
      });
    }
    
    setCards(filteredCards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    flipAnim.setValue(0);
  }, [params.subareaId]);

  // Shuffle cards
  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    flipAnim.setValue(0);
  };

  useEffect(() => {
    // Build review queue based on SRS
    const cardsWithSRS = cards.map(card => ({
      id: card.id,
      srs: cardReviews[card.id] || DEFAULT_SRS_CARD,
    }));

    const queue = sortCardsByPriority(cardsWithSRS);
    setReviewQueue(queue);
    setCurrentCardIndex(0); // Reset index when queue changes
  }, [cards, cardReviews]);

  const currentCard = cards.find(c => c.id === reviewQueue[currentCardIndex]);

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TrialBanner />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cards" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No flashcards found</Text>
          <Text style={styles.emptyText}>
            {params.subareaName 
              ? `No flashcards available for ${params.subareaName}`
              : 'No flashcards available'}
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }
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
        {params.subareaName && (
          <View style={styles.subareaHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.accent} />
            </TouchableOpacity>
            <Text style={styles.subareaTitle}>{params.subareaName}</Text>
          </View>
        )}
        
        <View style={styles.header}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentCardIndex + 1) / displayLimit) * 100}%` },
              ]}
            />
          </View>
          
          <View style={styles.controlsRow}>
            <Text style={styles.counter}>
              {currentCardIndex + 1} / {displayLimit}
            </Text>
            <TouchableOpacity onPress={handleShuffle} style={styles.shuffleButton}>
              <MaterialCommunityIcons name="shuffle-variant" size={24} color={theme.colors.accent} />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  subareaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButtonHeader: {
    padding: theme.spacing.xs,
  },
  subareaTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.md,
  },
  shuffleText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
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
    justifyContent: 'flex-start',
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
  },
  explanationBox: {
    maxHeight: 110,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xs,
  },
  explanationText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    lineHeight: 16,
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
  backButton: {
    marginTop: theme.spacing.lg,
  },
});