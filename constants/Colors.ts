/**
 * Fun and colorful theme for Speech Coach App
 * Using vibrant, speech-themed colors that are energetic and encouraging
 */

// Primary colors - clean purple theme
const primaryPurple = '#8B5CF6';    // Main brand color
const secondaryPurple = '#7C3AED';  // Secondary purple
const accentPurple = '#A855F7';     // Accent purple
const lightPurple = '#C4B5FD';      // Light purple

// Light theme colors
const lightBackground = '#FFFFFF';
const lightSurface = '#FFFFFF';
const lightCardBg = '#FFFFFF';
const darkText = '#1E293B';
const lightGray = '#64748B';

// Dark theme colors  
const darkBackground = '#0F172A';
const darkSurface = '#1E293B';
const darkCardBg = '#334155';
const lightText = '#F1F5F9';
const darkGray = '#94A3B8';

export const Colors = {
  light: {
    text: darkText,
    textSecondary: lightGray,
    background: lightBackground,
    surface: lightSurface,
    cardBackground: lightCardBg,
    tint: primaryPurple,
    accent: accentPurple,
    secondary: secondaryPurple,
    tertiary: lightPurple,
    icon: lightGray,
    tabIconDefault: lightGray,
    tabIconSelected: primaryPurple,
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    // Gradient colors
    gradientStart: primaryPurple,
    gradientEnd: secondaryPurple,
    accentGradientStart: accentPurple,
    accentGradientEnd: lightPurple,
  },
  dark: {
    text: lightText,
    textSecondary: darkGray,
    background: darkBackground,
    surface: darkSurface,
    cardBackground: darkCardBg,
    tint: primaryPurple,
    accent: accentPurple,
    secondary: secondaryPurple,
    tertiary: lightPurple,
    icon: darkGray,
    tabIconDefault: darkGray,
    tabIconSelected: primaryPurple,
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    // Gradient colors
    gradientStart: primaryPurple,
    gradientEnd: secondaryPurple,
    accentGradientStart: accentPurple,
    accentGradientEnd: lightPurple,
  },
};
