import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Sound instances
let successSound: Audio.Sound | null = null;
let errorSound: Audio.Sound | null = null;

// Initialize audio
export async function initializeAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.log('Error setting audio mode:', error);
  }
}

// Create simple sound using frequencies (no mp3 files needed)
export async function playSuccessSound() {
  try {
    // On web, use Web Audio API
    if (Platform.OS === 'web') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      // For native, use a pre-generated sound or URI
      // For now, we'll skip native implementation until we have actual sound files
      console.log('Success sound played (native placeholder)');
    }
  } catch (error) {
    console.log('Error playing success sound:', error);
  }
}

export async function playErrorSound() {
  try {
    if (Platform.OS === 'web') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      console.log('Error sound played (native placeholder)');
    }
  } catch (error) {
    console.log('Error playing error sound:', error);
  }
}

// Cleanup
export async function cleanupAudio() {
  try {
    if (successSound) {
      await successSound.unloadAsync();
      successSound = null;
    }
    if (errorSound) {
      await errorSound.unloadAsync();
      errorSound = null;
    }
  } catch (error) {
    console.log('Error cleaning up audio:', error);
  }
}