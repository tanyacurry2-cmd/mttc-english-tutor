import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sound types
export type SoundType = 'correct' | 'incorrect' | 'celebration' | 'epic';

// Sound URLs (placeholder - using free sounds from web)
const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Short success beep
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3', // Error buzz
  celebration: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Celebration fanfare
  epic: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Epic celebration
};

class SoundManager {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private soundEnabled: boolean = true;
  private initialized: boolean = false;

  /**
   * Initialize sound manager and load user preference
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Set audio mode for mobile
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load sound preference
      const savedPref = await AsyncStorage.getItem('soundEnabled');
      this.soundEnabled = savedPref !== 'false'; // Default to true

      this.initialized = true;
      console.log('SoundManager initialized, sound enabled:', this.soundEnabled);
    } catch (error) {
      console.error('Failed to initialize SoundManager:', error);
    }
  }

  /**
   * Load a specific sound
   */
  private async loadSound(type: SoundType): Promise<void> {
    if (this.sounds.has(type)) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: SOUNDS[type] },
        { shouldPlay: false }
      );
      this.sounds.set(type, sound);
    } catch (error) {
      console.error(`Failed to load sound: ${type}`, error);
    }
  }

  /**
   * Play a sound
   */
  async play(type: SoundType): Promise<void> {
    if (!this.soundEnabled) return;
    if (!this.initialized) await this.initialize();

    try {
      // Load sound if not loaded
      if (!this.sounds.has(type)) {
        await this.loadSound(type);
      }

      const sound = this.sounds.get(type);
      if (sound) {
        // Reset to beginning and play
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.error(`Failed to play sound: ${type}`, error);
    }
  }

  /**
   * Toggle sound on/off
   */
  async toggleSound(): Promise<boolean> {
    this.soundEnabled = !this.soundEnabled;
    await AsyncStorage.setItem('soundEnabled', String(this.soundEnabled));
    console.log('Sound toggled:', this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Get current sound state
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Set sound state
   */
  async setSoundEnabled(enabled: boolean): Promise<void> {
    this.soundEnabled = enabled;
    await AsyncStorage.setItem('soundEnabled', String(enabled));
  }

  /**
   * Unload all sounds (cleanup)
   */
  async unloadAll(): Promise<void> {
    for (const [type, sound] of this.sounds) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Failed to unload sound: ${type}`, error);
      }
    }
    this.sounds.clear();
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
