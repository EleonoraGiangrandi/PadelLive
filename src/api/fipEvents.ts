import { FipEvent } from '../types/models';

/**
 * Recupera l'elenco dei tornei direttamente dal calendario ufficiale FIP
 * (padelfip.com/calendar-cupra-fip-tour e calendar-premier-padel)
 * senza passare da alcun server intermediario.
 */
export async function getFipCalendarEvents(year: number = new Date().getFullYear()): Promise<FipEvent[]> {
  const urls = [
    `https://www.padelfip.com/calendar-cupra-fip-tour/?events-year=${year}`,
    `https://www.padelfip.com/calendar-premier-padel/?events-year=${year}`,
  ];

  const events: FipEvent[] = [];

  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        const html = await response.text();
        const parsed = parseFipCalendarHtml(html);
        events.push(...parsed);
      } catch (e) {
        console.warn(`Failed to fetch FIP calendar from ${url}:`, e);
      }
    })
  );

  // Rimuovi eventuali duplicati basati sul link
  const uniqueMap = new Map<string, FipEvent>();
  for (const ev of events) {
    if (!uniqueMap.has(ev.href)) {
      uniqueMap.set(ev.href, ev);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Parser HTML leggero per estrarre gli articoli dei tornei dal calendario FIP.
 */
function parseFipCalendarHtml(html: string): FipEvent[] {
  const events: FipEvent[] = [];
  const articleRegex = /<article[^>]*class=\"([^\"]*)\"[^>]*>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const classAttr = match[1] || '';
    const content = match[2] || '';

    try {
      // 1. Categoria Torneo
      const type = classAttr.trim().replace(/^article\s*/, '') || 'fip-tour';

      // 2. Titolo e Link
      const titleMatch = content.match(/<div class=\"event-title\">[\s\S]*?<a[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;

      const href = titleMatch[1];
      const name = titleMatch[2].replace(/<[^>]+>/g, '').trim();

      // 3. Date inizio/fine (From DD/MM/YYYY to DD/MM/YYYY)
      const dateMatch = content.match(/From\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/i);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch ? dateMatch[2] : '';

      // 4. Luogo
      const locMatch = content.match(/<div class=\"event-location\">([\s\S]*?)<\/div>/i);
      const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // 5. Immagine di copertina
      const imgMatch = content.match(/<img[^>]*class=\"cover-category-event\"[^>]*src=\"([^\"]+)\"/i);
      const cover = imgMatch ? imgMatch[1] : '';

      // 6. Id univoco generato dallo slug del link
      const slug = href.replace(/\/$/, '').split('/').pop() || name;

      // EventId per il collegamento a MatchScorerLive
      // I tornei FIP estraggono l'eventId nel widget; per default usiamo lo slug come ID
      events.push({
        id: slug,
        name,
        startDate,
        endDate,
        href,
        type,
        cover,
        location,
        eventId: slug,
      });
    } catch (e) {
      console.warn('Error parsing event article:', e);
    }
  }

  return events;
}
