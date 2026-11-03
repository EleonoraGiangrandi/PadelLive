import { Match, FipEvent, Player } from '../types/models';
import { useNotificationStore } from '../store/useNotificationStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { notifyMatchStart, notifyMatchEnd, notifySetEnd } from './notificationService';

interface TrackedMatchState {
  hasStarted: boolean;
  hasCompleted: boolean;
  completedSetsCount: number;
  scheduledReminderId?: string | null;
}

// Mappa in-memory dello stato dei match per evitare notifiche duplicate durante la sessione
const trackedStateMap = new Map<string, TrackedMatchState>();

/**
 * Verifica se un match coinvolge almeno un giocatore presente tra i preferiti
 */
export function matchHasFavoritePlayer(match: Match): boolean {
  const { isPlayerFavorite, favorites } = useFavoritesStore.getState();
  if (!favorites || favorites.length === 0) return false;

  const players: (Player | undefined)[] = [
    match.team1?.player1,
    match.team1?.player2,
    match.team2?.player1,
    match.team2?.player2,
  ];

  return players.some((p) => !!p && isPlayerFavorite(p));
}

/**
 * Determina se un match deve generare notifiche secondo le preferenze dell'utente
 */
export function shouldNotifyForMatch(match: Match): boolean {
  const { preferences, followedMatchIds } = useNotificationStore.getState();

  if (!preferences.enabled) return false;

  // Se l'utente ha cliccato esplicitamente la campanella su questo incontro
  if (followedMatchIds.includes(match.matchId)) {
    return true;
  }

  // Se l'utente vuole notifiche SOLO per i suoi preferiti
  if (preferences.onlyFavorites) {
    return matchHasFavoritePlayer(match);
  }

  // Altrimenti, notifiche attive per tutte le partite
  return true;
}

/**
 * Calcola quanti set sono stati completati in questo momento
 */
function getCompletedSetsCount(match: Match, isFinished: boolean): number {
  let count = 0;
  const s1_1 = match.team1?.set1;
  const s1_2 = match.team2?.set1;
  const s2_1 = match.team1?.set2;
  const s2_2 = match.team2?.set2;
  const s3_1 = match.team1?.set3;
  const s3_2 = match.team2?.set3;

  // Set 1 completato se c'è un punteggio nel set 2 o se il match è finito
  if (s1_1 && s1_2 && s1_1 !== '-' && (s2_1 || isFinished)) {
    count++;
  }
  // Set 2 completato se c'è un punteggio nel set 3 o se il match è finito con 2 set
  if (s2_1 && s2_2 && s2_1 !== '-' && (s3_1 || isFinished)) {
    count++;
  }
  // Set 3 completato se il match è finito
  if (s3_1 && s3_2 && s3_1 !== '-' && isFinished) {
    count++;
  }

  return count;
}

/**
 * Elabora la lista dei match ricevuta dall'API / polling e invia le notifiche pertinenti
 */
export async function evaluateMatches(matches: Match[], event?: FipEvent): Promise<void> {
  const { preferences } = useNotificationStore.getState();
  if (!preferences.enabled || !matches || matches.length === 0) return;

  for (const match of matches) {
    if (!match.matchId) continue;

    const isFinished =
      match.status === 'completed' ||
      Boolean(match.team1?.isWinner) ||
      Boolean(match.team2?.isWinner);

    const isOngoing =
      Boolean(match.isLive) ||
      match.status === 'live' ||
      (!isFinished &&
        (Boolean(match.team1?.points) ||
          Boolean(match.team2?.points) ||
          match.team1?.isServing ||
          match.team2?.isServing));

    // Recupera o inizializza lo stato tracciato
    let state = trackedStateMap.get(match.matchId);
    if (!state) {
      state = {
        hasStarted: isOngoing || isFinished,
        hasCompleted: isFinished,
        completedSetsCount: getCompletedSetsCount(match, isFinished),
      };
      trackedStateMap.set(match.matchId, state);
      // Se è la primissima volta che lo vediamo, non spammiamo notifiche per match già iniziati o già finiti in precedenza
      continue;
    }

    // Se l'incontro non rientra nei criteri di notifica dell'utente, aggiorniamo lo stato senza notificare
    if (!shouldNotifyForMatch(match)) {
      state.hasStarted = state.hasStarted || isOngoing || isFinished;
      state.hasCompleted = state.hasCompleted || isFinished;
      state.completedSetsCount = getCompletedSetsCount(match, isFinished);
      continue;
    }

    // 1. Controllo Inizio Match
    if (isOngoing && !state.hasStarted && !isFinished) {
      state.hasStarted = true;
      if (preferences.notifyMatchStart) {
        await notifyMatchStart(match, event);
      }
    }

    // 2. Controllo Fine Set
    const currentCompletedSets = getCompletedSetsCount(match, isFinished);
    if (currentCompletedSets > state.completedSetsCount && !isFinished) {
      if (preferences.notifySetEnd) {
        const lastSetNum = currentCompletedSets;
        let scoreStr = '';
        if (lastSetNum === 1) scoreStr = `${match.team1.set1}-${match.team2.set1}`;
        else if (lastSetNum === 2) scoreStr = `${match.team1.set2}-${match.team2.set2}`;
        await notifySetEnd(match, lastSetNum, scoreStr, event);
      }
      state.completedSetsCount = currentCompletedSets;
    }

    // 3. Controllo Fine Match
    if (isFinished && !state.hasCompleted) {
      state.hasCompleted = true;
      state.hasStarted = true;
      state.completedSetsCount = currentCompletedSets;
      if (preferences.notifyMatchEnd) {
        await notifyMatchEnd(match, event);
      }
    }
  }
}
