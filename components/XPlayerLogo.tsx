import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../constants/theme';

interface XPlayerLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
  textColor?: string;
  style?: ViewStyle;
}

export default function XPlayerLogo({
  size = 48,
  color = theme.colors.navy,
  showText = false,
  textColor = theme.colors.mint,
  style,
}: XPlayerLogoProps) {
  const iconSize = showText ? size : size;
  const textSize = size * 0.55;

  return (
    <View style={[styles.container, style]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 100 100">
        {/* Navy Circle Background */}
        <Circle cx="50" cy="50" r="50" fill={color} />
        
        {/* Two symmetrical vertical curved lines forming X/A shape - like ball seams */}
        {/* Left curve - vertical, curving inward toward center */}
        <Path
          d="M 25 15 Q 50 35, 50 50 Q 50 65, 25 85"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Right curve - vertical, curving inward toward center */}
        <Path
          d="M 75 15 Q 50 35, 50 50 Q 50 65, 75 85"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Third thinner curved line - swirl effect from top-left sweeping down-right then curving up to bottom-right */}
        <Path
          d="M 15 20 Q 30 40, 40 60 Q 60 75, 80 80"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
      </Svg>
      
      {showText && (
        <Text style={[styles.logoText, { color: textColor, fontSize: textSize }]}>
          player
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoText: {
    fontFamily: 'System',
    fontWeight: '700',
    letterSpacing: -0.3,
    fontStyle: 'normal',
  },
});
