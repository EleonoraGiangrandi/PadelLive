/**
 * Client di connessione alle sorgenti dati di Padely.
 * L'applicazione opera in modalità 100% autonoma (serverless) interrogando
 * direttamente i provider ufficiali:
 * - padelfip.com (Classifiche mondiali, Tornei, Notizie)
 * - widget.matchscorerlive.com (Partite live, Punti, Statistiche)
 */

export const FIP_API_BASE = 'https://www.padelfip.com/wp-json/fip/v1';

// Server di riserva secondario (usato esclusivamente se le sorgenti ufficiali dirette non rispondono)
const BACKUP_SERVER_BASE = 'http://fredericosilva.net:8081';

const DEFAULT_HEADERS = {
  'User-Agent': 'okhttp/4.12.0',
  'Accept': 'application/json',
};

export async function fetchFipDirect<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${FIP_API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`FIP Direct API Error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPadely<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BACKUP_SERVER_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Backup API Error ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Failed to parse response: ${text.slice(0, 100)}`);
  }
}
