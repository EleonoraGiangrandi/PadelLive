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

// In-memory match state map to avoid duplicate notifications during session
const trackedStateMap = new Map<string, TrackedMatchState>();

/**
 * Checks whether a match involves at least one favorite player
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
 * Determines whether a match should trigger notifications according to user preferences
 */
export function shouldNotifyForMatch(match: Match): boolean {
  const { preferences, followedMatchIds } = useNotificationStore.getState();

  if (!preferences.enabled) return false;

  // If user explicitly tapped the bell for this match
  if (followedMatchIds.includes(match.matchId)) {
    return true;
  }

  // If user wants notifications ONLY for favorites
  if (preferences.onlyFavorites) {
    return matchHasFavoritePlayer(match);
  }

  // Otherwise, notifications active for all matches
  return true;
}

/**
 * Calculates how many sets have been completed so far
 */
function getCompletedSetsCount(match: Match, isFinished: boolean): number {
  let count = 0;
  const s1_1 = match.team1?.set1;
  const s1_2 = match.team2?.set1;
  const s2_1 = match.team1?.set2;
  const s2_2 = match.team2?.set2;
  const s3_1 = match.team1?.set3;
  const s3_2 = match.team2?.set3;

  // Set 1 completed if there is a score in set 2 or if the match has finished
  if (s1_1 && s1_2 && s1_1 !== '-' && (s2_1 || isFinished)) {
    count++;
  }
  // Set 2 completed if there is a score in set 3 or if the match finished in 2 sets
  if (s2_1 && s2_2 && s2_1 !== '-' && (s3_1 || isFinished)) {
    count++;
  }
  // Set 3 completed if the match finished
  if (s3_1 && s3_2 && s3_1 !== '-' && isFinished) {
    count++;
  }

  return count;
}

/**
 * Processes the match list from the API / polling and dispatches relevant notifications
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

    // Retrieve or initialize tracked state
    let state = trackedStateMap.get(match.matchId);
    if (!state) {
      state = {
        hasStarted: isOngoing || isFinished,
        hasCompleted: isFinished,
        completedSetsCount: getCompletedSetsCount(match, isFinished),
      };
      trackedStateMap.set(match.matchId, state);
      // If this is the first time we see it, do not spam notifications for matches already in progress or completed
      continue;
    }

    // If match does not meet user criteria, update state without sending notification
    if (!shouldNotifyForMatch(match)) {
      state.hasStarted = state.hasStarted || isOngoing || isFinished;
      state.hasCompleted = state.hasCompleted || isFinished;
      state.completedSetsCount = getCompletedSetsCount(match, isFinished);
      continue;
    }

    // 1. Match Start Check
    if (isOngoing && !state.hasStarted && !isFinished) {
      state.hasStarted = true;
      if (preferences.notifyMatchStart) {
        await notifyMatchStart(match, event);
      }
    }

    // 2. Set End Check
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

    // 3. Match End Check
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
