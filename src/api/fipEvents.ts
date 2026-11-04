import { FipEvent } from '../types/models';

/**
 * Retrieves the list of tournaments directly from the official FIP calendar
 * (padelfip.com/calendar-cupra-fip-tour and calendar-premier-padel)
 * without using any intermediate server.
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

  // Remove any duplicates based on link
  const uniqueMap = new Map<string, FipEvent>();
  for (const ev of events) {
    if (!uniqueMap.has(ev.href)) {
      uniqueMap.set(ev.href, ev);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Lightweight HTML parser to extract tournament articles from the FIP calendar.
 */
function parseFipCalendarHtml(html: string): FipEvent[] {
  const events: FipEvent[] = [];
  const articleRegex = /<article[^>]*class=\"([^\"]*)\"[^>]*>([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const classAttr = match[1] || '';
    const content = match[2] || '';

    try {
      // 1. Tournament category
      const type = classAttr.trim().replace(/^article\s*/, '') || 'fip-tour';

      // 2. Title and link
      const titleMatch = content.match(/<div class=\"event-title\">[\s\S]*?<a[^>]*href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleMatch) continue;

      const href = titleMatch[1];
      const name = titleMatch[2].replace(/<[^>]+>/g, '').trim();

      // 3. Start/end dates (From DD/MM/YYYY to DD/MM/YYYY)
      const dateMatch = content.match(/From\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/i);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch ? dateMatch[2] : '';

      // 4. Location
      const locMatch = content.match(/<div class=\"event-location\">([\s\S]*?)<\/div>/i);
      const location = locMatch ? locMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // 5. Cover image
      const imgMatch = content.match(/<img[^>]*class=\"cover-category-event\"[^>]*src=\"([^\"]+)\"/i);
      const cover = imgMatch ? imgMatch[1] : '';

      // 6. Unique ID generated from link slug
      const slug = href.replace(/\/$/, '').split('/').pop() || name;

      // EventId for MatchScorerLive connection
      // FIP tournaments extract the eventId in the widget; by default we use the slug as ID
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
