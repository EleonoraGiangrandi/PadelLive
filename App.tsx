import React, { useEffect, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePreferencesStore } from './src/store/usePreferencesStore';
import { useNotificationStore } from './src/store/useNotificationStore';
import { useFavoritesStore } from './src/store/useFavoritesStore';
import { setupNotifications } from './src/services/notificationService';
import { useAppTheme } from './src/utils/theme';
import { RootStackParamList } from './src/types/navigation';

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
  const loadNotificationPrefs = useNotificationStore((s) => s.loadPreferences);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    // Load all persistent user preferences and set up notifications
    loadPreferences();
    loadNotificationPrefs();
    loadFavorites();
    setupNotifications();

    // Listener for when user taps a received notification
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && data.screen === 'Match' && data.eventId) {
        // If available, navigate to tournament/match
        console.log('Notification tapped for match:', data.matchId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadPreferences, loadNotificationPrefs, loadFavorites]);

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
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
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
