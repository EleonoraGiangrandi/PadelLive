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
import { useTranslation } from '../../i18n';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useTranslation();

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
            <Text style={styles.title}>{t.aboutModal.title}</Text>
            <Text style={styles.version}>{t.aboutModal.version}</Text>

            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>{t.aboutModal.source}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.desc}>{t.aboutModal.desc}</Text>

            <Text style={styles.securityNote}>🔒 {t.aboutModal.privacy}</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t.aboutModal.close}</Text>
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
