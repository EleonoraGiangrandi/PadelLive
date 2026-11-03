import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAppTheme, AppTheme } from '../../utils/theme';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  const { theme, isDark, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.dialog}>
            <Text style={styles.logo}>🎾 PadelPulse</Text>
            <Text style={styles.title}>Live Scores & Circuiti</Text>
            <Text style={styles.version}>Versione 2.0.0 (React Native)</Text>

            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>
                Sorgente: 100% Ufficiale Diretta (FIP & MatchScorer)
              </Text>
            </View>

            {/* Theme Selector */}
            <View style={styles.themeSelectorSection}>
              <Text style={styles.themeSectionLabel}>TEMA GRAFICO</Text>
              <View style={styles.themeToggleRow}>
                <TouchableOpacity
                  style={[styles.themeOptionBtn, isDark && styles.themeOptionBtnActive]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Text style={[styles.themeOptionText, isDark && styles.themeOptionTextActive]}>
                    🌙 Scuro
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.themeOptionBtn, !isDark && styles.themeOptionBtnActive]}
                  onPress={() => setThemeMode('light')}
                >
                  <Text style={[styles.themeOptionText, !isDark && styles.themeOptionTextActive]}>
                    ☀️ Chiaro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.desc}>
              Applicazione mobile autonoma per il monitoraggio dei punteggi di padel in tempo reale,
              classifiche ufficiali FIP, calendari tornei e notizie.
            </Text>

            <Text style={styles.securityNote}>
              🔒 Nessun dato personale o richiesta viene inviata a server intermediari di terze parti.
              Tutte le comunicazioni avvengono direttamente con i fornitori ufficiali a costo zero.
            </Text>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    dialog: {
      width: '100%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    logo: {
      fontSize: 32,
      marginBottom: 8,
    },
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      fontSize: 20,
      marginBottom: 2,
    },
    version: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.md,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(35, 134, 54, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(35, 134, 54, 0.4)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.full,
      marginBottom: theme.spacing.md,
    },
    greenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.winner,
      marginRight: 6,
    },
    statusText: {
      ...theme.typography.badge,
      fontSize: 10,
      color: theme.colors.winner,
    },
    themeSelectorSection: {
      width: '100%',
      alignItems: 'center',
      marginVertical: theme.spacing.sm,
    },
    themeSectionLabel: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    themeToggleRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.cardSecondary,
      borderRadius: theme.borderRadius.md,
      padding: 4,
      gap: 6,
      width: '100%',
    },
    themeOptionBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm,
    },
    themeOptionBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    themeOptionText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    themeOptionTextActive: {
      color: theme.colors.white,
      fontWeight: '700',
    },
    divider: {
      width: '100%',
      height: 1,
      backgroundColor: theme.colors.cardBorder,
      marginVertical: theme.spacing.md,
    },
    desc: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: theme.spacing.md,
      fontSize: 13,
    },
    securityNote: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: theme.spacing.lg,
    },
    closeBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.sm,
    },
    closeBtnText: {
      ...theme.typography.body,
      color: theme.colors.white,
      fontWeight: '700',
    },
  });
