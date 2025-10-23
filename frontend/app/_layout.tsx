import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="objective-study" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}