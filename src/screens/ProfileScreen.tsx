import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPlayerProfile } from '../api/rankings';
import { PlayerRanking, PlayerProfile } from '../types/models';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme, AppTheme } from '../utils/theme';
import { decodeHtmlEntities } from '../utils/text';
import { FavoriteStar } from '../components/common/FavoriteStar';
import { useTranslation } from '../i18n';

type RouteProps = RouteProp<RootStackParamList, 'Profile'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();
  const { player } = route.params;

  const handler =
    player.handler ||
    player.name.toLowerCase().replace(/\s+/g, '-');

  const { data: profile, isLoading } = useQuery<PlayerProfile>({
    queryKey: ['playerProfile', handler],
    queryFn: () => getPlayerProfile(handler),
    enabled: !!handler,
  });

  const delta = player.rankDelta || 0;

  const handleSelectPartner = (partnerHandler: string, partnerName: string) => {
    const partnerRanking: PlayerRanking = {
      id: partnerHandler,
      name: partnerName,
      position: 0,
      points: 0,
      country: '',
      flag: '',
      image: profile?.partner?.imageUrl || '',
      handler: partnerHandler,
    };
    navigation.push('Profile', { player: partnerRanking });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t.profile.title}</Text>
        <FavoriteStar player={player} size={24} style={styles.topBarStar} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarRow}>
            {player.image || profile?.imageUrl ? (
              <Image
                source={{ uri: player.image || profile?.imageUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{player.name.charAt(0)}</Text>
              </View>
            )}

            <View style={styles.nameCol}>
              <Text style={styles.playerName}>{decodeHtmlEntities(player.name)}</Text>
              <View style={styles.countryRow}>
                {player.flag ? (
                  <Image source={{ uri: player.flag }} style={styles.flag} />
                ) : null}
                <Text style={styles.countryText}>
                  {decodeHtmlEntities(player.country || profile?.country || 'Internazionale')}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{t.profile.fipRank}</Text>
              <View style={styles.rankWithDelta}>
                <Text style={styles.metricValue}>
                  #{profile?.rank || player.position || '-'}
                </Text>
                {delta > 0 && <Text style={styles.deltaUp}>+{delta}</Text>}
                {delta < 0 && <Text style={styles.deltaDown}>-{Math.abs(delta)}</Text>}
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{t.profile.points}</Text>
              <Text style={[styles.metricValue, { color: theme.colors.gold }]}>
                {profile?.points || player.points || '-'}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{t.profile.bestRank}</Text>
              <Text style={styles.metricValue}>
                #{profile?.stats?.bestRank || '-'}
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loaderText}>{t.profile.loading}</Text>
          </View>
        ) : (
          <>
            {/* Bio Details */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>{t.profile.details.toUpperCase()}</Text>
              <View style={styles.bioGrid}>
                <View style={styles.bioRow}>
                  <Text style={styles.bioLabel}>{t.profile.bornIn}</Text>
                  <Text style={styles.bioValue}>{decodeHtmlEntities(profile?.bornIn) || '-'}</Text>
                </View>
                <View style={styles.bioRow}>
                  <Text style={styles.bioLabel}>{t.profile.dob}</Text>
                  <Text style={styles.bioValue}>{profile?.dob || '-'}</Text>
                </View>
                <View style={styles.bioRow}>
                  <Text style={styles.bioLabel}>{t.profile.height}</Text>
                  <Text style={styles.bioValue}>{profile?.height || '-'}</Text>
                </View>
                <View style={styles.bioRow}>
                  <Text style={styles.bioLabel}>{t.profile.position}</Text>
                  <Text style={styles.bioValue}>
                    {decodeHtmlEntities(profile?.playingPosition) || '-'}
                  </Text>
                </View>
                <View style={styles.bioRow}>
                  <Text style={styles.bioLabel}>{t.profile.coach}</Text>
                  <Text style={styles.bioValue}>{decodeHtmlEntities(profile?.coach) || '-'}</Text>
                </View>
              </View>
            </View>

            {/* Partner */}
            {profile?.partner && (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>{t.profile.partner.toUpperCase()}</Text>
                <TouchableOpacity
                  style={styles.partnerRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    handleSelectPartner(
                      profile.partner!.handler,
                      profile.partner!.name
                    )
                  }
                >
                  {profile.partner.imageUrl ? (
                    <Image
                      source={{ uri: profile.partner.imageUrl }}
                      style={styles.partnerAvatar}
                    />
                  ) : (
                    <View style={[styles.partnerAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarLetter}>
                        {profile.partner.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.partnerInfo}>
                    <Text style={styles.partnerName}>{decodeHtmlEntities(profile.partner.name)}</Text>
                    <Text style={styles.partnerAction}>Tocca per visualizzare profilo →</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Season Statistics */}
            {profile?.stats && (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>{t.profile.stats.toUpperCase()}</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>
                      {profile.stats.matchesPlayed ?? '-'}
                    </Text>
                    <Text style={styles.statBoxLabel}>{t.profile.matchesPlayed}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxValue, { color: theme.colors.winner }]}>
                      {profile.stats.matchesWon ?? '-'}
                    </Text>
                    <Text style={styles.statBoxLabel}>{t.profile.victories}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxValue, { color: theme.colors.live }]}>
                      {profile.stats.matchesLost ?? '-'}
                    </Text>
                    <Text style={styles.statBoxLabel}>{t.profile.defeats}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxValue, { color: theme.colors.gold }]}>
                      {profile.stats.effectiveness || '-'}
                    </Text>
                    <Text style={styles.statBoxLabel}>{t.profile.winRate}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>
                      {profile.stats.consecutiveVictories ?? '-'}
                    </Text>
                    <Text style={styles.statBoxLabel}>Vittorie Consecutive</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>
                      #{profile.stats.race ?? '-'}
                    </Text>
                    <Text style={styles.statBoxLabel}>Posizione Race</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  topBarStar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    padding: theme.spacing.md,
  },
  headerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.cardSecondary,
    marginRight: theme.spacing.md,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: theme.colors.textSecondary,
    fontSize: 28,
    fontWeight: '700',
  },
  nameCol: {
    flex: 1,
  },
  playerName: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    fontSize: 20,
    marginBottom: 4,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    width: 18,
    height: 13,
    borderRadius: 2,
    marginRight: 6,
  },
  countryText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...theme.typography.badge,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  rankWithDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaUp: {
    fontSize: 10,
    color: theme.colors.winner,
    fontWeight: '700',
  },
  deltaDown: {
    fontSize: 10,
    color: theme.colors.live,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
    backgroundColor: theme.colors.cardBorder,
  },
  cardSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardSectionTitle: {
    ...theme.typography.badge,
    color: theme.colors.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bioGrid: {
    gap: 10,
  },
  bioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  bioLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  bioValue: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: theme.colors.cardSecondary,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  partnerAction: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    alignItems: 'center',
  },
  statBoxValue: {
    ...theme.typography.subtitle,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  statBoxLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  loaderContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loaderText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
