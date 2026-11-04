import { Linking } from 'react-native';
import { FipEvent, Match } from '../types/models';

export type StreamPlatform = 'youtube' | 'redbull';

export interface StreamInfo {
  isAvailable: boolean;
  platform: StreamPlatform;
  platformName: string;
  channelName: string;
  url: string;
  appUrl?: string;
  courtName?: string;
  isFinalStage: boolean;
  roundName?: string;
}

export interface CountryBroadcaster {
  countryCode: string;
  countryName: {
    en: string;
    it: string;
    es: string;
  };
  flag: string;
  channels: string[];
  notes?: {
    en: string;
    it: string;
    es: string;
  };
}

export const BROADCASTERS_BY_COUNTRY: CountryBroadcaster[] = [
  {
    countryCode: 'IT',
    countryName: { en: 'Italy', it: 'Italia', es: 'Italia' },
    flag: '🇮🇹',
    channels: ['Sky Sport / NOW', 'Red Bull TV', 'YouTube (Premier Padel / FIP)'],
    notes: {
      en: 'Early rounds & FIP Tour on YouTube; Quarterfinals to Finals on Red Bull TV & Sky Sport',
      it: 'Fasi iniziali e FIP Tour su YouTube; dai Quarti su Red Bull TV & Sky Sport',
      es: 'Primeras rondas y FIP Tour en YouTube; desde Cuartos en Red Bull TV y Sky Sport',
    },
  },
  {
    countryCode: 'ES',
    countryName: { en: 'Spain', it: 'Spagna', es: 'España' },
    flag: '🇪🇸',
    channels: ['Movistar Plus+', 'Red Bull TV', 'YouTube (Premier Padel / FIP)'],
    notes: {
      en: 'Early rounds on YouTube; Quarterfinals to Finals on Red Bull TV & Movistar+',
      it: 'Fasi iniziali su YouTube; dai Quarti su Red Bull TV & Movistar+',
      es: 'Primeras rondas en YouTube; desde Cuartos en Red Bull TV y Movistar+',
    },
  },
  {
    countryCode: 'AR',
    countryName: { en: 'Argentina & LatAm', it: 'Argentina & Sudamerica', es: 'Argentina y Latinoamérica' },
    flag: '🇦🇷',
    channels: ['ESPN / Disney+', 'Red Bull TV', 'YouTube (FIP Tour)'],
    notes: {
      en: 'Premier Padel on ESPN / Disney+ & Red Bull TV; FIP Tour on YouTube',
      it: 'Premier Padel su ESPN / Disney+ & Red Bull TV; FIP Tour su YouTube',
      es: 'Premier Padel en ESPN / Disney+ y Red Bull TV; FIP Tour en YouTube',
    },
  },
  {
    countryCode: 'FR',
    countryName: { en: 'France & Belgium', it: 'Francia & Belgio', es: 'Francia y Bélgica' },
    flag: '🇫🇷',
    channels: ['Canal+', 'Red Bull TV', 'YouTube'],
    notes: {
      en: 'Major Premier Padel matches on Canal+; early rounds on YouTube',
      it: 'Partite principali Premier Padel su Canal+; prime fasi su YouTube',
      es: 'Partidos principales de Premier Padel en Canal+; fases iniciales en YouTube',
    },
  },
  {
    countryCode: 'SE',
    countryName: { en: 'Nordic Countries', it: 'Paesi Nordici', es: 'Países Nórdicos' },
    flag: '🇸🇪',
    channels: ['Viaplay', 'Red Bull TV', 'YouTube'],
    notes: {
      en: 'Sweden, Denmark, Norway & Finland via Viaplay & Red Bull TV',
      it: 'Svezia, Danimarca, Norvegia e Finlandia su Viaplay & Red Bull TV',
      es: 'Suecia, Dinamarca, Noruega y Finlandia en Viaplay y Red Bull TV',
    },
  },
  {
    countryCode: 'US',
    countryName: { en: 'USA & North America', it: 'USA & Nord America', es: 'EE.UU. y Norteamérica' },
    flag: '🇺🇸',
    channels: ['beIN Sports', 'Red Bull TV', 'YouTube'],
    notes: {
      en: 'Free worldwide stream on Red Bull TV & official YouTube',
      it: 'Streaming gratuito mondiale su Red Bull TV & YouTube ufficiale',
      es: 'Emisión gratuita mundial en Red Bull TV y YouTube oficial',
    },
  },
  {
    countryCode: 'WW',
    countryName: { en: 'Rest of the World', it: 'Resto del Mondo', es: 'Resto del Mundo' },
    flag: '🌍',
    channels: ['Red Bull TV (Free)', 'YouTube (@PremierPadel / @padelfip)'],
    notes: {
      en: '100% free live streams on official YouTube & Red Bull TV apps',
      it: 'Streaming 100% gratuito sulle app ufficiali YouTube & Red Bull TV',
      es: 'Emisión 100% gratuita en las apps oficiales de YouTube y Red Bull TV',
    },
  },
];

