import { FipEvent, Match, PlayerRanking } from './models';

export type RootStackParamList = {
  MainTabs: undefined;
  Tournament: { event: FipEvent };
  Match: { match: Match; event: FipEvent; day: number };
  Profile: { player: PlayerRanking };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  RankingsTab: undefined;
  NewsTab: undefined;
  SettingsTab: undefined;
};
