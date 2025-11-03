import colors from './colors';

export const theme = {
  colors: {
    // Brand Colors
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primaryLight: colors.primaryLight,
    navy: colors.navy,
    mint: colors.mint,
    mintDark: colors.mintDark,
    dark: colors.dark,
    secondary: colors.secondary,
    accent: colors.accent,
    
    // Surface Colors
    background: colors.background,
    surface: colors.surface,
    surfaceDark: colors.surfaceDark,
    border: colors.border,
    borderDark: colors.borderDark,
    
    // Text Colors
    text: colors.text,
    textSecondary: colors.textSecondary,
    textTertiary: colors.textTertiary,
    textInverse: colors.textInverse,
    
    // Semantic Colors
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
    
    // Extended Colors
    ...colors,
  },
  sports: {
    football: '#007AFF',        // Blue
    basketball: '#FF7A00',      // Orange
    tennis: '#2DDC4B',          // Green
    padel: '#00C4CC',           // Cyan
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  typography: {
    // Using typography system (fallback to system fonts if custom fonts not loaded)
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    captionMedium: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },
};

