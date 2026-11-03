import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEvents } from '../api/events';
import { FipEvent } from '../types/models';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme, AppTheme } from '../utils/theme';
import { isEventFuture, isEventOngoing, isEventPast, parseDate } from '../utils/date';
import { TournamentCard } from '../components/tournament/TournamentCard';
import { FilterModal } from '../components/common/FilterModal';
import { AboutModal } from '../components/common/AboutModal';
import { usePreferencesStore, ALL_TOURNAMENT_CATEGORIES } from '../store/usePreferencesStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type StatusTab = 'in_corso' | 'futuri' | 'recenti' | 'tutti';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusTab>('in_corso');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const {
    selectedCategories,
    searchQuery,
    setSearchQuery,
    loadPreferences,
  } = usePreferencesStore();

  useEffect(() => {
    loadPreferences();
  }, []);

  const {
    data: events = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<FipEvent[]>({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  // Filter events by categories and search query
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((catId) => {
          const cat = ALL_TOURNAMENT_CATEGORIES.find((c) => c.id === catId);
          return cat ? cat.types.includes(e.type) : e.type === catId;
        });

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategories]);

  // Group into status categories
  const liveNow = useMemo(
    () => filteredEvents.filter((e) => isEventOngoing(e.startDate, e.endDate)),
    [filteredEvents]
  );

  const upNext = useMemo(
    () => filteredEvents.filter((e) => isEventFuture(e.startDate)),
    [filteredEvents]
  );

  const past = useMemo(
    () => filteredEvents.filter((e) => isEventPast(e.endDate)),
    [filteredEvents]
  );

  // If liveNow is empty and user hasn't selected a tab yet, default to futuri
  useEffect(() => {
    if (activeTab === 'in_corso' && liveNow.length === 0 && upNext.length > 0) {
      setActiveTab('futuri');
    }
  }, [liveNow.length, upNext.length]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    in_corso: liveNow.length,
    futuri: upNext.length,
    recenti: past.length,
    tutti: filteredEvents.length,
  }), [liveNow.length, upNext.length, past.length, filteredEvents.length]);

  // Current tab items sorted by date proximity
  const displayedEvents = useMemo(() => {
    const now = new Date().getTime();

    let list: FipEvent[] = [];
    if (activeTab === 'in_corso') {
      list = [...liveNow];
    } else if (activeTab === 'futuri') {
      list = [...upNext];
    } else if (activeTab === 'recenti') {
      list = [...past];
    } else {
      list = [...filteredEvents];
    }

    return list.sort((a, b) => {
      const dateA = (activeTab === 'recenti' ? parseDate(a.endDate) : parseDate(a.startDate))?.getTime() || 0;
      const dateB = (activeTab === 'recenti' ? parseDate(b.endDate) : parseDate(b.startDate))?.getTime() || 0;

      if (activeTab === 'futuri') {
        // Futuri: più vicini = data più bassa (oggi/domani prima di dicembre)
        const diff = dateA - dateB;
        return sortAsc ? diff : -diff;
      } else if (activeTab === 'recenti') {
        // Recenti: più vicini ad oggi = data più recente (ieri prima di gennaio)
        const diff = dateB - dateA;
        return sortAsc ? diff : -diff;
      } else if (activeTab === 'in_corso') {
        const diff = dateA - dateB;
        return sortAsc ? diff : -diff;
      } else {
        // Tutti: distanza assoluta da oggi
        const distA = Math.abs(dateA - now);
        const distB = Math.abs(dateB - now);
        const diff = distA - distB;
        return sortAsc ? diff : -diff;
      }
    });
  }, [activeTab, liveNow, upNext, past, filteredEvents, sortAsc]);

  const handleSelectTournament = (event: FipEvent) => {
    if (isSearching) {
      Keyboard.dismiss();
      setIsSearching(false);
    }
    navigation.navigate('Tournament', { event });
  };

  const handleCloseSearch = () => {
    Keyboard.dismiss();
    setSearchQuery('');
    setIsSearching(false);
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (isSearching) {
          handleCloseSearch();
        }
      }}
      accessible={false}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Top App Bar */}
        <View style={styles.header}>
          {isSearching ? (
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca torneo, città o circuito..."
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
                <Text style={styles.searchCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View>
                <Text style={styles.appName}>🎾 PadelPulse</Text>
                <Text style={styles.screenSubtitle}>Tornei & Punteggi Live</Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={styles.iconButton}
                  accessibilityLabel={isDark ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
                >
                  <Text style={styles.actionIcon}>{isDark ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsSearching(true)}
                  style={styles.iconButton}
                  accessibilityLabel="Cerca torneo"
                >
                  <Text style={styles.actionIcon}>🔍</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsAboutVisible(true)}
                  style={styles.iconButton}
                  accessibilityLabel="Info app"
                >
                  <Text style={styles.actionIcon}>ℹ️</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Status Navigation Tabs (In Corso / Futuri / Recenti / Tutti) */}
        <View style={styles.statusTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusTabsContent}
          >
            {[
              { id: 'in_corso', label: 'IN CORSO', count: tabCounts.in_corso, isLive: true },
              { id: 'futuri', label: 'FUTURI', count: tabCounts.futuri },
              { id: 'recenti', label: 'RECENTI', count: tabCounts.recenti },
              { id: 'tutti', label: 'TUTTI', count: tabCounts.tutti },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.statusTabBtn,
                    isActive && (tab.isLive && tab.count > 0 ? styles.statusTabLiveActive : styles.statusTabBtnActive),
                  ]}
                  onPress={() => {
                    setActiveTab(tab.id as StatusTab);
                    if (isSearching) handleCloseSearch();
                  }}
                  activeOpacity={0.7}
                >
                  {tab.isLive && tab.count > 0 && <View style={styles.livePulseDot} />}
                  <Text
                    style={[
                      styles.statusTabText,
                      isActive && styles.statusTabTextActive,
                    ]}
                  >
                    {tab.label} ({tab.count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sub-toolbar: Categorie Button + Sort Direction Toggle */}
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={styles.categoryMenuBtn}
            onPress={() => {
              if (isSearching) handleCloseSearch();
              setIsFilterVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryMenuIcon}>🏷️</Text>
            <Text style={styles.categoryMenuText}>
              Categorie ({selectedCategories.length}/{ALL_TOURNAMENT_CATEGORIES.length})
            </Text>
            <Text style={styles.categoryMenuArrow}>▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortToggleBtn}
            onPress={() => setSortAsc(!sortAsc)}
            activeOpacity={0.7}
          >
            <Text style={styles.sortToggleIcon}>{sortAsc ? '↑' : '↓'}</Text>
            <Text style={styles.sortToggleLabel}>
              {sortAsc ? 'Più vicini' : 'Più lontani'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Caricamento tornei 2026...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Errore durante il caricamento dei tornei</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { refetch(); }}>
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
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
          >
            {displayedEvents.map((event) => (
              <TournamentCard
                key={event.id}
                event={event}
                onPress={() => handleSelectTournament(event)}
              />
            ))}

            {displayedEvents.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎾</Text>
                <Text style={styles.emptyTitle}>Nessun torneo in questa sezione</Text>
                <Text style={styles.emptySubtitle}>
                  Prova a selezionare un'altra scheda o a ripristinare i filtri categoria
                </Text>
                {selectedCategories.length < ALL_TOURNAMENT_CATEGORIES.length && (
                  <TouchableOpacity
                    style={styles.resetFiltersBtn}
                    onPress={() => usePreferencesStore.getState().selectAllCategories()}
                  >
                    <Text style={styles.resetFiltersText}>Reimposta tutte le categorie</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Filter Modal */}
        <FilterModal
          visible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
        />

        {/* About Modal */}
        <AboutModal
          visible={isAboutVisible}
          onClose={() => setIsAboutVisible(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  appName: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  screenSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.sm,
  },
  actionIcon: {
    fontSize: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  searchClose: {
    padding: 6,
  },
  searchCloseText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },

  // Status Tabs
  statusTabsWrapper: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    height: 48,
  },
  statusTabsContent: {
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cardSecondary,
  },
  statusTabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  statusTabLiveActive: {
    backgroundColor: theme.colors.live,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  statusTabText: {
    ...theme.typography.badge,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  statusTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // Sub-toolbar
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  categoryMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 6,
  },
  categoryMenuIcon: {
    fontSize: 13,
  },
  categoryMenuText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  categoryMenuArrow: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  sortToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 4,
  },
  sortToggleIcon: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  sortToggleLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
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
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFiltersBtn: {
    backgroundColor: theme.colors.cardSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  resetFiltersText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
