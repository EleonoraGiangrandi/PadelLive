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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RankingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [gender, setGender] = useState<'men' | 'women'>('men');
  const [searchQuery, setSearchQuery] = useState('');

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
    enabled: !searchQuery.trim(),
  });

  // Search query directly on FIP player search API
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['searchPlayers', gender, searchQuery],
    queryFn: () => searchPlayers(gender, searchQuery),
    enabled: !!searchQuery.trim(),
  });

  // Flattened player list
  const playersList: PlayerRanking[] = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return data?.pages.flatMap((page) => page) || [];
  }, [searchQuery, searchResults, data]);

  const handleSelectPlayer = (player: PlayerRanking) => {
    navigation.navigate('Profile', { player });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Classifiche Premier Padel / FIP</Text>
        <Text style={styles.subtitle}>Ranking Mondiale Ufficiale Uomini & Donne</Text>

        {/* Gender Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              gender === 'men' && styles.toggleBtnMenActive,
            ]}
            onPress={() => setGender('men')}
          >
            <Text
              style={[
                styles.toggleText,
                gender === 'men' && styles.toggleTextActive,
              ]}
            >
              UOMINI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              gender === 'women' && styles.toggleBtnWomenActive,
            ]}
            onPress={() => setGender('women')}
          >
            <Text
              style={[
                styles.toggleText,
                gender === 'women' && styles.toggleTextActive,
              ]}
            >
              DONNE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca giocatore o nazione..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Caricamento classifica...</Text>
        </View>
      ) : error ? (
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
            <PlayerRow player={item} onPress={() => handleSelectPlayer(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage && !searchQuery.trim()) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={theme.colors.primary}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Nessun giocatore trovato</Text>
              <Text style={styles.emptySubtitle}>
                Verifica il nome inserito o seleziona l'altra categoria
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
    toggleText: {
      ...theme.typography.badge,
      color: theme.colors.textMuted,
      fontWeight: '700',
    },
    toggleTextActive: {
      color: theme.colors.white,
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
