import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Search,
  X,
  Tv,
  MapPin,
  Calendar,
  Trophy,
  Star,
} from 'lucide-react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMatches } from '../api/events';
import { Match, Gender } from '../types/models';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme, AppTheme } from '../utils/theme';
import { getDatesBetween, formatDateRange } from '../utils/date';
import { DayTabs } from '../components/tournament/DayTabs';
import { MatchCard } from '../components/tournament/MatchCard';
import { getHdImageUrl } from '../components/tournament/TournamentCard';
import { evaluateMatches, matchHasFavoritePlayer } from '../services/matchTrackerService';
import { useNotificationStore } from '../store/useNotificationStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useTranslation } from '../i18n';
import { WhereToWatchModal } from '../components/common/WhereToWatchModal';
import { TournamentDrawView } from '../components/tournament/TournamentDrawView';

type RouteProps = RouteProp<RootStackParamList, 'Tournament'>;
type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export const TournamentScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t, language } = useTranslation();
  const { event } = route.params;

  const eventIdentifier = event.eventId || event.id;

  const dateLocale = language === 'it' ? 'it-IT' : language === 'es' ? 'es-ES' : 'en-US';

  // Compute tabs for the tournament dates
  const dayTabs = useMemo(() => {
    return getDatesBetween(event.startDate, event.endDate, dateLocale, t.tournament.today);
  }, [event.startDate, event.endDate, dateLocale, t.tournament.today]);

  // Find initial day (if today exists, select it, otherwise day 1)
  const initialDay = useMemo(() => {
    const todayTab = dayTabs.find((t) => t.isToday);
    return todayTab ? todayTab.dayNumber : 1;
  }, [dayTabs]);

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [selectedGender, setSelectedGender] = useState<Gender>('both');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showWhereToWatch, setShowWhereToWatch] = useState(false);
  const { tournamentViewMode: viewMode, setTournamentViewMode: setViewMode } = usePreferencesStore();

  const isMatchFollowed = useNotificationStore((s) => s.isMatchFollowed);
  const favorites = useFavoritesStore((s) => s.favorites);

  // Fetch matches for the selected day directly from MatchScorerLive
  const {
    data: matches = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<Match[]>({
    queryKey: ['matches', eventIdentifier, selectedDay],
    queryFn: () => getMatches(eventIdentifier, selectedDay),
    refetchInterval: 20000, // Live auto-refresh polling every 20s
  });

  // Evaluate match status changes in background to dispatch timely notifications
  useEffect(() => {
    if (matches && matches.length > 0) {
      evaluateMatches(matches, event);
    }
  }, [matches, event]);

  // Filter & sort matches
  const filteredMatches = useMemo(() => {
    let result = matches;

    // Filter by Favorites
    if (onlyFavorites) {
      result = result.filter((m) => matchHasFavoritePlayer(m) || isMatchFollowed(m.matchId));
    }

    // Filter by Gender
    if (selectedGender !== 'both') {
      result = result.filter((m) => {
        const isWomen = m.roundName?.toLowerCase().includes('women');
        return selectedGender === 'women' ? isWomen : !isWomen;
      });
    }

    // Filter by Search Query (player name or round)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.roundName?.toLowerCase().includes(q) ||
          m.team1?.player1?.name?.toLowerCase().includes(q) ||
          m.team1?.player2?.name?.toLowerCase().includes(q) ||
          m.team2?.player1?.name?.toLowerCase().includes(q) ||
          m.team2?.player2?.name?.toLowerCase().includes(q)
      );
    }

    // Sort: 1) Ongoing / Live first, 2) Scheduled / Start Time, 3) Finished
    return [...result].sort((a, b) => {
      const aOngoing =
        a.isLive ||
        a.status === 'live' ||
        (!a.team1?.isWinner &&
          !a.team2?.isWinner &&
          (!!a.team1?.points || !!a.team2?.points || a.team1?.isServing || a.team2?.isServing));
      const bOngoing =
        b.isLive ||
        b.status === 'live' ||
        (!b.team1?.isWinner &&
          !b.team2?.isWinner &&
          (!!b.team1?.points || !!b.team2?.points || b.team1?.isServing || b.team2?.isServing));

      if (aOngoing !== bOngoing) {
        return aOngoing ? -1 : 1;
      }

      const aFinished = a.status === 'completed' || a.team1?.isWinner || a.team2?.isWinner;
      const bFinished = b.status === 'completed' || b.team1?.isWinner || b.team2?.isWinner;
      if (aFinished !== bFinished) {
        return aFinished ? 1 : -1;
      }

      return (a.startDate || '').localeCompare(b.startDate || '');
    });
  }, [matches, selectedGender, onlyFavorites, searchQuery, favorites, isMatchFollowed]);

  const handleSelectMatch = (match: Match) => {
    if (isSearching) {
      Keyboard.dismiss();
      setIsSearching(false);
    }
    navigation.navigate('Match', {
      match,
      event,
      day: selectedDay,
    });
  };

  const handleCloseSearch = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    setIsSearching(false);
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (isSearching) handleCloseSearch();
      }}
      accessible={false}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          {isSearching ? (
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder={t.tournament.searchPlaceholder}
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              <TouchableOpacity
                onPress={handleCloseSearch}
                style={styles.searchClose}
              >
                <X size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {event.name}
              </Text>
              <View style={styles.headerSubtitleRow}>
                <MapPin size={11} color={theme.colors.textSecondary} />
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {event.location} • {formatDateRange(event.startDate, event.endDate)}
                </Text>
              </View>
            </View>
          )}

          {!isSearching && (
            <View style={styles.topBarRight}>
              <TouchableOpacity
                onPress={() => setShowWhereToWatch(true)}
                style={styles.watchHeaderBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Where to watch"
              >
                <Tv size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsSearching(true)}
                style={styles.searchButton}
                accessibilityLabel="Search"
              >
                <Search size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Hero Section with HD Portrait Poster */}
        {event.cover ? (
          <View style={styles.heroSection}>
            <View style={styles.heroPosterWrap}>
              <Image
                source={{ uri: getHdImageUrl(event.cover) }}
                style={styles.heroPoster}
                resizeMode="cover"
              />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTournamentName} numberOfLines={2}>
                {event.name}
              </Text>
              <View style={styles.heroMetaRow}>
                <MapPin size={12} color={theme.colors.textSecondary} />
                <Text style={styles.heroLocation} numberOfLines={1}>
                  {event.location || 'Location TBA'}
                </Text>
              </View>
              <View style={styles.heroMetaRow}>
                <Calendar size={12} color={theme.colors.primary} />
                <Text style={styles.heroDates} numberOfLines={1}>
                  {formatDateRange(event.startDate, event.endDate)}
                </Text>
              </View>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroCategoryPill}>
                  <Text style={styles.heroCategoryText}>
                    {event.type.replace(/^fip-/, '').replace(/-/g, ' ').toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.heroWatchPill}
                  onPress={() => setShowWhereToWatch(true)}
                  activeOpacity={0.7}
                >
                  <Tv size={12} color={theme.colors.primary} />
                  <Text style={styles.heroWatchText}>
                    {t.streaming.whereToWatch}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* View Switcher: Matches (Schedule) / Draw */}
        <View style={styles.viewModeSwitcher}>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'matches' && styles.viewModeBtnActive]}
            onPress={() => setViewMode('matches')}
            activeOpacity={0.8}
          >
            <View style={styles.viewModeBtnContent}>
              <Calendar
                size={14}
                color={viewMode === 'matches' ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text style={[styles.viewModeBtnText, viewMode === 'matches' && styles.viewModeBtnTextActive]}>
                {t.draw.matchesView}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'draw' && styles.viewModeBtnActive]}
            onPress={() => setViewMode('draw')}
            activeOpacity={0.8}
          >
            <View style={styles.viewModeBtnContent}>
              <Trophy
                size={14}
                color={viewMode === 'draw' ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text style={[styles.viewModeBtnText, viewMode === 'draw' && styles.viewModeBtnTextActive]}>
                {t.draw.drawView}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {viewMode === 'draw' ? (
          <TournamentDrawView
            event={event}
            onSelectMatch={handleSelectMatch}
          />
        ) : (
          <>
            {/* Day Tabs with dedicated fixed-height wrapper */}
            {dayTabs.length > 0 && (
              <DayTabs
                tabs={dayTabs}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            )}

            {/* Filter Row: Gender & Favorites */}
            <View style={styles.genderRow}>
              {(['both', 'men', 'women'] as const).map((g) => {
                const isSelected = !onlyFavorites && selectedGender === g;
                const label =
                  g === 'both'
                    ? t.tournament.all
                    : g === 'men'
                    ? t.tournament.men
                    : t.tournament.women;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, isSelected && styles.genderChipActive]}
                    onPress={() => {
                      setOnlyFavorites(false);
                      setSelectedGender(g);
                    }}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        isSelected && styles.genderChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.genderChip, onlyFavorites && styles.genderChipFavActive]}
                onPress={() => setOnlyFavorites(!onlyFavorites)}
              >
                <View style={styles.genderChipFavContent}>
                  <Star
                    size={12}
                    color={onlyFavorites ? '#000000' : '#f59e0b'}
                    fill={onlyFavorites ? '#000000' : '#f59e0b'}
                  />
                  <Text
                    style={[
                      styles.genderChipText,
                      onlyFavorites && styles.genderChipFavTextActive,
                    ]}
                  >
                    {t.tournament.favorites}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Match List */}
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>{t.tournament.loading}</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{t.tournament.error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => { refetch(); }}>
                  <Text style={styles.retryButtonText}>{t.tournament.retry}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredMatches}
                keyExtractor={(item, index) => `${item.matchId || index}-${item.roundName}`}
                renderItem={({ item }) => (
                  <MatchCard match={item} onPress={() => handleSelectMatch(item)} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => {
                  if (isSearching) handleCloseSearch();
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => { refetch(); }}
                    tintColor={theme.colors.primary}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Trophy size={42} color={theme.colors.textMuted} style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyTitle}>
                      {onlyFavorites
                        ? t.tournament.noFavoritesTitle
                        : t.tournament.noMatches}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {onlyFavorites
                        ? t.tournament.noFavoritesSub
                        : t.tournament.noMatchesSub}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}

        <WhereToWatchModal
          visible={showWhereToWatch}
          onClose={() => setShowWhereToWatch(false)}
        />
      </View>
    </TouchableWithoutFeedback>
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
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    viewModeSwitcher: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
      gap: 8,
    },
    viewModeBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.cardSecondary,
    },
    viewModeBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    viewModeBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    viewModeBtnText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 13,
    },
    viewModeBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    backButton: {
      paddingRight: theme.spacing.md,
      paddingVertical: 4,
    },
    backText: {
      fontSize: 28,
      color: theme.colors.primary,
      lineHeight: 28,
    },
    headerTitleWrap: {
      flex: 1,
    },
    headerTitle: {
      ...theme.typography.title,
      fontSize: 16,
    },
    headerSubtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    headerSubtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    watchHeaderBtn: {
      padding: 6,
    },
    watchHeaderIcon: {
      fontSize: 18,
    },
    searchButton: {
      padding: 6,
    },
    searchIcon: {
      fontSize: 18,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.md,
      height: 38,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 14,
      paddingVertical: 4,
    },
    searchClose: {
      padding: 4,
    },
    searchCloseText: {
      color: theme.colors.textMuted,
      fontSize: 16,
    },
    heroSection: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
      gap: 14,
    },
    heroPosterWrap: {
      width: 72,
      height: 102,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.colors.cardSecondary,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    heroPoster: {
      width: '100%',
      height: '100%',
    },
    heroInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    heroTournamentName: {
      ...theme.typography.title,
      fontSize: 18,
      lineHeight: 22,
      marginBottom: 4,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 3,
    },
    heroLocation: {
      ...theme.typography.body,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    heroDates: {
      ...theme.typography.caption,
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    heroCategoryPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.cardSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    heroWatchPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.cardSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    heroWatchText: {
      ...theme.typography.caption,
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    heroCategoryText: {
      ...theme.typography.badge,
      fontSize: 9,
      color: theme.colors.gold,
      letterSpacing: 0.5,
    },
    genderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
      gap: 8,
    },
    genderChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.cardSecondary,
    },
    genderChipFavContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    genderChipActive: {
      backgroundColor: theme.colors.primary,
    },
    genderChipFavActive: {
      backgroundColor: '#f59e0b',
    },
    genderChipText: {
      ...theme.typography.badge,
      color: theme.colors.textMuted,
      fontSize: 10,
    },
    genderChipTextActive: {
      color: theme.colors.white,
    },
    genderChipFavTextActive: {
      color: '#000000',
      fontWeight: '800',
    },
    listContent: {
      padding: theme.spacing.md,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    errorText: {
      ...theme.typography.body,
      color: theme.colors.live,
      marginBottom: theme.spacing.md,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.sm,
    },
    retryButtonText: {
      ...theme.typography.body,
      color: theme.colors.white,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      fontSize: 44,
      marginBottom: 12,
    },
    emptyTitle: {
      ...theme.typography.title,
      fontSize: 16,
      color: theme.colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
  });
