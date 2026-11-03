import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Match, FipEvent } from '../types/models';

const CHANNEL_ID = 'padel_live_matches';

/**
 * Inizializza il gestore delle notifiche e il canale Android
 */
export async function setupNotifications(): Promise<void> {
  try {
    // Configura il comportamento quando l'app è in primo piano
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
        name: 'Partite Live PadelLive',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00e676',
        enableVibrate: true,
        showBadge: true,
      });
    }
  } catch (error) {
    console.warn('Errore setup notifiche:', error);
  }
}

/**
 * Richiede i permessi per mostrare notifiche
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
    console.warn('Errore richiesta permessi notifiche:', e);
    return false;
  }
}

/**
 * Costruisce una stringa leggibile per una coppia di giocatori
 */
export function formatTeamNames(p1?: string, p2?: string): string {
  if (p1 && p2) return `${p1} / ${p2}`;
  return p1 || p2 || 'TBD';
}

/**
 * Invia una notifica locale immediata
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
      trigger: null, // trigger null = invio immediato
    });
    return id;
  } catch (error) {
    console.warn('Errore invio notifica locale:', error);
    return null;
  }
}

/**
 * Notifica per l'inizio di una partita
 */
export async function notifyMatchStart(match: Match, event?: FipEvent): Promise<string | null> {
  const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
  const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);
  const court = match.courtName ? ` su ${match.courtName}` : '';
  const round = match.roundName ? ` (${match.roundName})` : '';

  return sendLocalNotification(
    '🎾 Match Iniziato!',
    `${team1} vs ${team2}${court}${round}`,
    {
      matchId: match.matchId,
      eventId: event?.eventId || event?.id,
      screen: 'Match',
    }
  );
}

/**
 * Notifica per la fine di un set
 */
export async function notifySetEnd(
  match: Match,
  setNumber: number,
  scoreStr: string,
  event?: FipEvent
): Promise<string | null> {
  const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
  const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);

  return sendLocalNotification(
    `🎾 Fine ${setNumber}° Set (${scoreStr})`,
    `${team1} vs ${team2}`,
    {
      matchId: match.matchId,
      eventId: event?.eventId || event?.id,
      screen: 'Match',
    }
  );
}

/**
 * Notifica per la conclusione del match con punteggio
 */
export async function notifyMatchEnd(match: Match, event?: FipEvent): Promise<string | null> {
  const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
  const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);

  const t1Winner = match.team1?.isWinner;
  const t2Winner = match.team2?.isWinner;
  const winner = t1Winner ? team1 : t2Winner ? team2 : null;

  // Costruisci il punteggio dei set: es. "6-4 3-6 7-6"
  const sets = [
    match.team1?.set1 && match.team2?.set1 ? `${match.team1.set1}-${match.team2.set1}` : null,
    match.team1?.set2 && match.team2?.set2 ? `${match.team1.set2}-${match.team2.set2}` : null,
    match.team1?.set3 && match.team2?.set3 ? `${match.team1.set3}-${match.team2.set3}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const title = winner ? `🏆 Vince ${winner}!` : '🏆 Match Concluso!';
  const body = sets ? `Risultato finale: ${sets} (${team1} vs ${team2})` : `${team1} vs ${team2}`;

  return sendLocalNotification(title, body, {
    matchId: match.matchId,
    eventId: event?.eventId || event?.id,
    screen: 'Match',
  });
}

/**
 * Programma un promemoria prima dell'inizio del match
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
      return null; // Già passato
    }

    const team1 = formatTeamNames(match.team1?.player1?.name, match.team1?.player2?.name);
    const team2 = formatTeamNames(match.team2?.player1?.name, match.team2?.player2?.name);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Match in arrivo tra ${minutesBefore} minuti`,
        body: `${team1} vs ${team2}${match.courtName ? ` su ${match.courtName}` : ''}`,
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
    console.warn('Errore scheduling promemoria match:', e);
    return null;
  }
}

/**
 * Cancella una notifica programmata tramite il suo ID
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Errore cancellazione notifica:', e);
  }
}
