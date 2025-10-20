import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '../components/LoadingScreen';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Route to welcome screen on app launch
    router.replace('/welcome');
  }, []);

  return <LoadingScreen />;
}
