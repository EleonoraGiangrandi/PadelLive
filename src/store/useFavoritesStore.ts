import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritePlayer, PlayerRanking, Player } from '../types/models';

const FAVORITES_STORAGE_KEY = '@padely_favorite_players_v1';

/**
 * Normalizza una stringa rimuovendo accenti, punteggiatura e convertendo in minuscolo
 */
export function normalizePlayerName(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se il nome di un giocatore presente in una partita (es. "A. Coello" o "Arturo Coello")
 * corrisponde a un giocatore preferito.
 */
export function matchesPlayerName(matchPlayerName: string = '', favoriteName: string = ''): boolean {
  if (!matchPlayerName || !favoriteName) return false;

  const normMatch = normalizePlayerName(matchPlayerName);
  const normFav = normalizePlayerName(favoriteName);

  if (normMatch === normFav) return true;

  const matchTokens = normMatch.split(' ').filter((t) => t.length > 1);
  const favTokens = normFav.split(' ').filter((t) => t.length > 1);

  if (favTokens.length === 0 || matchTokens.length === 0) return false;

  const significantFavTokens = favTokens.filter((t) => t.length >= 3);
  const significantMatchTokens = matchTokens.filter((t) => t.length >= 3);

  return significantMatchTokens.some((mt) => significantFavTokens.includes(mt));
}

interface FavoritesState {
  favorites: FavoritePlayer[];
  isFavoritesLoaded: boolean;
  loadFavorites: () => Promise<void>;
  addFavorite: (player: FavoritePlayer | PlayerRanking) => Promise<void>;
  removeFavorite: (idOrName: string) => Promise<void>;
  toggleFavorite: (player: FavoritePlayer | PlayerRanking) => Promise<boolean>;
  isFavorite: (idOrName?: string) => boolean;
  isPlayerFavorite: (player?: Player | { name?: string; handler?: string; id?: string }) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isFavoritesLoaded: false,

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ favorites: Array.isArray(parsed) ? parsed : [], isFavoritesLoaded: true });
      } else {
        set({ favorites: [], isFavoritesLoaded: true });
      }
    } catch (e) {
      console.warn('Errore nel caricamento dei preferiti:', e);
      set({ isFavoritesLoaded: true });
    }
  },

  addFavorite: async (player) => {
    const { favorites } = get();
    const id = (player as any).handler || player.id || player.name;
    const cleanName = normalizePlayerName(player.name);

    const alreadyExists = favorites.some(
      (f) =>
        f.id === id ||
        (f.handler && (player as any).handler && f.handler === (player as any).handler) ||
        normalizePlayerName(f.name) === cleanName
    );

    if (alreadyExists) return;

    const newFav: FavoritePlayer = {
      id,
      name: player.name,
      surname: (player as PlayerRanking).surname,
      country: player.country,
      flag: player.flag,
      image: player.image,
      position: (player as PlayerRanking).position,
      handler: (player as any).handler || (player as any).id || id,
      gender: (player as any).gender,
      addedAt: Date.now(),
    };

    const nextFavorites = [newFav, ...favorites];
    set({ favorites: nextFavorites });
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch (e) {
      console.warn('Errore nel salvataggio preferiti:', e);
    }
  },

  removeFavorite: async (idOrName: string) => {
    if (!idOrName) return;
    const { favorites } = get();
    const cleanTarget = normalizePlayerName(idOrName);

    const nextFavorites = favorites.filter(
      (f) =>
        f.id !== idOrName &&
        f.handler !== idOrName &&
        normalizePlayerName(f.name) !== cleanTarget &&
        normalizePlayerName(f.id) !== cleanTarget
    );

    set({ favorites: nextFavorites });
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch (e) {
      console.warn('Errore nella rimozione del preferito:', e);
    }
  },

  toggleFavorite: async (player) => {
    const { favorites, addFavorite, removeFavorite } = get();
    if (!player) return false;

    const id = (player as any).handler || player.id || player.name;
    const cleanName = normalizePlayerName(player.name);

    const existing = favorites.find(
      (f) =>
        f.id === id ||
        (f.handler && (player as any).handler && f.handler === (player as any).handler) ||
        normalizePlayerName(f.name) === cleanName ||
        (player.name && matchesPlayerName(player.name, f.name))
    );

    if (existing) {
      await removeFavorite(existing.id);
      return false;
    } else {
      await addFavorite(player);
      return true;
    }
  },

  isFavorite: (idOrName?: string) => {
    if (!idOrName) return false;
    const { favorites } = get();
    const clean = normalizePlayerName(idOrName);
    return favorites.some(
      (f) =>
        f.id === idOrName ||
        f.handler === idOrName ||
        normalizePlayerName(f.name) === clean ||
        matchesPlayerName(idOrName, f.name)
    );
  },

  isPlayerFavorite: (player?: Player | { name?: string; handler?: string; id?: string }) => {
    if (!player) return false;
    const { favorites } = get();
    const clean = player.name ? normalizePlayerName(player.name) : '';
    const id = (player as any).handler || (player as any).id;

    return favorites.some((f) => {
      if (id && f.id === id) return true;
      if (f.handler && (player as any).handler && f.handler === (player as any).handler) return true;
      if (clean && normalizePlayerName(f.name) === clean) return true;
      if (player.name && f.name && matchesPlayerName(player.name, f.name)) return true;
      return false;
    });
  },
}));
