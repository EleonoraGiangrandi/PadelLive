import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { PlayerRanking } from '../../types/models';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { decodeHtmlEntities } from '../../utils/text';

interface PlayerRowProps {
  player: PlayerRanking;
  onPress: () => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({ player, onPress }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const delta = player.rankDelta || 0;
  const decodedName = decodeHtmlEntities(player.name);
  const decodedCountry = decodeHtmlEntities(player.country);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rankCol}>
        <Text style={styles.position}>{player.position}</Text>
        {delta > 0 ? (
          <Text style={styles.deltaUp}>+{delta}</Text>
        ) : delta < 0 ? (
          <Text style={styles.deltaDown}>-{Math.abs(delta)}</Text>
        ) : (
          <Text style={styles.deltaEqual}>=</Text>
        )}
      </View>

      <View style={styles.avatarContainer}>
        {player.image ? (
          <Image source={{ uri: player.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.placeholderAvatarText}>
              {decodedName.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={1}>
          {decodedName}
        </Text>
        <View style={styles.countryRow}>
          {player.flag ? (
            <Image source={{ uri: player.flag }} style={styles.flag} />
          ) : null}
          <Text style={styles.countryName}>{decodedCountry || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.pointsCol}>
        <Text style={styles.points}>{player.points}</Text>
        <Text style={styles.pointsLabel}>PTS</Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    rankCol: {
      width: 38,
      alignItems: 'center',
    },
    position: {
      ...theme.typography.subtitle,
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    deltaUp: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.winner,
    },
    deltaDown: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.live,
    },
    deltaEqual: {
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    avatarContainer: {
      marginHorizontal: theme.spacing.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.cardSecondary,
    },
    placeholderAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderAvatarText: {
      color: theme.colors.textSecondary,
      fontSize: 18,
      fontWeight: '700',
    },
    infoCol: {
      flex: 1,
      marginLeft: 4,
    },
    name: {
      ...theme.typography.subtitle,
      color: theme.colors.textPrimary,
      fontSize: 15,
      marginBottom: 2,
    },
    countryRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flag: {
      width: 16,
      height: 12,
      borderRadius: 2,
      marginRight: 6,
    },
    countryName: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    pointsCol: {
      alignItems: 'flex-end',
      marginLeft: theme.spacing.sm,
    },
    points: {
      ...theme.typography.subtitle,
      color: theme.colors.gold,
      fontWeight: '700',
      fontSize: 15,
    },
    pointsLabel: {
      fontSize: 10,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
  });
