import { FipEvent, Match, StatsResponse } from '../types/models';
import { getMatchesDirect, getMatchStatsDirect } from './matchScorerLive';
import { getLocalUtcOffsetMinutes } from '../utils/date';
import calendarData from '../assets/data/calendar_2026.json';

/**
 * Recupera l'elenco dei tornei.
 * Utilizza il dataset ufficiale incorporato completo di tutti i tornei
 * Premier Padel e FIP 2026 con copertine ufficiali e eventId.
 */
export async function getEvents(): Promise<FipEvent[]> {
  try {
    if (Array.isArray(calendarData) && calendarData.length > 0) {
      return calendarData as FipEvent[];
    }
  } catch (err) {
    console.warn('Error reading embedded calendar data:', err);
  }
  return [];
}

/**
 * Recupera le partite di un torneo per una giornata.
 * Priorità: Interrogazione diretta ufficiale di MatchScorerLive.
 */
export async function getMatches(
  tournamentIdOrEventId: string,
  day: number,
  utcOffsetMinutes: number = getLocalUtcOffsetMinutes()
): Promise<Match[]> {
  try {
    const directMatches = await getMatchesDirect(tournamentIdOrEventId, day);
    return directMatches;
  } catch (err) {
    console.warn('Direct MatchScorerLive error:', err);
    return [];
  }
}

/**
 * Recupera le statistiche avanzate di una singola partita direttamente da MatchScorerLive.
 */
export async function getMatchStats(
  matchId: string,
  eventId: string
): Promise<StatsResponse> {
  try {
    const directStats = await getMatchStatsDirect(matchId, eventId);
    return directStats;
  } catch (err) {
    console.warn('Direct MatchScorerLive stats error:', err);
    return { duration: '' };
  }
}
