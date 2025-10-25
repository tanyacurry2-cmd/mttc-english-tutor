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
import { loadStats, bumpSeen } from '../../storage/stats';
import { prioritizedPool } from '../../utils/selection';

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
  const flipAnim = useState(new Animated.Value(0))[0];
  const hasAccess = checkTrialStatus();

  // Load cards with prioritized selection
  useEffect(() => {
    (async () => {
      const stats = await loadStats();
      let allCards = flashcardsData as Card[];
      
      // Filter by subarea if param is provided
      if (params.subareaId) {
        allCards = allCards.filter((card: any) => {
          const cardSubareaId = subareaNameToId[card.subarea] || '';
          return cardSubareaId === params.subareaId;
        });
      }
      
      // Convert to Question type for prioritizedPool
      const questionsFormat = allCards.map(card => ({
        id: card.id,
        type: "flashcard" as const,
        mode: "Learn" as const,
        subareaId: (subareaNameToId[card.subarea] || 'SA-1') as any,
        question: card.question,
        answer: card.answer,
        options: [],
        rationales: [],
        correctIndex: 0
      }));
      
      // Get prioritized pool
      const prioritized = prioritizedPool(questionsFormat, stats, {
        subareaId: params.subareaId as any,
        preferUnseen: true,
        freshnessMs: 1000 * 60 * 60 * 8 // 8 hours
      });
      
      // Convert back to Card format
      const prioritizedCards = prioritized.map(q => 
        allCards.find(c => c.id === q.id)
      ).filter(c => c !== undefined) as Card[];
      
      setCards(prioritizedCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      flipAnim.setValue(0);
      
      // Mark first card as seen
      if (prioritizedCards[0]) {
        await bumpSeen(prioritizedCards[0].id);
      }
    })();
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
  }, [cards, cardReviews]);

  const currentCard = cards[currentCardIndex];

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

  const handleResponse = async (quality: ReviewQuality) => {
    if (!currentCard) return;

    const currentSRS = cardReviews[currentCard.id] || DEFAULT_SRS_CARD;
    const newSRS = calculateNextReview(currentSRS, quality);
    updateCardReview(currentCard.id, newSRS);

    // Move to next card
    setIsFlipped(false);
    flipAnim.setValue(0);
    
    if (currentCardIndex < cards.length - 1) {
      const nextIndex = currentCardIndex + 1;
      setCurrentCardIndex(nextIndex);
      // Mark next card as seen
      if (cards[nextIndex]) {
        await bumpSeen(cards[nextIndex].id);
      }
    } else {
      // Reached end, restart from beginning
      setCurrentCardIndex(0);
      if (cards[0]) {
        await bumpSeen(cards[0].id);
      }
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

  const displayLimit = cards.length; // Total cards available

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
          <TouchableOpacity onPress={handleShuffle} style={styles.shuffleButton}>
            <MaterialCommunityIcons name="shuffle-variant" size={24} color={theme.colors.accent} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
              <View style={styles.cardHeader}>
                <Text style={styles.subarea}>{currentCard.subarea}</Text>
              </View>
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answerText}>{currentCard.answer}</Text>
              <View style={styles.explanationBox}>
                <Text style={styles.explanationText}>{currentCard.explanation}</Text>
              </View>
            </ScrollView>
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
  counterContainer: {
    flexDirection: 'column',
  },
  counter: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  viewedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
  },
  explanationBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
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
  backButton: {
    marginTop: theme.spacing.lg,
  },
});