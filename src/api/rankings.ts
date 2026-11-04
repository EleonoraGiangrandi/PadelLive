import { fetchFipDirect } from './client';
import { PlayerProfile, PlayerRanking } from '../types/models';

interface FipPlayerItem {
  player_id?: string;
  name: string;
  surname?: string;
  rank: number;
  points: number | string;
  move?: number;
  url?: string;
  thumbnail?: string;
  country_name?: string;
  country_flag?: string;
}

/**
 * Retrieves official FIP / Premier Padel world rankings (Men / Women).
 * Uses the official FIP REST API in real time without third-party servers.
 */
export async function getRankings(
  gender: 'men' | 'women',
  offset: number = 0,
  limit: number = 20
): Promise<PlayerRanking[]> {
  try {
    const fipGender = gender === 'men' ? 'male' : 'female';
    const currentYear = new Date().getFullYear();
    const query = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      gender: fipGender,
      category: 'master',
      circuit: 'premierpadel',
      year: currentYear.toString(),
      week: '45',
      lang: 'en',
    });

    const fipPlayers = await fetchFipDirect<FipPlayerItem[]>(
      `ranking/load-more?${query.toString()}`
    );

    if (Array.isArray(fipPlayers) && fipPlayers.length > 0) {
      return fipPlayers.map((p) => {
        const handler = p.url
          ? p.url.replace(/\/$/, '').split('/').pop() || ''
          : `${p.name.toLowerCase()}-${(p.surname || '').toLowerCase()}`;

        return {
          id: p.player_id || handler,
          name: p.surname ? `${p.name} ${p.surname}` : p.name,
          surname: p.surname,
          position: p.rank,
          points: p.points,
          country: p.country_name || '',
          flag: p.country_flag || '',
          image: p.thumbnail || '',
          rankDelta: p.move || 0,
          handler,
        };
      });
    }
  } catch (err) {
    console.warn('FIP direct rankings error:', err);
  }

  return [];
}

/**
 * Searches for a player by name directly via the official FIP API.
 */
export async function searchPlayers(
  gender: 'men' | 'women',
  queryStr: string
): Promise<PlayerRanking[]> {
  if (!queryStr.trim()) return [];

  try {
    const fipGender = gender === 'men' ? 'male' : 'female';
    const currentYear = new Date().getFullYear();
    const query = new URLSearchParams({
      gender: fipGender,
      category: 'master',
      circuit: 'premierpadel',
      year: currentYear.toString(),
      week: '45',
      q: queryStr.trim(),
      lang: 'en',
    });

    const fipPlayers = await fetchFipDirect<FipPlayerItem[]>(
      `player/search?${query.toString()}`
    );

    if (Array.isArray(fipPlayers) && fipPlayers.length > 0) {
      return fipPlayers.map((p) => {
        const handler = p.url
          ? p.url.replace(/\/$/, '').split('/').pop() || ''
          : `${p.name.toLowerCase()}-${(p.surname || '').toLowerCase()}`;

        return {
          id: p.player_id || handler,
          name: p.surname ? `${p.name} ${p.surname}` : p.name,
          surname: p.surname,
          position: p.rank,
          points: p.points,
          country: p.country_name || '',
          flag: p.country_flag || '',
          image: p.thumbnail || '',
          rankDelta: p.move || 0,
          handler,
        };
      });
    }
  } catch (err) {
    console.error('Search player error:', err);
  }

  return [];
}

/**
 * Retrieves a detailed player profile directly from the official FIP website.
 */
export async function getPlayerProfile(handler: string): Promise<PlayerProfile> {
  const cleanHandler = handler.replace(/^\/+|\/+$/g, '').split('/').pop() || handler;

  try {
    const url = `https://www.padelfip.com/player/${cleanHandler}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text();

      const metaMatch = html.match(/name=\"description\"\s*content=\"([\s\S]*?)\"/i);
      const desc = metaMatch ? metaMatch[1] : '';

      const pointsMatch = desc.match(/Points:\s*(\d+)/i);
      const rankMatch = desc.match(/Ranking:\s*(\d+)/i);
      const heightMatch = desc.match(/Height:\s*([^;]+)/i);
      const bornInMatch = desc.match(/Place of Birth:\s*([^;]+)/i);
      const dobMatch = desc.match(/Birth Date:\s*([^;]+)/i);
      const posMatch = desc.match(/Playing Position:\s*([^;]+)/i);

      // Coaches
      let coach: string | undefined;
      const coachBox = html.match(/class=\"overview__coaches\">([\s\S]*?)<\/div>/i);
      if (coachBox) {
        const coaches = [...coachBox[1].matchAll(/class=\"overview__text\">([\s\S]*?)<\/p>/gi)]
          .map((c) => c[1].replace(/<[^>]+>/g, '').trim())
          .filter((c) => c.length > 0);
        if (coaches.length > 0) coach = coaches.join(', ');
      }

      // Partner
      let partner: { name: string; handler: string; imageUrl?: string } | undefined;
      const partnerMatch = html.match(/<a[^>]*href=\"https:\/\/www\.padelfip\.com\/player\/([^/"]+)\/\"[^>]*title=\"([^"]+)\"/i);
      const partnerImgMatch = html.match(/<img[^>]*class=\"paired__img\"[^>]*src=\"([^"]+)\"/i);
      if (partnerMatch) {
        partner = {
          handler: partnerMatch[1],
          name: partnerMatch[2],
          imageUrl: partnerImgMatch ? partnerImgMatch[1] : undefined,
        };
      }

      // Effectiveness & stats
      const effMatch = html.match(/class=\"stats__bar\"[^>]*style=\"width:([\d.]+%)\"/i);

      return {
        name: cleanHandler.replace(/-/g, ' ').toUpperCase(),
        rank: rankMatch ? parseInt(rankMatch[1], 10) : undefined,
        points: pointsMatch ? parseInt(pointsMatch[1], 10) : undefined,
        height: heightMatch ? `${heightMatch[1].trim()} CM` : undefined,
        bornIn: bornInMatch ? bornInMatch[1].trim() : undefined,
        dob: dobMatch ? dobMatch[1].trim() : undefined,
        playingPosition: posMatch ? posMatch[1].trim() : undefined,
        coach,
        partner,
        stats: {
          effectiveness: effMatch ? effMatch[1] : undefined,
        },
      };
    }
  } catch (err) {
    console.warn('FIP direct player error, checking fallback:', err);
  }

  // Fallback to secondary data provider
  try {
    const fallbackRes = await fetch(`http://fredericosilva.net:8081/padely/player?handler=${cleanHandler}`, {
      headers: { 'User-Agent': 'okhttp/4.12.0' },
    });
    if (fallbackRes.ok) {
      return await fallbackRes.json();
    }
  } catch {
    // Return base info
  }

  return {
    name: cleanHandler.replace(/-/g, ' ').toUpperCase(),
  };
}
