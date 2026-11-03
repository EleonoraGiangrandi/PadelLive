import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Match, Team } from '../../types/models';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { Badge } from '../common/Badge';
import { decodeHtmlEntities } from '../../utils/text';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isWomen = match.roundName?.toLowerCase().includes('women');
  const isFinished = match.status === 'completed' || match.team1.isWinner || match.team2.isWinner;
  const isWalkover = match.status === 'walkover' || (isFinished && match.team1.set1 === '-');
  const isOngoing = match.isLive || match.status === 'live' || (!isFinished && (!!match.team1.points || !!match.team2.points || match.team1.isServing || match.team2.isServing));

  /**
   * Renderizza il punteggio di un set gestendo elegantemente il tie-break (es. "7(5)" o "6(0)")
   * senza rompere l'allineamento delle colonne della tabella.
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

  const renderTeamRow = (team: Team, isTeamWinner: boolean) => {
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
          </View>
        </View>

        {team.isServing ? (
          <View style={styles.servingIndicator}>
            <Text style={styles.servingBall}>🎾</Text>
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
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

      {match.courtName ? (
        <Text style={styles.courtName} numberOfLines={1}>
          📍 {decodeHtmlEntities(match.courtName)}
        </Text>
      ) : null}

      <View style={styles.teamsContainer}>
        {renderTeamRow(match.team1, match.team1.isWinner)}
        <View style={styles.divider} />
        {renderTeamRow(match.team2, match.team2.isWinner)}
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
      alignItems: 'flex-end',
    },
    roundText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      flex: 1,
    },
    courtName: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginBottom: 8,
      fontSize: 11,
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
    },
    servingSpacer: {
      width: 22,
    },
    servingBall: {
      fontSize: 11,
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
