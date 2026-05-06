import { Audio } from 'expo-av';

const SOUNDS = {
  tap: require('../assets/sounds/tap.wav'),
  pop: require('../assets/sounds/pop.wav'),
  boop: require('../assets/sounds/boop.wav'),
  correct: require('../assets/sounds/correct.mp3'),
  incorrect: require('../assets/sounds/incorrect.mp3'),
  victory: require('../assets/sounds/victory.mp3'),
  complete: require('../assets/sounds/complete.mp3'),
};

export async function playSound(name: keyof typeof SOUNDS) {
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
