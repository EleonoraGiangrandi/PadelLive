import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, Check } from 'lucide-react-native';
import { DrawMatch, DrawTeam } from '../../services/drawService';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { decodeHtmlEntities } from '../../utils/text';
import { useFavoritesStore } from '../../store/useFavoritesStore';

interface DrawMatchCardProps {
  match: DrawMatch;
  onPress?: () => void;
}

export const DrawMatchCard: React.FC<DrawMatchCardProps> = ({ match, onPress }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isPlayerFavorite = useFavoritesStore((s) => s.isPlayerFavorite);

  const isT1P1Fav = isPlayerFavorite({ name: match.team1.player1.name });
  const isT1P2Fav = isPlayerFavorite({ name: match.team1.player2.name });
  const isT2P1Fav = isPlayerFavorite({ name: match.team2.player1.name });
  const isT2P2Fav = isPlayerFavorite({ name: match.team2.player2.name });
  const hasFav = isT1P1Fav || isT1P2Fav || isT2P1Fav || isT2P2Fav;

  const renderTeamRow = (team: DrawTeam, isTeam1: boolean) => {
    const isWinner = team.isWinner;
    const p1Name = decodeHtmlEntities(team.player1.name);
    const p2Name = decodeHtmlEntities(team.player2.name);
    const isP1Fav = isTeam1 ? isT1P1Fav : isT2P1Fav;
    const isP2Fav = isTeam1 ? isT1P2Fav : isT2P2Fav;

    return (
      <View style={[styles.teamRow, isWinner && styles.winnerTeamRow]}>
        <View style={styles.teamNamesCol}>
          {/* Giocatore 1 */}
          <View style={styles.playerItem}>
            {team.player1.flag ? (
              <Image source={{ uri: team.player1.flag }} style={styles.flag} />
            ) : null}
            <Text
              style={[
                styles.playerName,
                isWinner && styles.winnerPlayerText,
                p1Name === 'TBD' && styles.tbdText,
              ]}
              numberOfLines={1}
            >
              {p1Name}
            </Text>
            {isP1Fav && (
              <Star size={11} color="#f59e0b" fill="#f59e0b" style={styles.favStar} />
            )}
          </View>

          {/* Giocatore 2 */}
          {p2Name && p2Name !== 'TBD' ? (
            <View style={styles.playerItem}>
              {team.player2.flag ? (
                <Image source={{ uri: team.player2.flag }} style={styles.flag} />
              ) : null}
              <Text
                style={[
                  styles.playerName,
                  isWinner && styles.winnerPlayerText,
                  p2Name === 'TBD' && styles.tbdText,
                ]}
                numberOfLines={1}
              >
                {p2Name}
              </Text>
              {isP2Fav && (
                <Star size={11} color="#f59e0b" fill="#f59e0b" style={styles.favStar} />
              )}
            </View>
          ) : null}
        </View>

        {/* Testa di serie se presente */}
        {team.seed ? (
          <View style={styles.seedBadge}>
            <Text style={styles.seedText}>{team.seed}</Text>
          </View>
        ) : null}

        {/* Punteggi dei set */}
        <View style={styles.setsContainer}>
          {team.sets.length > 0 ? (
            team.sets.map((score, sIdx) => (
              <View
                key={sIdx}
                style={[styles.setCell, isWinner && styles.winnerSetCell]}
              >
                <Text
                  style={[
                    styles.setText,
                    isWinner && styles.winnerSetText,
                  ]}
                >
                  {score}
                </Text>
              </View>
            ))
          ) : isWinner ? (
            <View style={styles.winnerBadge}>
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, hasFav && styles.favCard]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.matchOrderText}>
          Match #{match.order + 1}
        </Text>
        {hasFav && (
          <View style={styles.favBadge}>
            <Star size={10} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 3 }} />
            <Text style={styles.favBadgeText}>PREFERITI</Text>
          </View>
        )}
      </View>

      {renderTeamRow(match.team1, true)}
      <View style={styles.divider} />
      {renderTeamRow(match.team2, false)}
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
      padding: 12,
      marginBottom: 10,
    },
    favCard: {
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    matchOrderText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    favBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f59e0b22',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
    },
    favBadgeText: {
      color: '#f59e0b',
      fontSize: 9,
      fontWeight: '700',
    },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderRadius: 6,
    },
    winnerTeamRow: {
      backgroundColor: 'rgba(35, 134, 54, 0.08)',
    },
    teamNamesCol: {
      flex: 1,
      marginRight: 8,
    },
    playerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 2,
    },
    flag: {
      width: 18,
      height: 12,
      borderRadius: 2,
      marginRight: 6,
    },
    playerName: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
      flexShrink: 1,
    },
    winnerPlayerText: {
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    tbdText: {
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    favStar: {
      color: '#f59e0b',
      fontSize: 11,
      marginLeft: 4,
    },
    seedBadge: {
      backgroundColor: theme.colors.cardSecondary,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 6,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    seedText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontSize: 10,
      fontWeight: '700',
    },
    setsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    setCell: {
      width: 24,
      height: 24,
      borderRadius: 4,
      backgroundColor: theme.colors.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    winnerSetCell: {
      backgroundColor: 'rgba(35, 134, 54, 0.2)',
      borderColor: 'rgba(35, 134, 54, 0.4)',
    },
    setText: {
      ...theme.typography.caption,
      color: theme.colors.textPrimary,
      fontSize: 11,
      fontWeight: '600',
    },
    winnerSetText: {
      fontWeight: '800',
      color: '#2ea44f',
    },
    winnerBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    checkIcon: {
      color: '#2ea44f',
      fontWeight: 'bold',
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.cardBorder,
      marginVertical: 4,
    },
  });
