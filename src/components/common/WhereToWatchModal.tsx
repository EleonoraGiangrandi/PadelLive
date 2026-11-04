import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Tv, X, Info } from 'lucide-react-native';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { useTranslation } from '../../i18n';
import { BROADCASTERS_BY_COUNTRY } from '../../services/streamingService';

interface WhereToWatchModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WhereToWatchModal: React.FC<WhereToWatchModalProps> = ({ visible, onClose }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { language } = useTranslation();

  const langKey = language === 'it' ? 'it' : language === 'es' ? 'es' : 'en';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Clickable backdrop to close modal */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom sheet modal */}
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.headerTitles}>
              <View style={styles.titleRow}>
                <Tv size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.title}>
                  {language === 'it' ? 'Dove Vedere i Match' : language === 'es' ? 'Dónde Ver los Partidos' : 'Where to Watch Matches'}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {language === 'it'
                  ? 'Canali TV e streaming ufficiali per paese'
                  : language === 'es'
                  ? 'Canales de TV y emisiones oficiales por país'
                  : 'Official TV channels & streaming by country'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            nestedScrollEnabled={true}
          >
            {BROADCASTERS_BY_COUNTRY.map((b) => (
              <View key={b.countryCode} style={styles.countryCard}>
                <View style={styles.countryHeader}>
                  <Text style={styles.countryFlag}>{b.flag}</Text>
                  <Text style={styles.countryName}>{b.countryName[langKey]}</Text>
                </View>

                <View style={styles.channelsWrap}>
                  {b.channels.map((ch, idx) => (
                    <View key={idx} style={styles.channelChip}>
                      <Text style={styles.channelText}>{ch}</Text>
                    </View>
                  ))}
                </View>

                {b.notes && (
                  <Text style={styles.noteText}>{b.notes[langKey]}</Text>
                )}
              </View>
            ))}

            <View style={styles.footerNote}>
              <Info size={14} color={theme.colors.primary} style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.footerNoteText}>
                {language === 'it'
                  ? 'Le prime fasi sono sempre trasmesse su YouTube. Dai quarti Premier Padel le partite sono su Red Bull TV e broadcaster TV autorizzati.'
                  : language === 'es'
                  ? 'Las primeras fases se emiten siempre en YouTube. A partir de cuartos de Premier Padel se transmiten en Red Bull TV y canales autorizados.'
                  : 'Early rounds always stream on YouTube. From Premier Padel quarterfinals onwards, matches are on Red Bull TV & licensed broadcasters.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      maxHeight: '82%',
      paddingBottom: 20,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.cardBorder,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.cardBorder,
    },
    headerTitles: {
      flex: 1,
      marginRight: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      ...theme.typography.title,
      fontSize: 18,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.cardSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
    },
    body: {
      flexGrow: 0,
    },
    bodyContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    countryCard: {
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    countryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    countryFlag: {
      fontSize: 20,
    },
    countryName: {
      ...theme.typography.subtitle,
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    channelsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 6,
    },
    channelChip: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    channelText: {
      ...theme.typography.caption,
      color: theme.colors.textPrimary,
      fontWeight: '600',
      fontSize: 11,
    },
    noteText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 2,
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    footerNoteText: {
      flex: 1,
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      lineHeight: 16,
      fontSize: 11,
    },
  });
