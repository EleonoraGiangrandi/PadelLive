import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FipEvent, Match } from '../../types/models';
import { getStreamInfo, openLiveStream } from '../../services/streamingService';
import { useAppTheme, AppTheme } from '../../utils/theme';
import { useTranslation } from '../../i18n';

interface LiveStreamButtonProps {
  event: FipEvent;
  match?: Match;
  onPressWhereToWatch?: () => void;
  compact?: boolean;
}

export const LiveStreamButton: React.FC<LiveStreamButtonProps> = ({
  event,
  match,
  onPressWhereToWatch,
  compact = false,
}) => {
  const { theme } = useAppTheme();
  const { language } = useTranslation();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const streamInfo = React.useMemo(() => {
    return getStreamInfo(event, match);
  }, [event, match]);

  if (!streamInfo.isAvailable && !onPressWhereToWatch) {
    return null;
  }

  const handlePressStream = async () => {
    try {
      await openLiveStream(streamInfo);
    } catch {
      Alert.alert(
        language === 'it' ? 'Errore' : language === 'es' ? 'Error' : 'Error',
        language === 'it'
          ? 'Impossibile aprire il link di streaming.'
          : language === 'es'
          ? 'No se pudo abrir el enlace de emisión.'
          : 'Unable to open stream link.'
      );
    }
  };

  const isYouTube = streamInfo.platform === 'youtube';
  const isRedBull = streamInfo.platform === 'redbull';

  const platformTitle = isYouTube
    ? language === 'it'
      ? 'Guarda Live su YouTube'
      : language === 'es'
      ? 'Ver en Directo en YouTube'
      : 'Watch Live on YouTube'
    : isRedBull
    ? language === 'it'
      ? 'Guarda su Red Bull TV'
      : language === 'es'
      ? 'Ver en Red Bull TV'
      : 'Watch on Red Bull TV'
    : language === 'it'
    ? 'Guarda Streaming Ufficiale'
    : language === 'es'
    ? 'Ver Emisión Oficial'
    : 'Watch Official Stream';

  if (compact) {
    return (
      <View style={styles.compactRow}>
        {streamInfo.isAvailable && (
          <TouchableOpacity
            style={[
              styles.compactStreamBtn,
              isYouTube ? styles.ytBg : styles.rbBg,
            ]}
            onPress={handlePressStream}
            activeOpacity={0.8}
          >
            <Text style={styles.compactStreamIcon}>
              {isYouTube ? '▶' : '⚡'}
            </Text>
            <Text style={styles.compactStreamText} numberOfLines={1}>
              {isYouTube ? 'YouTube Live' : 'Red Bull TV'}
            </Text>
          </TouchableOpacity>
        )}

        {onPressWhereToWatch && (
          <TouchableOpacity
            style={styles.compactWhereBtn}
            onPress={onPressWhereToWatch}
            activeOpacity={0.7}
          >
            <Text style={styles.compactWhereText}>
              {language === 'it' ? '📺 Dove vedere' : language === 'es' ? '📺 Dónde ver' : '📺 Where to watch'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {streamInfo.isAvailable && (
        <TouchableOpacity
          style={[
            styles.mainStreamBtn,
            isYouTube ? styles.ytBg : styles.rbBg,
          ]}
          onPress={handlePressStream}
          activeOpacity={0.85}
        >
          <View style={styles.btnLeft}>
            <View style={styles.playIconCircle}>
              <Text style={styles.playIconChar}>{isYouTube ? '▶' : '⚡'}</Text>
            </View>
            <View style={styles.btnTextCol}>
              <Text style={styles.mainTitle}>{platformTitle}</Text>
              <Text style={styles.subTitle} numberOfLines={1}>
                {streamInfo.courtName
                  ? `${streamInfo.channelName} • ${streamInfo.courtName}`
                  : streamInfo.channelName}
              </Text>
            </View>
          </View>
          <View style={styles.openPill}>
            <Text style={styles.openPillText}>
              {language === 'it' ? 'APRI' : language === 'es' ? 'ABRIR' : 'OPEN'} ↗
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {onPressWhereToWatch && (
        <TouchableOpacity
          style={styles.whereToWatchLink}
          onPress={onPressWhereToWatch}
          activeOpacity={0.7}
        >
          <Text style={styles.whereToWatchText}>
            📺 {language === 'it' ? 'Dove vedere le partite nel tuo paese' : language === 'es' ? 'Dónde ver los partidos en tu país' : 'Where to watch matches in your country'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    mainStreamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 5,
      elevation: 4,
    },
    ytBg: {
      backgroundColor: '#E60000',
    },
    rbBg: {
      backgroundColor: '#0F1D36',
      borderWidth: 1,
      borderColor: '#243B63',
    },
    btnLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    playIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    playIconChar: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 2,
    },
    btnTextCol: {
      flex: 1,
    },
    mainTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    subTitle: {
      color: 'rgba(255, 255, 255, 0.82)',
      fontSize: 11,
      marginTop: 2,
      fontWeight: '500',
    },
    openPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    openPillText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    whereToWatchLink: {
      alignSelf: 'center',
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    whereToWatchText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },

    // Compact mode
    compactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    compactStreamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      gap: 5,
    },
    compactStreamIcon: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    compactStreamText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    compactWhereBtn: {
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
    },
    compactWhereText: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '500',
    },
  });
