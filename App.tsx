import React, { useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePreferencesStore } from './src/store/usePreferencesStore';
import { useAppTheme } from './src/utils/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

function MainApp() {
  const { theme, isDark } = useAppTheme();
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.textPrimary,
        border: theme.colors.cardBorder,
        primary: theme.colors.primary,
      },
    };
  }, [isDark, theme]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <MainApp />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
