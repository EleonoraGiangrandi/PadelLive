import { RssArticle } from '../types/models';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

const DEFAULT_NEWS_FEEDS = [
  'https://www.padelfip.com/news/feed/',
  'https://www.padelfip.com/feed/',
];

/**
 * Retrieves and aggregates news articles from official FIP RSS feeds.
 */
export async function getNewsArticles(_locale: string = 'en'): Promise<RssArticle[]> {
  try {
    const urls = DEFAULT_NEWS_FEEDS;
    const articles: RssArticle[] = [];
    const seenUrls = new Set<string>();

    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          if (!res.ok) return;
          const xmlText = await res.text();
          const parsed = parser.parse(xmlText);
          const channel = parsed.rss?.channel;
          const items = Array.isArray(channel?.item) ? channel.item : channel?.item ? [channel.item] : [];

          for (const item of items) {
            const articleUrl = item.link || url;
            if (seenUrls.has(articleUrl)) continue;
            seenUrls.add(articleUrl);

            let image: string | undefined = undefined;
            if (item['media:content'] && item['media:content']['@_url']) {
              image = item['media:content']['@_url'];
            } else if (item.enclosure && item.enclosure['@_url']) {
              image = item.enclosure['@_url'];
            } else if (typeof item.description === 'string') {
              const imgMatch = item.description.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
              if (imgMatch) image = imgMatch[1];
            }

            const cleanDesc = (item.description || '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            articles.push({
              title: item.title || 'Untitled',
              description: cleanDesc,
              date: item.pubDate || new Date().toISOString(),
              image,
              source: channel?.title ? channel.title.replace(/&#038;/g, '&') : 'FIP News',
              url: articleUrl,
            });
          }
        } catch (e) {
          console.warn(`Failed to parse feed ${url}:`, e);
        }
      })
    );

    // Sort by publication date descending
    articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return articles;
  } catch (err) {
    console.error('Error fetching news:', err);
    return [];
  }
}
