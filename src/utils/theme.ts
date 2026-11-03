import { useMemo } from 'react';
import { usePreferencesStore, ThemeMode } from '../store/usePreferencesStore';

export const darkColors = {
  background: '#0d1117',
  card: '#161b22',
  cardSecondary: '#21262d',
  cardBorder: '#30363d',
  textPrimary: '#ffffff',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  men: '#0078c7',
  women: '#f28cd9',
  live: '#e53935',
  liveBg: '#3d1214',
  winner: '#2ea043',
  serving: '#ffd600',
  primary: '#2f81f7',
  gold: '#f0883e',
  white: '#ffffff',
  black: '#000000',
};

export const lightColors = {
  background: '#f4f6f8',
  card: '#ffffff',
  cardSecondary: '#f0f3f6',
  cardBorder: '#e1e4e8',
  textPrimary: '#1a1f2c',
  textSecondary: '#57606a',
  textMuted: '#6e7681',
  men: '#0078c7',
  women: '#d63384',
  live: '#d32f2f',
  liveBg: '#fee8e7',
  winner: '#2e7d32',
  serving: '#b08800',
  primary: '#0969da',
  gold: '#d97706',
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
};

export function getTheme(mode: ThemeMode = 'dark') {
  const colors = mode === 'light' ? lightColors : darkColors;
  return {
    isDark: mode === 'dark',
    mode,
    colors,
    spacing,
    borderRadius,
    typography: {
      title: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: colors.textPrimary,
      },
      subtitle: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: colors.textPrimary,
      },
      body: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: colors.textPrimary,
      },
      caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        color: colors.textSecondary,
      },
      badge: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: colors.textPrimary,
      },
    },
  };
}

export type AppTheme = ReturnType<typeof getTheme>;

export const theme = getTheme('dark');

export function useAppTheme() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const toggleThemeMode = usePreferencesStore((s) => s.toggleThemeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const currentTheme = useMemo(() => getTheme(themeMode), [themeMode]);

  return {
    theme: currentTheme,
    isDark: themeMode === 'dark',
    themeMode,
    toggleTheme: toggleThemeMode,
    setThemeMode,
  };
}
