import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface CelebrationModalProps {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  streak,
  onClose,
}) => {
  const scaleAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-close after 2.5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getMessage = () => {
    if (streak === 5) return "Great Job! 🎉";
    if (streak === 10) return "Awesome! 🌟";
    if (streak === 20) return "Unstoppable! 🏆";
    return "Keep Going!";
  };

  const getSubMessage = () => {
    if (streak === 5) return "5 correct answers in a row!";
    if (streak === 10) return "10 correct answers in a row!";
    if (streak === 20) return "20 correct answers in a row!";
    return `${streak} correct!`;
  };

  const getIcon = () => {
    if (streak === 20) return "trophy";
    if (streak === 10) return "star";
    return "fire";
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }, { rotate }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={getIcon()}
            size={80}
            color={theme.colors.accent}
          />
          <Text style={styles.title}>{getMessage()}</Text>
          <Text style={styles.subtitle}>{getSubMessage()}</Text>
          
          {/* Confetti effect */}
          <View style={styles.confettiContainer}>
            {[...Array(10)].map((_, i) => (
              <Text key={i} style={[styles.confetti, { left: `${i * 10}%` }]}>
                🎊
              </Text>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    fontSize: 24,
    top: -30,
  },
});
