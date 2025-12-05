import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppStore } from '../lib/store';
import { theme } from '../lib/theme';
import { useRouter } from 'expo-router';

export const TrialBanner: React.FC = () => {
  const { isPaid } = useAppStore();
  const router = useRouter();

  // Don't show banner if user has premium
  if (isPaid) return null;

  return (
    <TouchableOpacity 
      style={styles.banner}
      onPress={() => router.push('/paywall')}
      activeOpacity={0.8}
    >
      <Text style={styles.bannerText}>
        🎁 Free: 5 flashcards + 5 questions + 1 assessment • Tap to unlock all
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});