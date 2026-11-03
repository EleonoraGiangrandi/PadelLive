export type Gender = 'men' | 'women' | 'both';

export type TournamentCategory =
  | 'premier-major'
  | 'premier-p1'
  | 'premier-p2'
  | 'premier-finals'
  | 'fip-tour-platinum'
  | 'fip-tour-gold'
  | 'fip-tour-star'
  | 'fip-tour-rise'
  | 'fip-tour-promotion'
  | 'fip-tour-bronze'
  | 'fip-tour-silver'
  | 'world-championship'
  | 'other';

export interface FipEvent {
  id: string;
  name: string;
  startDate: string; // "DD/MM/YYYY"
  endDate: string;   // "DD/MM/YYYY"
  href: string;
  type: string;
  cover: string;
  location: string;
  eventId?: string;
  matchscorerlive?: string;
}

export interface Player {
  name: string;
  flag: string;
}

export interface Team {
  player1: Player;
  player2: Player;
  points: string;     // "0", "15", "30", "40", "AD", or tie-break point
  set1: string;       // "6", "7(5)", "-"
  set2: string;
  set3: string;
  isWinner: boolean;
  isServing: boolean;
}

export interface Match {
  id?: number;
  matchId: string;
  courtName: string;
  roundName: string;
  startDate: string;  // "12:00 PM"
  team1: Team;
  team2: Team;
  isLive?: boolean;
  status?: 'live' | 'completed' | 'scheduled' | 'walkover';
  dayNumber?: number;
}

export interface ServeStats {
  aces?: string;
  doubleFaults?: string;
  serviceGames?: string;
  wonOnFirstServe?: string;
  wonOnSecondServe?: string;
}

export interface ReturnStats {
  returnGames?: string;
  wonOnFirstReturn?: string;
  wonOnSecondReturn?: string;
}

export interface MatchStatsItem {
  breakingPointsConverted?: string;
  longestStreak?: string;
  totalPointsWon?: string;
}

export interface TotalPointsStats {
  totalWonOnServe?: string;
  totalWonOnReturn?: string;
}

export interface StatsGroup {
  serve?: ServeStats;
  returnStats?: ReturnStats;
  match?: MatchStatsItem;
  totalPoints?: TotalPointsStats;
}

export interface SetStats {
  team1Stats: StatsGroup;
  team2Stats: StatsGroup;
}

export interface StatsResponse {
  duration?: string;
  set1?: SetStats;
  set2?: SetStats;
  set3?: SetStats;
  match?: SetStats;
}

export interface PlayerRanking {
  id: string;
  name: string;
  surname?: string;
  position: number;
  points: number | string;
  country: string;
  flag: string;
  image: string;
  rankDelta?: number;
  handler?: string;
}

export interface Partner {
  name: string;
  handler: string;
  imageUrl?: string;
}

export interface PlayerStats {
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  effectiveness?: string;
  bestRank?: number;
  race?: number;
  consecutiveVictories?: number;
}

export interface PlayerProfile {
  name?: string;
  rank?: number;
  country?: string;
  imageUrl?: string;
  points?: number;
  bornIn?: string;
  dob?: string;
  height?: string;
  playingPosition?: string;
  coach?: string;
  partner?: Partner;
  stats?: PlayerStats;
}

export interface RssArticle {
  title: string;
  description: string;
  date: string;
  image?: string;
  source: string;
  url: string;
}

export interface FavoritePlayer {
  id: string;
  name: string;
  surname?: string;
  country?: string;
  flag?: string;
  image?: string;
  position?: number;
  gender?: 'men' | 'women';
  handler?: string;
  addedAt: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  onlyFavorites: boolean;
  notifyMatchStart: boolean;
  notifyMatchEnd: boolean;
  notifySetEnd: boolean;
  reminderMinutes: number; // 0 (off), 5, 10, 15, 30
  sound: boolean;
  vibration: boolean;
}
