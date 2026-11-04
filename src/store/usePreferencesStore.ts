import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gender } from '../types/models';
import { AppLanguage } from '../i18n/types';

export type ThemeMode = 'dark' | 'light';
export type HomeTab = 'in_corso' | 'futuri' | 'recenti' | 'tutti';
export type RankingsGender = 'men' | 'women';
export type RankingsViewMode = 'all' | 'favorites';
export type TournamentViewMode = 'matches' | 'draw';

export interface CategoryDefinition {
  id: string;
  label: string;
  types: string[];
}

export const ALL_TOURNAMENT_CATEGORIES: CategoryDefinition[] = [
  { id: 'premier-major', label: 'Premier Major', types: ['fip-ppt-major', 'premier-major'] },
  { id: 'premier-p1', label: 'Premier P1', types: ['fip-ppt-p1', 'premier-p1'] },
  { id: 'premier-p2', label: 'Premier P2', types: ['fip-pp-p2', 'premier-p2'] },
  { id: 'premier-finals', label: 'Premier Finals', types: ['fip-pp-master-finals', 'premier-master'] },
  { id: 'fip-platinum', label: 'FIP Platinum', types: ['fip-tour-platinum', 'fip-platinum'] },
  { id: 'fip-gold', label: 'FIP Gold', types: ['fip-tour-gold', 'fip-gold'] },
  { id: 'fip-silver', label: 'FIP Silver', types: ['fip-tour-silver', 'fip-silver'] },
  { id: 'fip-bronze', label: 'FIP Bronze', types: ['fip-tour-bronze', 'fip-bronze'] },
  {
    id: 'fip-other',
    label: 'Altri Tornei FIP',
    types: ['fip-beyond-b1', 'fip-beyond-b2', 'fip-beyond-b3', 'hexagon-world-series', 'olympic-path-events'],
  },
];

interface PreferencesState {
  genre: Gender;
  selectedCategories: string[];
  searchQuery: string;
  isFilterLoaded: boolean;
  themeMode: ThemeMode;
  language: AppLanguage;
  homeTab: HomeTab;
  rankingsGender: RankingsGender;
  rankingsViewMode: RankingsViewMode;
  tournamentViewMode: TournamentViewMode;
  setGenre: (genre: Gender) => void;
  toggleCategory: (category: string) => void;
  selectAllCategories: () => void;
  clearCategories: () => void;
  setSearchQuery: (query: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setLanguage: (lang: AppLanguage) => void;
  setHomeTab: (tab: HomeTab) => void;
  setRankingsGender: (gender: RankingsGender) => void;
  setRankingsViewMode: (mode: RankingsViewMode) => void;
  setTournamentViewMode: (mode: TournamentViewMode) => void;
  loadPreferences: () => Promise<void>;
}

const PREF_GENRE_KEY = '@padellive_genre';
const PREF_FILTERS_KEY = '@padellive_filters_v2';
const PREF_THEME_KEY = '@padellive_theme_mode';
const PREF_LANGUAGE_KEY = '@padellive_language_v1';
const PREF_HOME_TAB_KEY = '@padellive_home_tab_v1';
const PREF_RANKINGS_GENDER_KEY = '@padellive_rankings_gender_v1';
const PREF_RANKINGS_VIEW_KEY = '@padellive_rankings_view_v1';
const PREF_TOURNAMENT_VIEW_KEY = '@padellive_tournament_view_v1';

const LEGACY_PREF_GENRE_KEY = '@padely_genre';
const LEGACY_PREF_FILTERS_KEY = '@padely_filters_v2';
const LEGACY_PREF_THEME_KEY = '@padely_theme_mode';
const LEGACY_PREF_LANGUAGE_KEY = '@padely_language_v1';
const LEGACY_PREF_HOME_TAB_KEY = '@padely_home_tab_v1';
const LEGACY_PREF_RANKINGS_GENDER_KEY = '@padely_rankings_gender_v1';
const LEGACY_PREF_RANKINGS_VIEW_KEY = '@padely_rankings_view_v1';
const LEGACY_PREF_TOURNAMENT_VIEW_KEY = '@padely_tournament_view_v1';

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  genre: 'both',
  selectedCategories: ALL_TOURNAMENT_CATEGORIES.map((c) => c.id),
  searchQuery: '',
  isFilterLoaded: false,
  themeMode: 'dark',
  language: 'en', // Default in inglese come richiesto
  homeTab: 'in_corso',
  rankingsGender: 'men',
  rankingsViewMode: 'all',
  tournamentViewMode: 'matches',

  setGenre: async (genre: Gender) => {
    set({ genre });
    try {
      await AsyncStorage.setItem(PREF_GENRE_KEY, genre);
    } catch (e) {
      console.warn('Error saving genre:', e);
    }
  },