/**
 * Determines whether a round corresponds to Quarterfinals or later
 */
export function isQuarterFinalOrLater(roundName?: string): boolean {
  if (!roundName) return false;
  const lower = roundName.toLowerCase();
  
  // Exclude "Round of 32", "Round of 16"
  if (lower.includes('round of')) return false;

  return (
    lower.includes('quarter') ||
    lower.includes('quarti') ||
    lower.includes('cuarto') ||
    lower.includes('semi') ||
    lower.includes('final')
  );
}

/**
 * Returns live streaming details for a match or tournament
 */
export function getStreamInfo(event: FipEvent, match?: Match): StreamInfo {
  const eventType = (event.type || '').toLowerCase();
  const isPremierPadel =
    eventType.includes('premier') ||
    eventType.includes('fip-ppt') ||
    eventType.includes('fip-pp');

  const roundName = match?.roundName || '';
  const courtName = match?.courtName || '';
  const isFinalStage = isQuarterFinalOrLater(roundName);

  // 1. Premier Padel from Quarterfinals onward or Premier Finals -> Red Bull TV
  if (isPremierPadel && (isFinalStage || eventType.includes('finals') || eventType.includes('master'))) {
    return {
      isAvailable: true,
      platform: 'redbull',
      platformName: 'Red Bull TV',
      channelName: 'Red Bull TV (Global & Free)',
      url: 'https://www.redbull.com/int-en/events/premier-padel',
      appUrl: 'redbulltv://event/premier-padel',
      courtName,
      isFinalStage: true,
      roundName,
    };
  }

  // 2. Premier Padel early rounds -> Premier Padel YouTube Channel
  if (isPremierPadel) {
    const query = courtName ? `${event.name} ${courtName} live` : `${event.name} live`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    return {
      isAvailable: true,
      platform: 'youtube',
      platformName: 'YouTube (Premier Padel)',
      channelName: '@PremierPadelOfficial',
      url: `https://www.youtube.com/@PremierPadelOfficial/streams`,
      appUrl: searchUrl,
      courtName,
      isFinalStage: false,
      roundName,
    };
  }

  // 3. FIP Tour (Platinum, Gold, Silver, Bronze, Rise, Promotion) -> FIP YouTube Channel
  const fipQuery = courtName ? `${event.name} ${courtName} live` : `${event.name} live`;
  const fipSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(fipQuery)}`;

  return {
    isAvailable: true,
    platform: 'youtube',
    platformName: 'YouTube (FIP Official)',
    channelName: '@padelfip',
    url: 'https://www.youtube.com/@padelfip/streams',
    appUrl: fipSearchUrl,
    courtName,
    isFinalStage,
    roundName,
  };
}

/**
 * Opens the live stream link in the native app with browser fallback
 */
export async function openLiveStream(streamInfo: StreamInfo): Promise<void> {
  try {
    if (streamInfo.platform === 'youtube') {
      // Try to open targeted search on YouTube
      const targetUrl = streamInfo.appUrl || streamInfo.url;
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
        return;
      }
      await Linking.openURL(streamInfo.url);
      return;
    }

    if (streamInfo.platform === 'redbull') {
      const canOpen = streamInfo.appUrl ? await Linking.canOpenURL(streamInfo.appUrl) : false;
      if (canOpen && streamInfo.appUrl) {
        await Linking.openURL(streamInfo.appUrl);
        return;
      }
      await Linking.openURL(streamInfo.url);
      return;
    }

    await Linking.openURL(streamInfo.url);
  } catch (error) {
    console.warn('Error opening live stream:', error);
    // Safe fallback to base URL
    try {
      await Linking.openURL(streamInfo.url);
    } catch {}
  }
}
