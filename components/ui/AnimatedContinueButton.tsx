import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface AnimatedContinueButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export default function AnimatedContinueButton({
  onPress,
  loading = false,
}: AnimatedContinueButtonProps) {
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous animation for arrow
    const animateArrow = () => {
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!loading) {
          animateArrow();
        }
      });
    };

    if (!loading) {
      animateArrow();
    }
  }, [loading]);

  const arrowTranslateX = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={[theme.colors.mint, theme.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.text}>Continue</Text>
        <Animated.View
          style={[
            styles.arrowContainer,
            { transform: [{ translateX: arrowTranslateX }] },
          ]}
        >
          <Ionicons name="arrow-forward" size={20} color={theme.colors.navy} />
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
    gap: theme.spacing.sm,
  },
  text: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    fontWeight: '600',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

