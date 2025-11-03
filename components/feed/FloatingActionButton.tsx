import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import haptic from '../../utils/haptic';

/**
 * Floating Action Button for creating new posts
 * - Sticky floating button with "+" icon
 * - Mint hover color
 * - Subtle animation
 */
export default function FloatingActionButton() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shadowAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shadowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handlePress = () => {
    haptic.light();
    
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    router.push('/post/create');
  };

  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [0.25, 0.35],
  });

  const shadowRadius = shadowAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [16, 20],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          shadowOpacity,
          shadowRadius,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.button}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[theme.colors.navy, theme.colors.mint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Ionicons name="add" size={32} color={theme.colors.surface} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

