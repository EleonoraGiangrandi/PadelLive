import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, Bell, MapPin, Play } from 'lucide-react-native';
import { Match, Team } from '../../types/models';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { Badge } from '../common/Badge';
import { decodeHtmlEntities } from '../../utils/text';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useNotificationStore } from '../../store/useNotificationStore';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isPlayerFavorite = useFavoritesStore((s) => s.isPlayerFavorite);
  const isFollowed = useNotificationStore((s) => s.isMatchFollowed(match.matchId));
  const toggleFollowMatch = useNotificationStore((s) => s.toggleFollowMatch);

  const isP1Fav = isPlayerFavorite(match.team1?.player1);
  const isP2Fav = isPlayerFavorite(match.team1?.player2);
  const isP3Fav = isPlayerFavorite(match.team2?.player1);
  const isP4Fav = isPlayerFavorite(match.team2?.player2);
  const hasFavorite = isP1Fav || isP2Fav || isP3Fav || isP4Fav;

  const isWomen = match.roundName?.toLowerCase().includes('women');
  const isFinished = match.status === 'completed' || match.team1.isWinner || match.team2.isWinner;
  const isWalkover = match.status === 'walkover' || (isFinished && match.team1.set1 === '-');
  const isOngoing = match.isLive || match.status === 'live' || (!isFinished && (!!match.team1.points || !!match.team2.points || match.team1.isServing || match.team2.isServing));

  /**
   * Renders the score of a set gracefully handling tie-breaks (e.g. "7(5)" or "6(0)")
   * without breaking the table column alignment.
   */
  const renderSetCell = (scoreStr?: string, isWinner?: boolean) => {
    if (!scoreStr || scoreStr === '-') {
      return (
        <View style={styles.setCellWrap}>
          <Text style={[styles.setScore, isWinner && styles.winnerScore]}>-</Text>
        </View>
      );
    }

    const clean = scoreStr.trim();
    const tbMatch = clean.match(/^(\d+)(?:\((\d+)\))?$/);

    if (tbMatch && tbMatch[2] !== undefined) {
      return (
        <View style={styles.setCellWrap}>
          <Text style={[styles.setScore, isWinner && styles.winnerScore]}>
            {tbMatch[1]}
          </Text>
          <Text style={styles.setTbScore}>
            {tbMatch[2]}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.setCellWrap}>
        <Text style={[styles.setScore, isWinner && styles.winnerScore]}>
          {clean}
        </Text>
      </View>
    );
  };

  const renderTeamRow = (
    team: Team,
    isTeamWinner: boolean,
    isFirstPlayerFav: boolean,
    isSecondPlayerFav: boolean
  ) => {
    const p1Name = decodeHtmlEntities(team.player1.name || 'TBD');
    const p2Name = decodeHtmlEntities(team.player2.name || 'TBD');

    return (
      <View style={[styles.teamRow, isTeamWinner && styles.winnerRow]}>
        <View style={styles.playersContainer}>
          <View style={styles.playerItem}>
            {team.player1.flag ? (
              <Image source={{ uri: team.player1.flag }} style={styles.flag} />
            ) : null}
            <Text
              style={[
                styles.playerName,
                isTeamWinner && styles.winnerPlayerName,
              ]}
              numberOfLines={1}
            >
              {p1Name}
            </Text>
            {isFirstPlayerFav && (
              <Star size={11} color="#f59e0b" fill="#f59e0b" style={styles.favStar} />
            )}
          </View>
          <View style={styles.playerItem}>
            {team.player2.flag ? (
              <Image source={{ uri: team.player2.flag }} style={styles.flag} />
            ) : null}
            <Text
              style={[
                styles.playerName,
                isTeamWinner && styles.winnerPlayerName,
              ]}
              numberOfLines={1}
            >
              {p2Name}
            </Text>
            {isSecondPlayerFav && (
              <Star size={11} color="#f59e0b" fill="#f59e0b" style={styles.favStar} />
            )}
          </View>
        </View>

        {team.isServing ? (
          <View style={styles.servingIndicator}>
            <View style={styles.servingDot} />
          </View>
        ) : (
          <View style={styles.servingSpacer} />
        )}

        <View style={styles.scoresContainer}>
          {renderSetCell(team.set1, isTeamWinner)}
          {renderSetCell(team.set2, isTeamWinner)}
          {renderSetCell(team.set3, isTeamWinner)}

          {isOngoing ? (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{team.points || '0'}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const roundLabel = decodeHtmlEntities(match.roundName);

  return (
    <TouchableOpacity
      style={[styles.card, hasFavorite && styles.cardWithFav]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Badge
            label={isWomen ? 'WOMEN' : 'MEN'}
            type={isWomen ? 'women' : 'men'}
          />
          <Text style={styles.roundText} numberOfLines={1}>
            {roundLabel}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.bellBtn, isFollowed && styles.bellBtnActive]}
            onPress={(e) => {
              e.stopPropagation();
              toggleFollowMatch(match.matchId);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Follow match"
          >
            <Bell
              size={15}
              color={isFollowed ? '#f59e0b' : theme.colors.textMuted}
              fill={isFollowed ? '#f59e0b' : 'none'}
            />
          </TouchableOpacity>

          {isOngoing ? (
            <Badge label="LIVE" type="live" />
          ) : isWalkover ? (
            <Badge label="WALKOVER" type="default" />
          ) : isFinished ? (
            <Text style={styles.finishedText}>FINAL</Text>
          ) : (
            <Text style={styles.scheduledText}>{match.startDate || 'TBD'}</Text>
          )}
        </View>
      </View>

      <View style={styles.metaRow}>
        {match.courtName ? (
          <View style={styles.courtNameRow}>
            <MapPin size={11} color={theme.colors.textMuted} />
            <Text style={styles.courtName} numberOfLines={1}>
              {decodeHtmlEntities(match.courtName)}
            </Text>
          </View>
        ) : <View />}

        {isOngoing && (
          <View style={styles.liveStreamBadge}>
            <Play size={9} color="#E60000" fill="#E60000" style={{ marginRight: 3 }} />
            <Text style={styles.liveStreamText}>LIVE STREAM</Text>
          </View>
        )}
      </View>

      <View style={styles.teamsContainer}>
        {renderTeamRow(match.team1, match.team1.isWinner, isP1Fav, isP2Fav)}
        <View style={styles.divider} />
        {renderTeamRow(match.team2, match.team2.isWinner, isP3Fav, isP4Fav)}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    cardWithFav: {
      borderColor: '#f59e0b55',
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
    },
    favStar: {
      color: '#f59e0b',
      fontSize: 12,
      marginLeft: 4,
    },
    bellBtn: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginRight: 6,
      opacity: 0.35,
    },
    bellBtnActive: {
      opacity: 1,
    },
    bellText: {
      fontSize: 14,
    },
    bellTextActive: {
      transform: [{ scale: 1.1 }],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    roundText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      flex: 1,
    },
    courtNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      flex: 1,
    },
    courtName: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontSize: 11,
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    liveStreamBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E6000018',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#E6000044',
    },
    liveStreamText: {
      color: '#E60000',
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    scheduledText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    finishedText: {
      ...theme.typography.badge,
      color: theme.colors.textMuted,
    },
    teamsContainer: {
      marginTop: 4,
    },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    winnerRow: {},
    playersContainer: {
      flex: 1,
      marginRight: 6,
    },
    playerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 1,
    },
    flag: {
      width: 16,
      height: 12,
      borderRadius: 2,
      marginRight: 6,
    },
    playerName: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    winnerPlayerName: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    servingIndicator: {
      width: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    servingSpacer: {
      width: 22,
    },
    servingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#a3e635', // bright vibrant tennis-ball yellow-green
    },
    scoresContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    setCellWrap: {
      minWidth: 26,
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    setScore: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    setTbScore: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textMuted,
      marginLeft: 1,
      marginTop: -6, // effetto apice elegante
    },
    winnerScore: {
      color: theme.colors.textPrimary,
      fontWeight: '800',
    },
    pointsBadge: {
      backgroundColor: theme.colors.gold,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 2,
    },
    pointsText: {
      ...theme.typography.badge,
      color: theme.colors.white,
      fontWeight: '800',
      fontSize: 10,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.cardBorder,
      marginVertical: 2,
    },
  });
