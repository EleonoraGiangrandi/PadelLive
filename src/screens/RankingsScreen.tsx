import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRankings, searchPlayers } from '../api/rankings';
import { PlayerRanking } from '../types/models';
import { RootStackParamList } from '../types/navigation';
import { useAppTheme, AppTheme } from '../utils/theme';
import { PlayerRow } from '../components/ranking/PlayerRow';
import { useFavoritesStore } from '../store/useFavoritesStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RankingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [gender, setGender] = useState<'men' | 'women'>('men');
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const favorites = useFavoritesStore((s) => s.favorites);

  // Infinite scroll query for rankings directly from FIP
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error,
  } = useInfiniteQuery({
    queryKey: ['rankings', gender],
    queryFn: ({ pageParam = 0 }) => getRankings(gender, pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: viewMode === 'all' && !searchQuery.trim(),
  });

  // Search query directly on FIP player search API
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['searchPlayers', gender, searchQuery],
    queryFn: () => searchPlayers(gender, searchQuery),
    enabled: viewMode === 'all' && !!searchQuery.trim(),
  });

  // Flattened player list
  const playersList: PlayerRanking[] = useMemo(() => {
    if (viewMode === 'favorites') {
      let favList: PlayerRanking[] = favorites.map((f) => ({
        id: f.id,
        name: f.name,
        surname: f.surname,
        position: f.position || 0,
        points: (f as any).points || '-',
        country: f.country || '',
        flag: f.flag || '',
        image: f.image || '',
        handler: f.handler,
      }));

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        favList = favList.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.country.toLowerCase().includes(q)
        );
      }
      return favList;
    }

    if (searchQuery.trim()) {
      return searchResults;
    }
    return data?.pages.flatMap((page) => page) || [];
  }, [viewMode, favorites, searchQuery, searchResults, data]);

  const handleSelectPlayer = (player: PlayerRanking) => {
    navigation.navigate('Profile', { player });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Giocatori & Classifiche</Text>
        <Text style={styles.subtitle}>Ranking FIP, Premier Padel e i tuoi preferiti</Text>

        {/* Category & Favorites Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === 'all' && gender === 'men' && styles.toggleBtnMenActive,
            ]}
            onPress={() => {
              setViewMode('all');
              setGender('men');
            }}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'all' && gender === 'men' && styles.toggleTextActive,
              ]}
            >
              UOMINI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === 'all' && gender === 'women' && styles.toggleBtnWomenActive,
            ]}
            onPress={() => {
              setViewMode('all');
              setGender('women');
            }}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'all' && gender === 'women' && styles.toggleTextActive,
              ]}
            >
              DONNE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === 'favorites' && styles.toggleBtnFavActive,
            ]}
            onPress={() => {
              setViewMode(viewMode === 'favorites' ? 'all' : 'favorites');
            }}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'favorites' && styles.toggleTextFavActive,
              ]}
            >
              ⭐ PREFERITI {favorites.length > 0 ? `(${favorites.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              viewMode === 'favorites'
                ? 'Cerca tra i tuoi preferiti...'
                : 'Cerca giocatore o nazione...'
            }
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ position: 'absolute', right: searchQuery ? 38 : 12, top: 11 }}
            />
          )}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearch}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {viewMode === 'all' && isLoading && playersList.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Caricamento giocatori...</Text>
        </View>
      ) : viewMode === 'all' && error && playersList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Errore durante il caricamento</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { refetch(); }}>
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playersList}
          keyExtractor={(item) => `${item.id}-${item.position}`}
          renderItem={({ item }) => (
            <PlayerRow
              player={item}
              onPress={() => handleSelectPlayer(item)}
              isFavoriteView={viewMode === 'favorites'}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (viewMode === 'all' && hasNextPage && !isFetchingNextPage && !searchQuery.trim()) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            viewMode === 'all' ? (
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => { refetch(); }}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          ListFooterComponent={
            viewMode === 'all' && isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{viewMode === 'favorites' ? '⭐' : '🏆'}</Text>
              <Text style={styles.emptyTitle}>
                {viewMode === 'favorites'
                  ? 'Nessun preferito salvato'
                  : 'Nessun giocatore trovato'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {viewMode === 'favorites'
                  ? 'Tocca la stella ☆ su qualsiasi giocatore per aggiungerlo e ricevere le sue notifiche live!'
                  : "Verifica il nome inserito o seleziona un'altra categoria"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
      marginBottom: theme.spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: theme.borderRadius.sm,
      padding: 3,
      marginBottom: theme.spacing.md,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm - 2,
    },
    toggleBtnMenActive: {
      backgroundColor: theme.colors.men,
    },
    toggleBtnWomenActive: {
      backgroundColor: theme.colors.women,
    },
    toggleBtnFavActive: {
      backgroundColor: '#f59e0b',
    },
    toggleText: {
      ...theme.typography.badge,
      color: theme.colors.textMuted,
      fontWeight: '700',
    },
    toggleTextActive: {
      color: theme.colors.white,
    },
    toggleTextFavActive: {
      color: '#000000',
      fontWeight: '800',
    },
    searchContainer: {
      position: 'relative',
    },
    searchInput: {
      height: 40,
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingRight: 36,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    clearSearch: {
      position: 'absolute',
      right: 10,
      top: 10,
      padding: 4,
    },
    clearSearchText: {
      color: theme.colors.textMuted,
      fontSize: 14,
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
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.sm,
    },
    retryButtonText: {
      ...theme.typography.body,
      color: theme.colors.white,
      fontWeight: '700',
    },
    footerLoader: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
    emptyContainer: {
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
    },
    emptySubtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
