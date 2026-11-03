import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { User, FileText, Trophy } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { FipEvent, Match } from '../../types/models';
import { fetchTournamentDraw, TournamentDraw, DrawRound } from '../../services/drawService';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { useTranslation } from '../../i18n';
import { DrawMatchCard } from './DrawMatchCard';

interface TournamentDrawViewProps {
  event: FipEvent;
  onSelectMatch?: (match: Match) => void;
}

export const TournamentDrawView: React.FC<TournamentDrawViewProps> = ({
  event,
  onSelectMatch,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t, language } = useTranslation();

  const [selectedGender, setSelectedGender] = useState<'men' | 'women'>('men');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const eventIdentifier = event.eventId || event.id;

  const {
    data: draw,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<TournamentDraw>({
    queryKey: ['tournamentDraw', eventIdentifier, selectedGender],
    queryFn: () => fetchTournamentDraw(event, selectedGender),
    staleTime: 60000,
  });

  const rounds = draw?.rounds || [];

  // Seleziona il turno iniziale: preferisci l'ultimo turno attivo o la finale se concluso
  const activeRound = useMemo(() => {
    if (rounds.length === 0) return null;
    if (selectedRoundId) {
      const found = rounds.find((r) => r.roundId === selectedRoundId);
      if (found) return found;
    }
    // Default al primo turno disponibile
    return rounds[0];
  }, [rounds, selectedRoundId]);

  const handleOpenPdf = async () => {
    if (!draw?.pdfUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(draw.pdfUrl);
      if (canOpen) {
        await Linking.openURL(draw.pdfUrl);
      }
    } catch {
      Alert.alert(
        t.common.error,
        language === 'it'
          ? 'Impossibile aprire il file PDF.'
          : language === 'es'
          ? 'No se pudo abrir el archivo PDF.'
          : 'Unable to open PDF file.'
      );
    }
  };

  const getLocalizedRoundTitle = (round: DrawRound) => {
    const key = round.titleKey;
    if (key === 'round32') return t.draw.round32;
    if (key === 'round16') return t.draw.round16;
    if (key === 'quarterFinals') return t.draw.quarterFinals;
    if (key === 'semiFinals') return t.draw.semiFinals;
    if (key === 'final') return t.draw.final;
    return round.titleFallback || t.draw.roundOther;
  };

  return (
    <View style={styles.container}>
      {/* Sub-Header: Gender Switch & PDF Download */}
      <View style={styles.topControls}>
        <View style={styles.genderTabs}>
          <TouchableOpacity
            style={[
              styles.genderTabBtn,
              selectedGender === 'men' && styles.genderTabBtnActive,
            ]}
            onPress={() => setSelectedGender('men')}
            activeOpacity={0.8}
          >
            <View style={styles.genderTabBtnContent}>
              <User
                size={13}
                color={selectedGender === 'men' ? '#FFFFFF' : theme.colors.men}
              />
              <Text
                style={[
                  styles.genderTabText,
                  selectedGender === 'men' && styles.genderTabTextActive,
                ]}
              >
                {t.draw.menDraw}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderTabBtn,
              selectedGender === 'women' && styles.genderTabBtnActive,
            ]}
            onPress={() => setSelectedGender('women')}
            activeOpacity={0.8}
          >
            <View style={styles.genderTabBtnContent}>
              <User
                size={13}
                color={selectedGender === 'women' ? '#FFFFFF' : theme.colors.women}
              />
              <Text
                style={[
                  styles.genderTabText,
                  selectedGender === 'women' && styles.genderTabTextActive,
                ]}
              >
                {t.draw.womenDraw}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {draw?.pdfUrl ? (
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={handleOpenPdf}
            activeOpacity={0.7}
          >
            <View style={styles.pdfBtnContent}>
              <FileText size={13} color={theme.colors.primary} />
              <Text style={styles.pdfBtnText}>{t.draw.downloadPdf}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Carosello orizzontale dei turni */}
      {rounds.length > 0 && (
        <View style={styles.roundsNavWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roundsNavContent}
          >
            {rounds.map((round) => {
              const isSelected = (activeRound?.roundId === round.roundId);
              const label = getLocalizedRoundTitle(round);
              return (
                <TouchableOpacity
                  key={round.roundId}
                  style={[
                    styles.roundNavChip,
                    isSelected && styles.roundNavChipActive,
                  ]}
                  onPress={() => setSelectedRoundId(round.roundId)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roundNavText,
                      isSelected && styles.roundNavTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.matchCountBadge,
                      isSelected && styles.matchCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchCountText,
                        isSelected && styles.matchCountTextActive,
                      ]}
                    >
                      {round.matches.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Lista partite del turno selezionato */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t.draw.loadingDraw}</Text>
        </View>
      ) : rounds.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Trophy size={42} color={theme.colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>{t.draw.noDrawTitle}</Text>
          <Text style={styles.emptySub}>{t.draw.noDrawSub}</Text>
          {draw?.pdfUrl ? (
            <TouchableOpacity style={styles.pdfEmptyBtn} onPress={handleOpenPdf}>
              <View style={styles.pdfBtnContent}>
                <FileText size={13} color={theme.colors.primary} />
                <Text style={styles.pdfEmptyText}>{t.draw.downloadPdf}</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={activeRound?.matches || []}
          keyExtractor={(item) => item.matchId}
          renderItem={({ item }) => (
            <DrawMatchCard
              match={item}
              onPress={() => {
                if (onSelectMatch) {
                  // Converte in formato Match minimo per la navigazione
                  onSelectMatch({
                    matchId: item.matchId,
                    courtName: 'Campo',
                    roundName: activeRound ? getLocalizedRoundTitle(activeRound) : item.roundId,
                    startDate: '',
                    team1: {
                      player1: {
                        name: item.team1.player1.name,
                        flag: item.team1.player1.flag || '',
                      },
                      player2: {
                        name: item.team1.player2.name,
                        flag: item.team1.player2.flag || '',
                      },
                      points: '',
                      set1: item.team1.sets[0] || '-',
                      set2: item.team1.sets[1] || '-',
                      set3: item.team1.sets[2] || '-',
                      isWinner: item.team1.isWinner,
                      isServing: false,
                    },
                    team2: {
                      player1: {
                        name: item.team2.player1.name,
                        flag: item.team2.player1.flag || '',
                      },
                      player2: {
                        name: item.team2.player2.name,
                        flag: item.team2.player2.flag || '',
                      },
                      points: '',
                      set1: item.team2.sets[0] || '-',
                      set2: item.team2.sets[1] || '-',
                      set3: item.team2.sets[2] || '-',
                      isWinner: item.team2.isWinner,
                      isServing: false,
                    },
                  });
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={theme.colors.primary}
            />
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
    topControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    genderTabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: theme.borderRadius.full,
      padding: 3,
      gap: 4,
    },
    genderTabBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
    },
    genderTabBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    genderTabBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    genderTabText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      fontSize: 12,
    },
    genderTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    pdfBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.cardSecondary,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    pdfBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    pdfBtnText: {
      ...theme.typography.caption,
      color: theme.colors.textPrimary,
      fontWeight: '600',
      fontSize: 11,
    },
    roundsNavWrapper: {
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
      paddingVertical: 8,
    },
    roundsNavContent: {
      paddingHorizontal: theme.spacing.md,
      gap: 8,
    },
    roundNavChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.cardSecondary,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      gap: 6,
    },
    roundNavChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    roundNavText: {
      ...theme.typography.badge,
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    roundNavTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    matchCountBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 10,
    },
    matchCountBadgeActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    matchCountText: {
      fontSize: 10,
      color: theme.colors.textMuted,
      fontWeight: '700',
    },
    matchCountTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      padding: theme.spacing.md,
      paddingBottom: 32,
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
      marginTop: 12,
      fontSize: 13,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: 40,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyTitle: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      fontSize: 16,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySub: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 280,
    },
    pdfEmptyBtn: {
      marginTop: 16,
      backgroundColor: theme.colors.cardSecondary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    pdfEmptyText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
  });
