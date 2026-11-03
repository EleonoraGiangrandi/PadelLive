import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Newspaper } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNewsArticles } from '../api/news';
import { RssArticle } from '../types/models';
import { useAppTheme, AppTheme } from '../utils/theme';
import { decodeHtmlEntities } from '../utils/text';
import { useTranslation } from '../i18n';

export const NewsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t, language } = useTranslation();

  const {
    data: articles = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<RssArticle[]>({
    queryKey: ['news'],
    queryFn: () => getNewsArticles('it'),
  });

  const handleOpenArticle = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.warn('Cannot open url:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const locale = language === 'it' ? 'it-IT' : language === 'es' ? 'es-ES' : 'en-US';
      return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.news.title}</Text>
        <Text style={styles.subtitle}>{t.news.subtitle}</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t.news.loading}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t.news.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { refetch(); }}>
            <Text style={styles.retryButtonText}>{t.news.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => item.url || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpenArticle(item.url)}
              activeOpacity={0.8}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                  <Text style={styles.sourceBadge}>{decodeHtmlEntities(item.source)}</Text>
                  {item.date ? (
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                  ) : null}
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {decodeHtmlEntities(item.title)}
                </Text>

                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {decodeHtmlEntities(item.description)}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Newspaper size={44} color={theme.colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Nessuna notizia disponibile</Text>
              <Text style={styles.emptySubtitle}>
                Trascina verso il basso per ricaricare le notizie più recenti
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
    },
    listContent: {
      padding: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    cardImage: {
      width: '100%',
      height: 160,
      backgroundColor: theme.colors.cardSecondary,
    },
    cardBody: {
      padding: theme.spacing.md,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sourceBadge: {
      ...theme.typography.badge,
      fontSize: 10,
      color: theme.colors.primary,
      backgroundColor: theme.colors.cardSecondary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    date: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: 6,
      lineHeight: 22,
    },
    cardDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 19,
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
