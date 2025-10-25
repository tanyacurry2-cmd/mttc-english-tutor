import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../lib/theme';

const { width, height } = Dimensions.get('window');

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  opacity: number;
};

export const StarryBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Generate random stars
  const stars = useMemo(() => {
    const starArray: Star[] = [];
    const numStars = 100; // Number of stars
    
    for (let i = 0; i < numStars; i++) {
      starArray.push({
        id: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 2 + 1, // Stars between 1-3px
        opacity: Math.random() * 0.5 + 0.3, // Opacity between 0.3-0.8
      });
    }
    
    return starArray;
  }, []);

  return (
    <View style={styles.container}>
      {/* Stars layer */}
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>
      
      {/* Content layer */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
  },
  content: {
    flex: 1,
  },
});
