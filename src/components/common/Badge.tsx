import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../utils/theme';

interface BadgeProps {
  label: string;
  type?: 'live' | 'men' | 'women' | 'default' | 'gold';
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'default' }) => {
  const { theme, isDark } = useAppTheme();

  let bgColor = theme.colors.cardSecondary;
  let textColor = theme.colors.textSecondary;

  if (type === 'live') {
    bgColor = theme.colors.liveBg;
    textColor = theme.colors.live;
  } else if (type === 'men') {
    bgColor = isDark ? 'rgba(0, 120, 199, 0.15)' : 'rgba(9, 105, 218, 0.12)';
    textColor = theme.colors.men;
  } else if (type === 'women') {
    bgColor = isDark ? 'rgba(242, 140, 217, 0.15)' : 'rgba(214, 51, 132, 0.12)';
    textColor = theme.colors.women;
  } else if (type === 'gold') {
    bgColor = isDark ? 'rgba(240, 136, 62, 0.15)' : 'rgba(217, 119, 6, 0.12)';
    textColor = theme.colors.gold;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      {type === 'live' && <View style={[styles.liveDot, { backgroundColor: theme.colors.live }]} />}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
