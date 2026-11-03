import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { RankingsScreen } from '../screens/RankingsScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { useAppTheme } from '../utils/theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.cardBorder,
          borderTopWidth: 1,
          height: 58 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Tornei',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🎾</Text>,
        }}
      />
      <Tab.Screen
        name="RankingsTab"
        component={RankingsScreen}
        options={{
          tabBarLabel: 'Classifiche',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🏆</Text>,
        }}
      />
      <Tab.Screen
        name="NewsTab"
        component={NewsScreen}
        options={{
          tabBarLabel: 'Notizie',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>📰</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 20,
  },
});
