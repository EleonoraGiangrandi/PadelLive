import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ChevronLeft,
  MapPin,
  Clock,
  BarChart2,
} from 'lucide-react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMatchStats, getMatches } from '../api/events';
import { RootStackParamList } from '../types/navigation';
import { StatsResponse, StatsGroup, Match } from '../types/models';
import { useAppTheme, AppTheme } from '../utils/theme';
import { Badge } from '../components/common/Badge';
import { StatBar } from '../components/match/StatBar';
import { LiveStreamButton } from '../components/match/LiveStreamButton';
import { WhereToWatchModal } from '../components/common/WhereToWatchModal';
import { decodeHtmlEntities } from '../utils/text';
import { useTranslation } from '../i18n';

type RouteProps = RouteProp<RootStackParamList, 'Match'>;

type TabKey = 'match' | 'set1' | 'set2' | 'set3';

export const MatchScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const { match, event, day } = route.params;

  const [activeTab, setActiveTab] = useState<TabKey>('match');
  const [showWhereToWatch, setShowWhereToWatch] = useState(false);

  // Fetch live updates for the match schedule every 10 seconds
  const { data: dayMatches } = useQuery<Match[]>({
    queryKey: ['matches', event.eventId || event.id, day],
    queryFn: () => getMatches(event.eventId || event.id, day || 1),
    refetchInterval: 10000,
    enabled: !!event.eventId || !!event.id,
  });

  const currentMatch = dayMatches?.find((m) => m.matchId === match.matchId) || match;

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery<StatsResponse>({
    queryKey: ['matchStats', currentMatch.matchId, event.eventId],
    queryFn: () => getMatchStats(currentMatch.matchId, event.eventId || ''),
    enabled: !!currentMatch.matchId && !!event.eventId,
    refetchInterval: 15000, // Refresh stats every 15s during live match
  });

  const isWomen = currentMatch.roundName?.toLowerCase().includes('women');
  const isFinished = currentMatch.status === 'completed' || currentMatch.team1.isWinner || currentMatch.team2.isWinner;
  const isWalkover = currentMatch.status === 'walkover' || (isFinished && currentMatch.team1.set1 === '-');
  const isOngoing = currentMatch.isLive || currentMatch.status === 'live' || (!isFinished && (!!currentMatch.team1.points || !!currentMatch.team2.points || currentMatch.team1.isServing || currentMatch.team2.isServing));

  // Get active statistics group for the selected tab
  const activeStatsGroup1: StatsGroup | undefined =
    activeTab === 'match'
      ? stats?.match?.team1Stats
      : activeTab === 'set1'
      ? stats?.set1?.team1Stats
      : activeTab === 'set2'
      ? stats?.set2?.team1Stats
      : stats?.set3?.team1Stats;

  const activeStatsGroup2: StatsGroup | undefined =
    activeTab === 'match'
      ? stats?.match?.team2Stats
      : activeTab === 'set1'
      ? stats?.set1?.team2Stats
      : activeTab === 'set2'
      ? stats?.set2?.team2Stats
      : stats?.set3?.team2Stats;

  const hasStats =
    activeStatsGroup1?.serve?.aces !== undefined ||
    activeStatsGroup1?.match?.totalPointsWon !== undefined;

  const renderSetCell = (scoreStr?: string, isWinner?: boolean) => {
    if (!scoreStr || scoreStr === '-') {
      return (
        <View style={styles.setScoreCell}>
          <Text style={[styles.setScoreText, isWinner && styles.winnerScoreText]}>-</Text>
        </View>
      );
    }

    const clean = scoreStr.trim();
    const tbMatch = clean.match(/^(\d+)(?:\((\d+)\))?$/);

    if (tbMatch && tbMatch[2] !== undefined) {
      return (
        <View style={styles.setScoreCell}>
          <Text style={[styles.setScoreText, isWinner && styles.winnerScoreText]}>
            {tbMatch[1]}
          </Text>
          <Text style={styles.setTbText}>
            {tbMatch[2]}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.setScoreCell}>
        <Text style={[styles.setScoreText, isWinner && styles.winnerScoreText]}>
          {clean}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Match Header Card */}
        <View style={styles.matchCard}>
          <View style={styles.matchMetaRow}>
            <Badge
              label={isWomen ? 'WOMEN' : 'MEN'}
              type={isWomen ? 'women' : 'men'}
            />
            <Text style={styles.roundText}>{decodeHtmlEntities(currentMatch.roundName)}</Text>
            {isOngoing ? (
              <Badge label="LIVE" type="live" />
            ) : isFinished ? (
              <Text style={styles.finalText}>FINAL</Text>
            ) : (
              <Text style={styles.timeText}>{currentMatch.startDate}</Text>
            )}
          </View>

          {currentMatch.courtName ? (
            <View style={styles.courtRow}>
              <MapPin size={11} color={theme.colors.textMuted} />
              <Text style={styles.courtText}>{decodeHtmlEntities(currentMatch.courtName)}</Text>
            </View>
          ) : null}

          {/* Teams Table */}
          <View style={styles.scoreboardTable}>
            {/* Header Columns */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.teamHeaderCell}>TEAMS</Text>
              <Text style={styles.setColHeader}>S1</Text>
              <Text style={styles.setColHeader}>S2</Text>
              <Text style={styles.setColHeader}>S3</Text>
              {isOngoing && <Text style={styles.ptsColHeader}>PTS</Text>}
            </View>

            {/* Team 1 Row */}
            <View
              style={[
                styles.teamRow,
                currentMatch.team1.isWinner && styles.winnerTeamRow,
              ]}
            >
              <View style={styles.teamNamesCol}>
                <View style={styles.playerItem}>
                  {currentMatch.team1.player1.flag ? (
                    <Image
                      source={{ uri: currentMatch.team1.player1.flag }}
                      style={styles.flag}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.playerName,
                      currentMatch.team1.isWinner && styles.winnerPlayerText,
                    ]}
                    numberOfLines={1}
                  >
                    {decodeHtmlEntities(currentMatch.team1.player1.name)}
                  </Text>
                </View>
                <View style={styles.playerItem}>
                  {currentMatch.team1.player2.flag ? (
                    <Image
                      source={{ uri: currentMatch.team1.player2.flag }}
                      style={styles.flag}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.playerName,
                      currentMatch.team1.isWinner && styles.winnerPlayerText,
                    ]}
                    numberOfLines={1}
                  >
                    {decodeHtmlEntities(currentMatch.team1.player2.name)}
                  </Text>
                </View>
              </View>

              {currentMatch.team1.isServing ? (
                <View style={styles.servingDot} />
              ) : (
                <View style={styles.servingPlaceholder} />
              )}

              {renderSetCell(currentMatch.team1.set1, currentMatch.team1.isWinner)}
              {renderSetCell(currentMatch.team1.set2, currentMatch.team1.isWinner)}
              {renderSetCell(currentMatch.team1.set3, currentMatch.team1.isWinner)}
              {isOngoing && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsValue}>
                    {currentMatch.team1.points || '0'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Team 2 Row */}
            <View
              style={[
                styles.teamRow,
                currentMatch.team2.isWinner && styles.winnerTeamRow,
              ]}
            >
              <View style={styles.teamNamesCol}>
                <View style={styles.playerItem}>
                  {currentMatch.team2.player1.flag ? (
                    <Image
                      source={{ uri: currentMatch.team2.player1.flag }}
                      style={styles.flag}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.playerName,
                      currentMatch.team2.isWinner && styles.winnerPlayerText,
                    ]}
                    numberOfLines={1}
                  >
                    {decodeHtmlEntities(currentMatch.team2.player1.name)}
                  </Text>
                </View>
                <View style={styles.playerItem}>
                  {currentMatch.team2.player2.flag ? (
                    <Image
                      source={{ uri: currentMatch.team2.player2.flag }}
                      style={styles.flag}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.playerName,
                      currentMatch.team2.isWinner && styles.winnerPlayerText,
                    ]}
                    numberOfLines={1}
                  >
                    {decodeHtmlEntities(currentMatch.team2.player2.name)}
                  </Text>
                </View>
              </View>

              {currentMatch.team2.isServing ? (
                <View style={styles.servingDot} />
              ) : (
                <View style={styles.servingPlaceholder} />
              )}

              {renderSetCell(currentMatch.team2.set1, currentMatch.team2.isWinner)}
              {renderSetCell(currentMatch.team2.set2, currentMatch.team2.isWinner)}
              {renderSetCell(currentMatch.team2.set3, currentMatch.team2.isWinner)}
              {isOngoing && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsValue}>
                    {currentMatch.team2.points || '0'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {stats?.duration ? (
            <View style={styles.durationRow}>
              <Clock size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.durationText}>{t.match.duration}: {stats.duration}</Text>
            </View>
          ) : null}
        </View>

        {/* Live Stream & Where to Watch Actions */}
        <LiveStreamButton
          event={event}
          match={currentMatch}
          onPressWhereToWatch={() => setShowWhereToWatch(true)}
        />

        {/* Set Selector Tabs */}
        <View style={styles.tabsRow}>
          {[
            { key: 'match', label: 'MATCH' },
            { key: 'set1', label: 'SET 1' },
            { key: 'set2', label: 'SET 2' },
            { key: 'set3', label: 'SET 3' },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key as TabKey)}
              >
                <Text
                  style={[styles.tabText, isSelected && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Statistics Body */}
        {isLoading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.statsLoadingText}>
              {t.common?.loading || 'Loading...'}
            </Text>
          </View>
        ) : !hasStats ? (
          <View style={styles.statsEmpty}>
            <BarChart2 size={38} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.statsEmptyTitle}>{t.match.stats}</Text>
            <Text style={styles.statsEmptyDesc}>{t.match.noStats}</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {/* SERVE */}
            <Text style={styles.statsSectionHeader}>{t.match.serve.toUpperCase()}</Text>
            <StatBar
              label="Aces"
              val1={activeStatsGroup1?.serve?.aces}
              val2={activeStatsGroup2?.serve?.aces}
            />
            <StatBar
              label="Double Faults"
              val1={activeStatsGroup1?.serve?.doubleFaults}
              val2={activeStatsGroup2?.serve?.doubleFaults}
            />
            <StatBar
              label="Service Games"
              val1={activeStatsGroup1?.serve?.serviceGames}
              val2={activeStatsGroup2?.serve?.serviceGames}
            />
            <StatBar
              label="1st Serve Points Won"
              val1={activeStatsGroup1?.serve?.wonOnFirstServe}
              val2={activeStatsGroup2?.serve?.wonOnFirstServe}
            />
            <StatBar
              label="2nd Serve Points Won"
              val1={activeStatsGroup1?.serve?.wonOnSecondServe}
              val2={activeStatsGroup2?.serve?.wonOnSecondServe}
            />

            {/* RETURN */}
            <Text style={styles.statsSectionHeader}>{t.match.return.toUpperCase()}</Text>
            <StatBar
              label="Return Games"
              val1={activeStatsGroup1?.returnStats?.returnGames}
              val2={activeStatsGroup2?.returnStats?.returnGames}
            />
            <StatBar
              label="1st Return Points Won"
              val1={activeStatsGroup1?.returnStats?.wonOnFirstReturn}
              val2={activeStatsGroup2?.returnStats?.wonOnFirstReturn}
            />
            <StatBar
              label="2nd Return Points Won"
              val1={activeStatsGroup1?.returnStats?.wonOnSecondReturn}
              val2={activeStatsGroup2?.returnStats?.wonOnSecondReturn}
            />

            {/* POINTS */}
            <Text style={styles.statsSectionHeader}>{t.match.points.toUpperCase()}</Text>
            <StatBar
              label="Break Points Converted"
              val1={activeStatsGroup1?.match?.breakingPointsConverted}
              val2={activeStatsGroup2?.match?.breakingPointsConverted}
            />
            <StatBar
              label="Longest Point Streak"
              val1={activeStatsGroup1?.match?.longestStreak}
              val2={activeStatsGroup2?.match?.longestStreak}
            />
            <StatBar
              label="Total Points Won"
              val1={activeStatsGroup1?.match?.totalPointsWon}
              val2={activeStatsGroup2?.match?.totalPointsWon}
            />
            <StatBar
              label="Total Won on Serve"
              val1={activeStatsGroup1?.totalPoints?.totalWonOnServe}
              val2={activeStatsGroup2?.totalPoints?.totalWonOnServe}
            />
            <StatBar
              label="Total Won on Return"
              val1={activeStatsGroup1?.totalPoints?.totalWonOnReturn}
              val2={activeStatsGroup2?.totalPoints?.totalWonOnReturn}
            />
          </View>
        )}
      </ScrollView>

      <WhereToWatchModal
        visible={showWhereToWatch}
        onClose={() => setShowWhereToWatch(false)}
      />
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  topBarTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  matchCard: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roundText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  finalText: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
  },
  courtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  courtText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  scoreboardTable: {
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  teamHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  setColHeader: {
    width: 24,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  ptsColHeader: {
    width: 32,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.gold,
    textAlign: 'center',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  winnerTeamRow: {},
  teamNamesCol: {
    flex: 1,
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
  winnerPlayerText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  servingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#a3e635',
    marginHorizontal: 6,
  },
  servingPlaceholder: {
    width: 19,
  },
  setScoreCell: {
    minWidth: 26,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setScoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  setTbText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginLeft: 1,
    marginTop: -6,
  },
  winnerScoreText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  pointsBadge: {
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  pointsValue: {
    ...theme.typography.badge,
    color: theme.colors.white,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.cardBorder,
    marginVertical: 2,
  },
  durationRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  statsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  statsLoadingText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  statsEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statsEmptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  statsEmptyTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statsEmptyDesc: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
  },
  statsSectionHeader: {
    ...theme.typography.badge,
    color: theme.colors.primary,
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
});
