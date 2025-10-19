import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../lib/store';
import { theme } from '../lib/theme';
import { differenceInDays, differenceInHours } from 'date-fns';

export const TrialBanner: React.FC = () => {
  const { user } = useAppStore();

  if (user.isPaid || !user.trialEnd) return null;

  const now = new Date();
  const trialEnd = new Date(user.trialEnd);
  const daysLeft = differenceInDays(trialEnd, now);
  const hoursLeft = differenceInHours(trialEnd, now) % 24;

  if (daysLeft < 0) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        Trial: {daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''}` : `${hoursLeft}h`} left
      </Text>
    </View>
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