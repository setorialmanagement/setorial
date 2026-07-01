import { Audio } from 'expo-av';
import { useAuthStore } from '../store/authStore';

const SOUNDS = {
  tap: require('../assets/sounds/tap.wav'),
  pop: require('../assets/sounds/pop.wav'),
  boop: require('../assets/sounds/boop.wav'),
  correct: require('../assets/sounds/correct.wav'),
  incorrect: require('../assets/sounds/incorrect.wav'),
  victory: require('../assets/sounds/victory.wav'),
  complete: require('../assets/sounds/complete.wav'),
};

export async function playSound(name: keyof typeof SOUNDS) {
  // Respect the user's sound preference
  if (!useAuthStore.getState().soundEnabled) return;
  
  try {
    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[name],
      { shouldPlay: true, volume: 0.5 }
    );
    
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Error playing sound:', error);
  }
}
