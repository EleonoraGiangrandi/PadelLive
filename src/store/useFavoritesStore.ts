import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritePlayer, PlayerRanking, Player } from '../types/models';

const FAVORITES_STORAGE_KEY = '@padellive_favorite_players_v1';
const LEGACY_STORAGE_KEY = '@padely_favorite_players_v1';

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
 * corrisponde a un giocatore preferito (es. "Arturo Coello Manso").
 */
export function matchesPlayerName(matchPlayerName: string = '', favoriteName: string = ''): boolean {
  if (!matchPlayerName || !favoriteName) return false;

  const normMatch = normalizePlayerName(matchPlayerName);
  const normFav = normalizePlayerName(favoriteName);

  if (normMatch === normFav) return true;

  const matchTokens = normMatch.split(' ').filter((t) => t.length > 0);
  const favTokens = normFav.split(' ').filter((t) => t.length > 0);

  if (favTokens.length === 0 || matchTokens.length === 0) return false;

  // Stop words nei nomi spagnoli / italiani
  const stopWords = new Set(['de', 'del', 'la', 'las', 'los', 'san', 'di', 'da', 'y']);

  const cleanFav = favTokens.filter((t) => !stopWords.has(t));
  const cleanMatch = matchTokens.filter((t) => !stopWords.has(t));

  if (cleanFav.length === 0 || cleanMatch.length === 0) return false;

  const favFirstName = cleanFav[0];
  const favSurnames = cleanFav.length > 1 ? cleanFav.slice(1) : [favFirstName];

  // Verifica se il primo token del match è un'iniziale (lunghezza 1, es. "A" in "A. Coello")
  const matchFirst = cleanMatch[0];
  const isInitial = matchFirst.length === 1;

  const matchSurnames = isInitial
    ? cleanMatch.slice(1)
    : cleanMatch.length > 1
    ? cleanMatch.slice(1)
    : [matchFirst];

  // Almeno uno dei cognomi significativi del preferito (lunghezza >= 3) deve corrispondere a un cognome del match
  const hasMatchingSurname = favSurnames.some(
    (fs) => fs.length >= 3 && matchSurnames.some((ms) => ms.length >= 3 && (fs === ms || fs.startsWith(ms) || ms.startsWith(fs)))
  );

  if (!hasMatchingSurname) {
    return false;
  }

  // Se un cognome corrisponde:
  // Se il match ha un'iniziale (es. "A." per "Arturo"), deve combaciare con l'iniziale del nome del preferito
  if (isInitial) {
    return favFirstName.startsWith(matchFirst);
  }

  // Se il match ha un nome per esteso (es. "Arturo" in "Arturo Coello")
  if (cleanMatch.length > 1) {
    return (
      favFirstName === matchFirst ||
      favFirstName.startsWith(matchFirst.charAt(0)) ||
      cleanFav.includes(matchFirst)
    );
  }

  // Se è presente solo il cognome (es. "Coello") ed è univoco rispetto al preferito
  return true;
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
      let stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!stored) {
        stored = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      }
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
    return favorites.some((f) => {
      const fullFavName = f.surname ? `${f.name} ${f.surname}` : f.name;
      return (
        f.id === idOrName ||
        f.handler === idOrName ||
        normalizePlayerName(f.name) === clean ||
        normalizePlayerName(fullFavName) === clean ||
        matchesPlayerName(idOrName, fullFavName)
      );
    });
  },

  isPlayerFavorite: (player?: Player | { name?: string; handler?: string; id?: string }) => {
    if (!player) return false;
    const { favorites } = get();
    const clean = player.name ? normalizePlayerName(player.name) : '';
    const id = (player as any).handler || (player as any).id;

    return favorites.some((f) => {
      if (id && f.id === id) return true;
      if (f.handler && (player as any).handler && f.handler === (player as any).handler) return true;
      const fullFavName = f.surname ? `${f.name} ${f.surname}` : f.name;
      if (clean && (normalizePlayerName(f.name) === clean || normalizePlayerName(fullFavName) === clean)) return true;
      if (player.name && matchesPlayerName(player.name, fullFavName)) return true;
      return false;
    });
  },
}));