  setLanguage: async (language: AppLanguage) => {
    set({ language });
    try {
      await AsyncStorage.setItem(PREF_LANGUAGE_KEY, language);
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  },

  setThemeMode: async (themeMode: ThemeMode) => {
    set({ themeMode });
    try {
      await AsyncStorage.setItem(PREF_THEME_KEY, themeMode);
    } catch (e) {
      console.warn('Error saving theme mode:', e);
    }
  },

  toggleThemeMode: async () => {
    const nextMode: ThemeMode = get().themeMode === 'dark' ? 'light' : 'dark';
    set({ themeMode: nextMode });
    try {
      await AsyncStorage.setItem(PREF_THEME_KEY, nextMode);
    } catch (e) {
      console.warn('Error toggling theme mode:', e);
    }
  },

  setHomeTab: async (homeTab: HomeTab) => {
    set({ homeTab });
    try {
      await AsyncStorage.setItem(PREF_HOME_TAB_KEY, homeTab);
    } catch (e) {
      console.warn('Error saving home tab:', e);
    }
  },

  setRankingsGender: async (rankingsGender: RankingsGender) => {
    set({ rankingsGender });
    try {
      await AsyncStorage.setItem(PREF_RANKINGS_GENDER_KEY, rankingsGender);
    } catch (e) {
      console.warn('Error saving rankings gender:', e);
    }
  },

  setRankingsViewMode: async (rankingsViewMode: RankingsViewMode) => {
    set({ rankingsViewMode });
    try {
      await AsyncStorage.setItem(PREF_RANKINGS_VIEW_KEY, rankingsViewMode);
    } catch (e) {
      console.warn('Error saving rankings view mode:', e);
    }
  },

  setTournamentViewMode: async (tournamentViewMode: TournamentViewMode) => {
    set({ tournamentViewMode });
    try {
      await AsyncStorage.setItem(PREF_TOURNAMENT_VIEW_KEY, tournamentViewMode);
    } catch (e) {
      console.warn('Error saving tournament view mode:', e);
    }
  },

  toggleCategory: async (category: string) => {
    const current = get().selectedCategories;
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];

    set({ selectedCategories: next });
    try {
      await AsyncStorage.setItem(PREF_FILTERS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Error saving filters:', e);
    }
  },

  selectAllCategories: async () => {
    const all = ALL_TOURNAMENT_CATEGORIES.map((c) => c.id);
    set({ selectedCategories: all });
    try {
      await AsyncStorage.setItem(PREF_FILTERS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('Error saving filters:', e);
    }
  },

  clearCategories: async () => {
    set({ selectedCategories: [] });
    try {
      await AsyncStorage.setItem(PREF_FILTERS_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Error saving filters:', e);
    }
  },

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
  },

  loadPreferences: async () => {
    try {
      let [
        savedGenre,
        savedFilters,
        savedTheme,
        savedLang,
        savedHomeTab,
        savedRankingsGender,
        savedRankingsView,
        savedTournamentView,
      ] = await Promise.all([
        AsyncStorage.getItem(PREF_GENRE_KEY),
        AsyncStorage.getItem(PREF_FILTERS_KEY),
        AsyncStorage.getItem(PREF_THEME_KEY),
        AsyncStorage.getItem(PREF_LANGUAGE_KEY),
        AsyncStorage.getItem(PREF_HOME_TAB_KEY),
        AsyncStorage.getItem(PREF_RANKINGS_GENDER_KEY),
        AsyncStorage.getItem(PREF_RANKINGS_VIEW_KEY),
        AsyncStorage.getItem(PREF_TOURNAMENT_VIEW_KEY),
      ]);

      if (!savedGenre) savedGenre = await AsyncStorage.getItem(LEGACY_PREF_GENRE_KEY);
      if (!savedFilters) savedFilters = await AsyncStorage.getItem(LEGACY_PREF_FILTERS_KEY);
      if (!savedTheme) savedTheme = await AsyncStorage.getItem(LEGACY_PREF_THEME_KEY);
      if (!savedLang) savedLang = await AsyncStorage.getItem(LEGACY_PREF_LANGUAGE_KEY);
      if (!savedHomeTab) savedHomeTab = await AsyncStorage.getItem(LEGACY_PREF_HOME_TAB_KEY);
      if (!savedRankingsGender) savedRankingsGender = await AsyncStorage.getItem(LEGACY_PREF_RANKINGS_GENDER_KEY);
      if (!savedRankingsView) savedRankingsView = await AsyncStorage.getItem(LEGACY_PREF_RANKINGS_VIEW_KEY);
      if (!savedTournamentView) savedTournamentView = await AsyncStorage.getItem(LEGACY_PREF_TOURNAMENT_VIEW_KEY);

      const validLang = savedLang === 'it' || savedLang === 'es' || savedLang === 'en' ? savedLang : 'en';

      set({
        genre: (savedGenre as Gender) || 'both',
        selectedCategories: savedFilters
          ? JSON.parse(savedFilters)
          : ALL_TOURNAMENT_CATEGORIES.map((c) => c.id),
        themeMode: savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark',
        language: validLang,
        homeTab: (savedHomeTab as HomeTab) || 'in_corso',
        rankingsGender: (savedRankingsGender as RankingsGender) || 'men',
        rankingsViewMode: (savedRankingsView as RankingsViewMode) || 'all',
        tournamentViewMode: (savedTournamentView as TournamentViewMode) || 'matches',
        isFilterLoaded: true,
      });
    } catch (e) {
      console.warn('Error loading preferences:', e);
      set({ isFilterLoaded: true });
    }
  },
}));
