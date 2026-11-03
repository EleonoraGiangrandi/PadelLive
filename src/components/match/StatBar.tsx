import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme, AppTheme } from '../../utils/theme';

interface StatBarProps {
  label: string;
  val1?: string;
  val2?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  val1 = '0',
  val2 = '0',
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Parse numeric values if percentage or ratio (e.g., "4/7" or "65%")
  const parseNum = (str: string): number => {
    if (!str) return 0;
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(Number);
      return den > 0 ? (num / den) * 100 : 0;
    }
    const clean = parseFloat(str.replace('%', ''));
    return isNaN(clean) ? 0 : clean;
  };

  const n1 = parseNum(val1);
  const n2 = parseNum(val2);
  const total = n1 + n2;
  const pct1 = total > 0 ? (n1 / total) * 100 : 50;
  const pct2 = total > 0 ? (n2 / total) * 100 : 50;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.valueTextLeft}>{val1}</Text>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={styles.valueTextRight}>{val2}</Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFillLeft, { width: `${pct1}%` }]} />
        <View style={[styles.barFillRight, { width: `${pct2}%` }]} />
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    labelText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      flex: 1,
    },
    valueTextLeft: {
      ...theme.typography.subtitle,
      color: theme.colors.textPrimary,
      width: 60,
      textAlign: 'left',
      fontWeight: '700',
    },
    valueTextRight: {
      ...theme.typography.subtitle,
      color: theme.colors.textPrimary,
      width: 60,
      textAlign: 'right',
      fontWeight: '700',
    },
    barTrack: {
      height: 4,
      flexDirection: 'row',
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    barFillLeft: {
      height: '100%',
      backgroundColor: theme.colors.men,
      borderRadius: 2,
    },
    barFillRight: {
      height: '100%',
      backgroundColor: theme.colors.women,
      borderRadius: 2,
    },
  });
