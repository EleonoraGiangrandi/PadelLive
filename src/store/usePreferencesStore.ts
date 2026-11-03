import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gender } from '../types/models';

export type ThemeMode = 'dark' | 'light';

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
  setGenre: (genre: Gender) => void;
  toggleCategory: (category: string) => void;
  selectAllCategories: () => void;
  clearCategories: () => void;
  setSearchQuery: (query: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  loadPreferences: () => Promise<void>;
}

const PREF_GENRE_KEY = '@padely_genre';
const PREF_FILTERS_KEY = '@padely_filters_v2';
const PREF_THEME_KEY = '@padely_theme_mode';

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  genre: 'both',
  selectedCategories: ALL_TOURNAMENT_CATEGORIES.map((c) => c.id),
  searchQuery: '',
  isFilterLoaded: false,
  themeMode: 'dark',

  setGenre: async (genre: Gender) => {
    set({ genre });
    try {
      await AsyncStorage.setItem(PREF_GENRE_KEY, genre);
    } catch (e) {
      console.warn('Error saving genre:', e);
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
      const savedGenre = await AsyncStorage.getItem(PREF_GENRE_KEY);
      const savedFilters = await AsyncStorage.getItem(PREF_FILTERS_KEY);
      const savedTheme = await AsyncStorage.getItem(PREF_THEME_KEY);

      set({
        genre: (savedGenre as Gender) || 'both',
        selectedCategories: savedFilters
          ? JSON.parse(savedFilters)
          : ALL_TOURNAMENT_CATEGORIES.map((c) => c.id),
        themeMode: savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark',
        isFilterLoaded: true,
      });
    } catch (e) {
      console.warn('Error loading preferences:', e);
      set({ isFilterLoaded: true });
    }
  },
}));
