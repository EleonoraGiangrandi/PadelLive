import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { PlayerRanking } from '../../types/models';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { decodeHtmlEntities } from '../../utils/text';
import { FavoriteStar } from '../common/FavoriteStar';
import { useFavoritesStore } from '../../store/useFavoritesStore';

interface PlayerRowProps {
  player: PlayerRanking;
  onPress: () => void;
  isFavoriteView?: boolean;
  onRemove?: () => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  onPress,
  isFavoriteView = false,
  onRemove,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);

  const delta = player.rankDelta || 0;
  const decodedName = decodeHtmlEntities(player.name);
  const decodedCountry = decodeHtmlEntities(player.country);

  const handleRemovePress = () => {
    if (onRemove) {
      onRemove();
    } else {
      removeFavorite(player.id || (player as any).handler || player.name);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainTouchable}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.rankCol}>
          <Text style={styles.position}>{player.position || '-'}</Text>
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

        {/* Only show points when not in favorites view */}
        {!isFavoriteView && (
          <View style={styles.pointsCol}>
            <Text style={styles.points}>{player.points}</Text>
            <Text style={styles.pointsLabel}>PTS</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Quick action: Remove button in favorites, Star in rankings */}
      {isFavoriteView ? (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={handleRemovePress}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.removeBadge}>
            <X size={13} color="#ef4444" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      ) : (
        <FavoriteStar player={player} size={22} style={styles.starWrap} />
      )}
    </View>
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
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    mainTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rankCol: {
      width: 36,
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
    starWrap: {
      marginLeft: theme.spacing.sm,
      paddingHorizontal: 4,
    },
    removeBtn: {
      marginLeft: theme.spacing.sm,
      padding: 4,
    },
    removeBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeText: {
      color: theme.colors.live,
      fontSize: 13,
      fontWeight: '700',
    },
  });
