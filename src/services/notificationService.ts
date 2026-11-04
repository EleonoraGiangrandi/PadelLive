import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Match, FipEvent } from '../types/models';
import { usePreferencesStore } from '../store/usePreferencesStore';

const CHANNEL_ID = 'padel_live_matches';

/**
 * Initializes notification handler and Android notification channel
 */
export async function setupNotifications(): Promise<void> {
  try {
    // Configure behavior when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'PadelLive Live Matches',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00e676',
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (error) {
    console.warn('Error setting up notifications:', error);
  }
}

/**
 * Requests permissions to display notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
}

/**
 * Formats a pair of player names into a readable string
 */
export function formatTeamNames(p1?: string, p2?: string): string {
  if (p1 && p2) return `${p1} / ${p2}`;
  return p1 || p2 || 'TBD';
}

/**
 * Sends an immediate local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: null, // trigger null = immediate delivery
    });
    return id;
  } catch (error) {
    console.warn('Error sending local notification:', error);
    return null;
  }
}

/**
 * Notification for match start
 */
export async function notifyMatchStart(match: Match, event?: FipEvent): Promise<string | null> {
  const lang = usePreferencesStore.getState().language;
  const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
  const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);
  const courtPrep = lang === 'it' ? ' su ' : lang === 'es' ? ' en ' : ' on ';
  const court = match.courtName ? `${courtPrep}${match.courtName}` : '';
  const round = match.roundName ? ` (${match.roundName})` : '';

  const title =
    lang === 'it'
      ? '🎾 Match Iniziato!'
      : lang === 'es'
      ? '🎾 ¡Partido Comenzado!'
      : '🎾 Match Started!';

  return sendLocalNotification(
    title,
    `${team1} vs ${team2}${court}${round}`,
    {
      matchId: match.matchId,
      eventId: event?.eventId || event?.id,
      screen: 'Match',
    }
  );
}

/**
 * Notification for end of a set
 */
export async function notifySetEnd(
  match: Match,
  setNumber: number,
  scoreStr: string,
  event?: FipEvent
): Promise<string | null> {
  const lang = usePreferencesStore.getState().language;
  const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
  const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);

  const title =
    lang === 'it'
      ? `🎾 Fine ${setNumber}° Set (${scoreStr})`
      : lang === 'es'
      ? `🎾 Fin del Set ${setNumber} (${scoreStr})`
      : `🎾 End of Set ${setNumber} (${scoreStr})`;

  return sendLocalNotification(
    title,
    `${team1} vs ${team2}`,
    {
      matchId: match.matchId,
      eventId: event?.eventId || event?.id,
      screen: 'Match',
    }
  );
}

/**
 * Notification for match conclusion with score
 */
export async function notifyMatchEnd(match: Match, event?: FipEvent): Promise<string | null> {
  const lang = usePreferencesStore.getState().language;
  const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
  const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);

  const t1Winner = match.team1?.isWinner;
  const t2Winner = match.team2?.isWinner;
  const winner = t1Winner ? team1 : t2Winner ? team2 : null;

  // Build sets score string: e.g. "6-4 3-6 7-6"
  const sets = [
    match.team1?.set1 && match.team2?.set1 ? `${match.team1.set1}-${match.team2.set1}` : null,
    match.team1?.set2 && match.team2?.set2 ? `${match.team1.set2}-${match.team2.set2}` : null,
    match.team1?.set3 && match.team2?.set3 ? `${match.team1.set3}-${match.team2.set3}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  let title = '';
  if (winner) {
    title =
      lang === 'it'
        ? `🏆 Vince ${winner}!`
        : lang === 'es'
        ? `🏆 ¡Gana ${winner}!`
        : `🏆 ${winner} wins!`;
  } else {
    title =
      lang === 'it'
        ? '🏆 Match Concluso!'
        : lang === 'es'
        ? '🏆 ¡Partido Concluido!'
        : '🏆 Match Completed!';
  }

  const resultPrefix =
    lang === 'it'
      ? 'Risultato finale'
      : lang === 'es'
      ? 'Resultado final'
      : 'Final score';

  const body = sets ? `${resultPrefix}: ${sets} (${team1} vs ${team2})` : `${team1} vs ${team2}`;

  return sendLocalNotification(title, body, {
    matchId: match.matchId,
    eventId: event?.eventId || event?.id,
    screen: 'Match',
  });
}

/**
 * Schedules a reminder before match starts
 */
export async function scheduleMatchReminder(
  match: Match,
  targetDate: Date,
  minutesBefore: number,
  event?: FipEvent
): Promise<string | null> {
  try {
    const triggerTime = new Date(targetDate.getTime() - minutesBefore * 60 * 1000);
    if (triggerTime <= new Date()) {
      return null; // Already past
    }

    const lang = usePreferencesStore.getState().language;
    const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
    const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);

    const title =
      lang === 'it'
        ? `⏰ Match in arrivo tra ${minutesBefore} minuti`
        : lang === 'es'
        ? `⏰ Partido en ${minutesBefore} minutos`
        : `⏰ Match starting in ${minutesBefore} minutes`;

    const courtPrep = lang === 'it' ? ' su ' : lang === 'es' ? ' en ' : ' on ';
    const court = match.courtName ? `${courtPrep}${match.courtName}` : '';

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: `${team1} vs ${team2}${court}`,
        data: {
          matchId: match.matchId,
          eventId: event?.eventId || event?.id,
          screen: 'Match',
        },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerTime,
      },
    });

    return id;
  } catch (e) {
    console.warn('Error scheduling match reminder:', e);
    return null;
  }
}

/**
 * Cancels a scheduled notification by its ID
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Error canceling notification:', e);
  }
}
