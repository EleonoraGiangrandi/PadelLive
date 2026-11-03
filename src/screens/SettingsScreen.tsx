import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, AppTheme } from '../utils/theme';
import { useNotificationStore } from '../store/useNotificationStore';
import { requestNotificationPermission } from '../services/notificationService';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { preferences, updatePreferences } = useNotificationStore();

  const handleToggleMasterNotifications = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        // Se non concessi, non forziamo ON o lasciamo attivo
      }
    }
    updatePreferences({ enabled: val });
  };

  const reminderOptions = [0, 5, 10, 15, 30];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preferenze & Profilo</Text>
        <Text style={styles.subtitle}>Personalizza notifiche, preferiti e visualizzazione</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SEZIONE 1: NOTIFICHE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔔 NOTIFICHE PARTITE</Text>
        </View>

        <View style={styles.card}>
          {/* Master Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifiche Live</Text>
              <Text style={styles.settingDesc}>Ricevi aggiornamenti sulle partite del circuito</Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={handleToggleMasterNotifications}
              trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          {preferences.enabled && (
            <>
              <View style={styles.divider} />

              {/* Only Favorites */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>⭐ Solo Giocatori Preferiti</Text>
                  <Text style={styles.settingDesc}>
                    Invia notifiche solo per i match dei tuoi giocatori salvati
                  </Text>
                </View>
                <Switch
                  value={preferences.onlyFavorites}
                  onValueChange={(val) => updatePreferences({ onlyFavorites: val })}
                  trackColor={{ false: theme.colors.cardSecondary, true: '#f59e0b' }}
                  thumbColor={theme.colors.white}
                />
              </View>

              <View style={styles.divider} />

              {/* Inizio Match */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Inizio Match</Text>
                  <Text style={styles.settingDesc}>Alert quando la partita comincia</Text>
                </View>
                <Switch
                  value={preferences.notifyMatchStart}
                  onValueChange={(val) => updatePreferences({ notifyMatchStart: val })}
                  trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              </View>

              <View style={styles.divider} />

              {/* Fine Set */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Fine di ogni Set</Text>
                  <Text style={styles.settingDesc}>Aggiornamento al termine di ciascun set</Text>
                </View>
                <Switch
                  value={preferences.notifySetEnd}
                  onValueChange={(val) => updatePreferences({ notifySetEnd: val })}
                  trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              </View>

              <View style={styles.divider} />

              {/* Fine Match */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Fine Match & Risultato</Text>
                  <Text style={styles.settingDesc}>Risultato finale dettagliato e vincitori</Text>
                </View>
                <Switch
                  value={preferences.notifyMatchEnd}
                  onValueChange={(val) => updatePreferences({ notifyMatchEnd: val })}
                  trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              </View>

              <View style={styles.divider} />

              {/* Promemoria Pre-Match */}
              <View style={styles.settingColumn}>
                <Text style={styles.settingLabel}>⏰ Promemoria Pre-Match</Text>
                <Text style={styles.settingDesc}>
                  Avviso prima dell'orario di inizio programmato
                </Text>
                <View style={styles.chipRow}>
                  {reminderOptions.map((mins) => {
                    const isSelected = preferences.reminderMinutes === mins;
                    return (
                      <TouchableOpacity
                        key={mins}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => updatePreferences({ reminderMinutes: mins })}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {mins === 0 ? 'Off' : `${mins} min`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>

        {/* SEZIONE: TEMA & ASPETTO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎨 ASPETTO</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tema Scuro</Text>
              <Text style={styles.settingDesc}>
                {isDark ? 'Attualmente in modalità scura' : 'Attualmente in modalità chiara'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* SEZIONE 4: LINGUA (PREDISPOSIZIONE FUTURA) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌐 LINGUA</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Lingua dell'applicazione</Text>
              <Text style={styles.settingDesc}>Italiano (predefinita)</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Prossimamente altre lingue</Text>
            </View>
          </View>
        </View>

        {/* SEZIONE 5: INFORMAZIONI APP */}
        <View style={styles.aboutFooter}>
          <Text style={styles.aboutTitle}>🎾 PadelPulse v2.0.0</Text>
          <Text style={styles.aboutSub}>
            Punteggi live, calendari e classifiche ufficiali FIP & Premier Padel.
          </Text>
        </View>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.xl * 2,
    },
    sectionHeader: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      ...theme.typography.badge,
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      fontSize: 11,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    settingColumn: {
      paddingVertical: 6,
    },
    settingInfo: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    settingLabel: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    settingDesc: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.cardBorder,
      marginVertical: 10,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.cardSecondary,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    chipTextActive: {
      color: theme.colors.white,
      fontWeight: '700',
    },
    comingSoonBadge: {
      backgroundColor: theme.colors.cardSecondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    comingSoonText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontSize: 11,
    },
    aboutFooter: {
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    aboutTitle: {
      ...theme.typography.subtitle,
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    aboutSub: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: theme.spacing.lg,
    },
  });
