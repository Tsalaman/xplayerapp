import { Platform, Vibration } from 'react-native';

/**
 * Haptic feedback utility
 * Provides tactile feedback for better UX
 */
export const haptic = {
  /**
   * Light impact haptic feedback (for tab taps, buttons)
   * Duration: 15ms
   */
  light: () => {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate(15);
      } else if (Platform.OS === 'ios') {
        // iOS uses shorter patterns for light feedback
        Vibration.vibrate(10);
      }
    } catch (error) {
      // Vibration not available (e.g., simulator)
      console.debug('Vibration not available:', error);
    }
  },

  /**
   * Medium impact haptic feedback (for important actions)
   * Duration: 25ms
   */
  medium: () => {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate(25);
      } else if (Platform.OS === 'ios') {
        Vibration.vibrate(15);
      }
    } catch (error) {
      console.debug('Vibration not available:', error);
    }
  },

  /**
   * Heavy impact haptic feedback (for errors, confirmations)
   * Duration: 50ms
   */
  heavy: () => {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate(50);
      } else if (Platform.OS === 'ios') {
        Vibration.vibrate(30);
      }
    } catch (error) {
      console.debug('Vibration not available:', error);
    }
  },
};

export default haptic;

