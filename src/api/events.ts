import { FipEvent, Match, StatsResponse } from '../types/models';
import { getMatchesDirect, getMatchStatsDirect } from './matchScorerLive';
import { getLocalUtcOffsetMinutes } from '../utils/date';
import calendarData from '../assets/data/calendar_2026.json';

/**
 * Retrieves the list of tournaments.
 * Uses the complete embedded official dataset of all
 * Premier Padel and FIP 2026 tournaments with official covers and eventIds.
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
 * Retrieves matches of a tournament for a given day.
 * Priority: Official direct query to MatchScorerLive.
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
 * Retrieves advanced statistics for a single match directly from MatchScorerLive.
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
