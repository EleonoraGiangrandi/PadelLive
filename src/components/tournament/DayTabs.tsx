import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { DayTab } from '../../utils/date';
import { useAppTheme, AppTheme } from '../../utils/theme';

interface DayTabsProps {
  tabs: DayTab[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export const DayTabs: React.FC<DayTabsProps> = ({
  tabs,
  selectedDay,
  onSelectDay,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {tabs.map((tab) => {
          const isSelected = tab.dayNumber === selectedDay;
          return (
            <TouchableOpacity
              key={tab.dayNumber}
              style={[
                styles.tab,
                isSelected && styles.tabSelected,
                tab.isToday && !isSelected && styles.tabToday,
              ]}
              onPress={() => onSelectDay(tab.dayNumber)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextSelected,
                  tab.isToday && !isSelected && styles.tabTextToday,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      height: 50,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.md,
      gap: 8,
      alignItems: 'center',
      flexDirection: 'row',
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.cardSecondary,
    },
    tabSelected: {
      backgroundColor: theme.colors.primary,
    },
    tabToday: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    tabText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    tabTextSelected: {
      color: theme.colors.white,
      fontWeight: '700',
    },
    tabTextToday: {
      color: theme.colors.primary,
    },
  });
