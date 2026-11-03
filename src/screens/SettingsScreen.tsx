import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {
  Bell,
  Star,
  Clock,
  Globe,
  Check,
  Moon,
  Trophy,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, AppTheme } from '../utils/theme';
import { useNotificationStore } from '../store/useNotificationStore';
import { requestNotificationPermission } from '../services/notificationService';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { preferences, updatePreferences } = useNotificationStore();
  const { t, language, setLanguage } = useTranslation();

  const handleToggleMasterNotifications = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        // Se non concessi
      }
    }
    updatePreferences({ enabled: val });
  };

  const reminderOptions = [0, 5, 10, 15, 30];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.settings.title}</Text>
        <Text style={styles.subtitle}>{t.settings.subtitle}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SEZIONE 1: NOTIFICHE */}
        <View style={styles.sectionHeader}>
          <Bell size={16} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t.settings.notificationsSection}</Text>
        </View>

        <View style={styles.card}>
          {/* Master Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t.settings.liveNotifications}</Text>
              <Text style={styles.settingDesc}>{t.settings.liveNotificationsDesc}</Text>
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
                  <View style={styles.labelWithIcon}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.settingLabel}>{t.settings.onlyFavorites}</Text>
                  </View>
                  <Text style={styles.settingDesc}>
                    {t.settings.onlyFavoritesDesc}
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
                  <Text style={styles.settingLabel}>{t.settings.matchStart}</Text>
                  <Text style={styles.settingDesc}>{t.settings.matchStartDesc}</Text>
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
                  <Text style={styles.settingLabel}>{t.settings.setEnd}</Text>
                  <Text style={styles.settingDesc}>{t.settings.setEndDesc}</Text>
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
                  <Text style={styles.settingLabel}>{t.settings.matchEnd}</Text>
                  <Text style={styles.settingDesc}>{t.settings.matchEndDesc}</Text>
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
                <View style={styles.labelWithIcon}>
                  <Clock size={14} color={theme.colors.primary} />
                  <Text style={styles.settingLabel}>{t.settings.reminder}</Text>
                </View>
                <Text style={styles.settingDesc}>{t.settings.reminderDesc}</Text>
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
                          {mins === 0 ? t.settings.reminderOff : `${mins} ${t.settings.reminderMins}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>

        {/* SEZIONE 2: LINGUA */}
        <View style={styles.sectionHeader}>
          <Globe size={16} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t.settings.languageSection}</Text>
        </View>

        <View style={styles.card}>
          {SUPPORTED_LANGUAGES.map((lang, index) => {
            const isSelected = language === lang.code;
            return (
              <React.Fragment key={lang.code}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageOptionLeft}>
                    <Text style={styles.flagIcon}>{lang.flag}</Text>
                    <Text style={[styles.languageName, isSelected && styles.languageNameActive]}>
                      {lang.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* SEZIONE 3: TEMA & ASPETTO */}
        <View style={styles.sectionHeader}>
          <Moon size={16} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{t.settings.appearanceSection}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t.settings.darkMode}</Text>
              <Text style={styles.settingDesc}>
                {isDark ? t.settings.darkModeActive : t.settings.lightModeActive}
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

        {/* SEZIONE 4: INFORMAZIONI APP */}
        <View style={styles.aboutFooter}>
          <View style={styles.aboutTitleRow}>
            <Trophy size={15} color={theme.colors.primary} />
            <Text style={styles.aboutTitle}>{t.settings.aboutTitle}</Text>
          </View>
          <Text style={styles.aboutSub}>{t.settings.aboutSub}</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
    labelWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    languageOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    flagIcon: {
      fontSize: 22,
    },
    languageName: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '500',
    },
    languageNameActive: {
      fontWeight: '700',
      color: theme.colors.primary,
    },
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: '800',
    },
    aboutFooter: {
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    aboutTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
