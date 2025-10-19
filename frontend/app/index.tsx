import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppStore } from '../lib/store';
import { LoadingScreen } from '../components/LoadingScreen';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const loadFromStorage = useAppStore((state) => state.loadFromStorage);
  const setUser = useAppStore((state) => state.setUser);
  const checkTrialStatus = useAppStore((state) => state.checkTrialStatus);

  useEffect(() => {
    const initializeApp = async () => {
      // Load stored app state
      await loadFromStorage();

      // Check auth state
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser({ uid: user.uid, email: user.email });
          
          // Check trial status
          const hasAccess = checkTrialStatus();
          if (hasAccess) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/paywall');
          }
        } else {
          router.replace('/signup');
        }
        setChecking(false);
      });

      return () => unsubscribe();
    };

    initializeApp();
  }, []);

  if (checking) {
    return <LoadingScreen />;
  }

  return <LoadingScreen />;
}
