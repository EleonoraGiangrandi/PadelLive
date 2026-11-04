import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useAppTheme, AppTheme } from '../../utils/theme';
import {
  usePreferencesStore,
  ALL_TOURNAMENT_CATEGORIES,
} from '../../store/usePreferencesStore';
import { useTranslation } from '../../i18n';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const { t } = useTranslation();

  const {
    genre,
    setGenre,
    selectedCategories,
    toggleCategory,
    selectAllCategories,
    clearCategories,
  } = usePreferencesStore();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t.filterModal.title}</Text>
              <Text style={styles.subtitle}>{t.filterModal.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={true}
          >
            <View style={styles.categoryHeader}>
              <Text style={styles.sectionTitle}>
                {t.filterModal.circuits} ({selectedCategories.length}/{ALL_TOURNAMENT_CATEGORIES.length})
              </Text>
              <View style={styles.quickActions}>
                <TouchableOpacity onPress={selectAllCategories}>
                  <Text style={styles.actionText}>{t.filterModal.selectAll}</Text>
                </TouchableOpacity>
                <Text style={styles.actionDivider}>•</Text>
                <TouchableOpacity onPress={clearCategories}>
                  <Text style={styles.actionText}>{t.filterModal.deselectAll}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categoriesGrid}>
              {ALL_TOURNAMENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const isPremier = cat.id.startsWith('premier');

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                      isSelected && isPremier && styles.categoryChipPremierActive,
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <View style={styles.categoryChipContent}>
                      {isSelected && (
                        <Check
                          size={12}
                          color={isPremier ? theme.colors.gold : theme.colors.primary}
                          strokeWidth={3}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>{t.rankings.title}</Text>
            <View style={styles.genreRow}>
              {[
                { id: 'both', label: t.tournament.all },
                { id: 'men', label: t.tournament.men },
                { id: 'women', label: t.tournament.women },
              ].map((g) => {
                const isSelected = genre === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.genreButton,
                      isSelected && styles.genreButtonActive,
                    ]}
                    onPress={() => setGenre(g.id as any)}
                  >
                    <Text
                      style={[
                        styles.genreText,
                        isSelected && styles.genreTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>{t.filterModal.apply}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme, isDark: boolean) =>
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
      paddingBottom: 32,
      borderTopWidth: 1,
      borderTopColor: theme.colors.cardBorder,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.cardBorder,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 4,
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
    title: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      fontSize: 17,
    },
    subtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      padding: 6,
    },
    closeText: {
      fontSize: 18,
      color: theme.colors.textMuted,
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
    },
    bodyContent: {
      paddingBottom: theme.spacing.xl,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.subtitle,
      color: theme.colors.textSecondary,
      fontSize: 13,
    },
    quickActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    actionDivider: {
      color: theme.colors.textMuted,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: theme.spacing.xl,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.cardSecondary,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryChipContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryChipActive: {
      backgroundColor: isDark ? 'rgba(31, 111, 235, 0.2)' : 'rgba(9, 105, 218, 0.12)',
      borderColor: theme.colors.primary,
    },
    categoryChipPremierActive: {
      backgroundColor: isDark ? 'rgba(210, 153, 34, 0.2)' : 'rgba(217, 119, 6, 0.12)',
      borderColor: theme.colors.gold,
    },
    categoryText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    categoryTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
    },
    genreRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    genreButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.cardSecondary,
      alignItems: 'center',
    },
    genreButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    genreText: {
      ...theme.typography.badge,
      color: theme.colors.textMuted,
    },
    genreTextActive: {
      color: theme.colors.white,
      fontWeight: '700',
    },
    applyButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      marginTop: 8,
    },
    applyButtonText: {
      ...theme.typography.body,
      color: theme.colors.white,
      fontWeight: '700',
    },
  });
