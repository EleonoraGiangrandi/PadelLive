import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Calendar } from 'lucide-react-native';
import { FipEvent } from '../../types/models';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { Badge } from '../common/Badge';
import { isEventOngoing, formatDateRange } from '../../utils/date';
import { decodeHtmlEntities } from '../../utils/text';

interface TournamentCardProps {
  event: FipEvent;
  onPress: () => void;
  horizontal?: boolean;
}

/**
 * Gets high-definition image URL by removing WordPress thumbnail suffix (-212x300, -225x300)
 */
export function getHdImageUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/-\d+x\d+(\.(?:jpe?g|png|webp))/i, '$1');
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  event,
  onPress,
  horizontal = false,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const ongoing = isEventOngoing(event.startDate, event.endDate);

  const formatCategory = (type: string) => {
    switch (type) {
      case 'fip-ppt-major':
        return 'PREMIER MAJOR';
      case 'fip-ppt-p1':
        return 'PREMIER P1';
      case 'fip-pp-p2':
        return 'PREMIER P2';
      case 'fip-pp-master-finals':
        return 'PREMIER FINALS';
      case 'fip-tour-platinum':
        return 'FIP PLATINUM';
      case 'fip-tour-gold':
        return 'FIP GOLD';
      case 'fip-tour-silver':
        return 'FIP SILVER';
      case 'fip-tour-bronze':
        return 'FIP BRONZE';
      default:
        return type.replace(/^fip-/, '').replace(/-/g, ' ').toUpperCase();
    }
  };

  const isPremier = event.type.startsWith('fip-pp') || event.type.includes('premier');
  const isGoldOrPlatinum = event.type.includes('gold') || event.type.includes('platinum');
  const badgeType = ongoing
    ? 'live'
    : isPremier
    ? 'gold'
    : isGoldOrPlatinum
    ? 'gold'
    : 'default';

  const dateLabel = formatDateRange(event.startDate, event.endDate);
  const hdImage = getHdImageUrl(event.cover);
  const eventName = decodeHtmlEntities(event.name);
  const eventLocation = decodeHtmlEntities(event.location);

  // Horizontal layout (e.g. carousel)
  if (horizontal) {
    return (
      <TouchableOpacity
        style={styles.cardHorizontal}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.horizontalPosterWrap}>
          {hdImage ? (
            <Image
              source={{ uri: hdImage }}
              style={styles.horizontalPoster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.horizontalPoster, styles.placeholder]}>
              <Text style={styles.placeholderText}>PADEL</Text>
            </View>
          )}
          <View style={styles.badgeTopLeft}>
            {ongoing ? (
              <Badge label="LIVE" type="live" />
            ) : (
              <Badge label={formatCategory(event.type)} type={badgeType} />
            )}
          </View>
        </View>

        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalName} numberOfLines={2}>
            {eventName}
          </Text>

          <View style={styles.metaRow}>
            <MapPin size={11} color={theme.colors.textSecondary} />
            <Text style={styles.horizontalLocation} numberOfLines={1}>
              {eventLocation || 'Location TBA'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Calendar size={11} color={theme.colors.primary} />
            <Text style={styles.horizontalDates} numberOfLines={1}>
              {dateLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Main vertical list layout
  return (
    <TouchableOpacity
      style={styles.cardVertical}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.verticalPosterWrap}>
        {hdImage ? (
          <Image
            source={{ uri: hdImage }}
            style={styles.verticalPoster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.verticalPoster, styles.placeholder]}>
            <Text style={styles.placeholderText}>PADEL</Text>
          </View>
        )}
        {ongoing && (
          <View style={styles.liveIndicatorChip}>
            <Text style={styles.liveIndicatorText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.verticalContent}>
        <View style={styles.categoryRow}>
          <Badge label={formatCategory(event.type)} type={badgeType} />
        </View>

        <Text style={styles.verticalName} numberOfLines={2}>
          {eventName}
        </Text>

        <View style={styles.metaRow}>
          <MapPin size={11} color={theme.colors.textSecondary} />
          <Text style={styles.verticalLocation} numberOfLines={1}>
            {eventLocation || 'Location TBA'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Calendar size={11} color={theme.colors.primary} />
          <Text style={styles.verticalDates} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    // --- VERTICAL LIST CARD (Poster sinistro 3:4, Contenuto destro) ---
    cardVertical: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      padding: 10,
      alignItems: 'center',
    },
    verticalPosterWrap: {
      position: 'relative',
      width: 90,
      height: 125,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
      backgroundColor: theme.colors.cardSecondary,
    },
    verticalPoster: {
      width: '100%',
      height: '100%',
    },
    liveIndicatorChip: {
      position: 'absolute',
      top: 4,
      left: 4,
      backgroundColor: theme.colors.live,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    liveIndicatorText: {
      color: '#ffffff',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    verticalContent: {
      flex: 1,
      marginLeft: 14,
      justifyContent: 'center',
    },
    categoryRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    verticalName: {
      ...theme.typography.title,
      fontSize: 15,
      color: theme.colors.textPrimary,
      marginBottom: 6,
      lineHeight: 20,
      fontWeight: '700',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 3,
    },
    verticalLocation: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      fontSize: 13,
      flex: 1,
    },
    verticalDates: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
      flex: 1,
    },

    // --- HORIZONTAL CAROUSEL CARD ---
    cardHorizontal: {
      width: 175,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      marginRight: theme.spacing.md,
      overflow: 'hidden',
    },
    horizontalPosterWrap: {
      position: 'relative',
      width: '100%',
      height: 210, // Proporzione 3:4 per locandina verticale completa
      backgroundColor: theme.colors.cardSecondary,
    },
    horizontalPoster: {
      width: '100%',
      height: '100%',
    },
    badgeTopLeft: {
      position: 'absolute',
      top: 8,
      left: 8,
    },
    horizontalContent: {
      padding: 10,
    },
    horizontalName: {
      ...theme.typography.title,
      fontSize: 13,
      color: theme.colors.textPrimary,
      marginBottom: 4,
      lineHeight: 18,
      fontWeight: '700',
    },
    horizontalLocation: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontSize: 11,
      marginBottom: 2,
    },
    horizontalDates: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 11,
    },

    // --- COMMON ---
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.cardSecondary,
    },
    placeholderText: {
      color: theme.colors.textMuted,
      fontWeight: '700',
      fontSize: 14,
    },
  });
