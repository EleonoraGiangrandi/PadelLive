import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPreferences } from '../types/models';

const NOTIF_PREFS_KEY = '@padely_notif_prefs_v1';
const FOLLOWED_MATCHES_KEY = '@padely_followed_matches_v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  onlyFavorites: false,
  notifyMatchStart: true,
  notifyMatchEnd: true,
  notifySetEnd: true,
  reminderMinutes: 10,
  sound: true,
  vibration: true,
};

interface NotificationState {
  preferences: NotificationPreferences;
  followedMatchIds: string[];
  isPreferencesLoaded: boolean;
  loadPreferences: () => Promise<void>;
  updatePreferences: (partial: Partial<NotificationPreferences>) => Promise<void>;
  toggleFollowMatch: (matchId: string) => Promise<boolean>;
  isMatchFollowed: (matchId: string) => boolean;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  followedMatchIds: [],
  isPreferencesLoaded: false,

  loadPreferences: async () => {
    try {
      const [savedPrefs, savedFollowed] = await Promise.all([
        AsyncStorage.getItem(NOTIF_PREFS_KEY),
        AsyncStorage.getItem(FOLLOWED_MATCHES_KEY),
      ]);

      const parsedPrefs = savedPrefs
        ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(savedPrefs) }
        : DEFAULT_NOTIFICATION_PREFERENCES;

      const parsedFollowed = savedFollowed ? JSON.parse(savedFollowed) : [];

      set({
        preferences: parsedPrefs,
        followedMatchIds: Array.isArray(parsedFollowed) ? parsedFollowed : [],
        isPreferencesLoaded: true,
      });
    } catch (e) {
      console.warn('Errore nel caricamento preferenze notifiche:', e);
      set({ isPreferencesLoaded: true });
    }
  },

  updatePreferences: async (partial) => {
    const current = get().preferences;
    const next = { ...current, ...partial };
    set({ preferences: next });
    try {
      await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Errore nel salvataggio preferenze notifiche:', e);
    }
  },

  toggleFollowMatch: async (matchId: string) => {
    if (!matchId) return false;
    const { followedMatchIds } = get();
    const isFollowing = followedMatchIds.includes(matchId);
    const next = isFollowing
      ? followedMatchIds.filter((id) => id !== matchId)
      : [...followedMatchIds, matchId];

    set({ followedMatchIds: next });
    try {
      await AsyncStorage.setItem(FOLLOWED_MATCHES_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Errore nel salvataggio match seguiti:', e);
    }
    return !isFollowing;
  },

  isMatchFollowed: (matchId: string) => {
    if (!matchId) return false;
    return get().followedMatchIds.includes(matchId);
  },
}));
