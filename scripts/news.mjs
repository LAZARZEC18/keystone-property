// Housing news: headlines and links (never article text) from public RSS/Atom feeds,
// filtered to Australian property, rates and rent, de-duplicated and tagged.
import { writeFile, mkdir } from 'node:fs/promises';
import { getText, pool } from './lib/http.mjs';

export const FEEDS = [
  { source: 'RBA', url: 'https://www.rba.gov.au/rss/rss-cb-media-releases.xml', all: true },
  // portal news is filtered like any other feed (it carries celebrity and lifestyle pieces)
  { source: 'PropTrack', url: 'https://www.realestate.com.au/insights/feed/', all: true },
  { source: 'The Conversation', url: 'https://theconversation.com/au/topics/housing-1109/articles.atom', all: true },
  { source: 'The Guardian', url: 'https://www.theguardian.com/australia-news/housing/rss', all: true },
  { source: 'ABC News', url: 'https://www.abc.net.au/news/feed/51892/rss.xml' },
  { source: 'ABC News', url: 'https://www.abc.net.au/news/feed/2942460/rss.xml' },
  { source: 'The Guardian', url: 'https://www.theguardian.com/australia-news/rss' },
  { source: 'Broker News', url: 'https://www.brokernews.com.au/rss' },
  { source: 'SBS News', url: 'https://www.sbs.com.au/news/topic/australia/feed' },
  {
    source: 'Google News',
    url: 'https://news.google.com/rss/search?q=(australia+house+prices)+OR+(australia+property+market)+OR+(RBA+interest+rates)+OR+(australia+rents)+when:3d&hl=en-AU&gl=AU&ceid=AU:en',
    all: true,
    aggregator: true,
  },
];

// A headline must be about the market, lending, renting or housing policy, not just mention a home.
const RELEVANT =
  /\b(housing|house prices?|home prices?|property (market|prices?|values?|investors?)|home ?loans?|home ?buyers?|first[- ]home|mortgages?|rents?|rental|renters?|tenants?|landlords?|interest rates?|cash rate|RBA|reserve bank|APRA|auction clearance|clearance rates?|dwelling (values?|prices?|approvals)|stamp duty|negative gearing|capital gains|land tax|affordab\w*|lending|borrowers?|CPI|inflation|building approvals|housing supply|vacancy rates?|home values?|median (price|value)|monetary policy)\b/i;
// Celebrity, sport, crime and gossip items that feeds tag as "property" but tell a buyer nothing.
const BLOCK =
  /\b(mansion|celebrit\w*|star|actor|actress|singer|rapper|influencer|reality|AFL|NRL|cricket|footballer|olympian|swimmer|resigns?|resignation|ICAC|court|charged|police|taser|murder|crash|dies|death|royal|billionaire'?s?|lists? (her|his|their)|sells? (her|his|their)|snaps? up|buys? (a|her|his|their))\b/i;
const PER_SOURCE = { 'realestate.com.au': 3, PropTrack: 3, Domain: 3 };

// Publishers accepted from the Google News aggregator (normalised names). Anything else is dropped:
// the aggregator also surfaces SEO and trading-spam sites.
const PUBLISHERS = new Map(
  [
    ['abc', 'ABC News'], ['abc news', 'ABC News'], ['sbs', 'SBS News'], ['sbs news', 'SBS News'], ['the guardian', 'The Guardian'], ['guardian', 'The Guardian'],
    ['australian financial review', 'Australian Financial Review'], ['afr', 'Australian Financial Review'], ['the sydney morning herald', 'The Sydney Morning Herald'], ['sydney morning herald', 'The Sydney Morning Herald'],
    ['the age', 'The Age'], ['brisbane times', 'Brisbane Times'], ['watoday', 'WAtoday'], ['news.com.au', 'news.com.au'], ['the australian', 'The Australian'],
    ['the west australian', 'The West Australian'], ['perthnow', 'PerthNow'], ['perth now', 'PerthNow'], ['herald sun', 'Herald Sun'], ['the daily telegraph', 'The Daily Telegraph'], ['daily telegraph', 'The Daily Telegraph'],
    ['the courier-mail', 'The Courier-Mail'], ['courier mail', 'The Courier-Mail'], ['adelaide now', 'The Advertiser'], ['the advertiser', 'The Advertiser'], ['indaily', 'InDaily'], ['the mercury', 'The Mercury'], ['nt news', 'NT News'], ['the canberra times', 'The Canberra Times'],
    ['9news', '9News'], ['9news.com.au', '9News'], ['7news', '7NEWS'], ['7news.com.au', '7NEWS'], ['sky news australia', 'Sky News Australia'], ['reuters', 'Reuters'], ['bloomberg', 'Bloomberg'], ['bloomberg.com', 'Bloomberg'],
    ['yahoo finance', 'Yahoo Finance'], ['yahoo finance australia', 'Yahoo Finance'], ['yahoo news australia', 'Yahoo Finance'], ['yahoo', 'Yahoo Finance'],
    ['realestate.com.au', 'realestate.com.au'], ['domain', 'Domain'], ['domain.com.au', 'Domain'], ['proptrack', 'PropTrack'], ['cotality', 'Cotality'], ['corelogic', 'Cotality'],
    ['the conversation', 'The Conversation'], ['canstar', 'Canstar'], ['finder', 'Finder'], ['ratecity', 'RateCity'], ['mozo', 'Mozo'], ['money magazine', 'Money Magazine'],
    ['the adviser', 'The Adviser'], ['broker daily', 'Broker Daily'], ['brokerdaily', 'Broker Daily'], ['mortgage professional australia', 'Mortgage Professional Australia'], ['mpa', 'Mortgage Professional Australia'],
    ['real estate business', 'Real Estate Business'], ['your investment property', 'Your Investment Property'], ['property update', 'Property Update'], ['smart property investment', 'Smart Property Investment'],
    ['business insider australia', 'Business Insider Australia'], ['the new daily', 'The New Daily'], ['crikey', 'Crikey'], ['reserve bank of australia', 'RBA'], ['rba', 'RBA'],
  ],
);
const normPub = (x) => String(x || '').toLowerCase().replace(/^www\./, '').replace(/\s+/g, ' ').trim();

const TAGS = [
  ['Rates', /interest rate|cash rate|\bRBA\b|reserve bank|mortgage rate|rate (cut|hike|rise|hold)|fixed rate|variable rate|lender|refinanc/i],
  ['Prices', /\bprices?\b|\bvalues?\b|index|clearance rate|boom|slump|median|market (rise|fall|growth|slow|cool)/i],
  ['Rents', /rent|tenant|landlord|vacanc|lease/i],
  ['Policy', /\btax|stamp duty|negative gearing|budget|government|policy|scheme|home owners? grant|regulat|apra|zoning|planning|\blaws?\b|\brules?\b|registration|reform|legislation/i],
  ['Supply', /construction|build|approval|supply|developer|apartment|land release|housing target/i],
  ['Lending', /loan|lending|credit|borrow|serviceab|deposit|broker|bank/i],
];

const decode = (s = '') =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
};

/** Parse RSS 2.0 <item> or Atom <entry> into {title, link, date}. */
export function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = decode(tag(b, 'title'));
    let link = decode(tag(b, 'link'));
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i);
      link = m ? m[1] : '';
    }
    const dateStr = decode(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    const d = dateStr ? new Date(dateStr) : null;
    const publisher = decode(tag(b, 'source'));
    if (title && link) items.push({ title, link, date: d && !Number.isNaN(+d) ? d.toISOString() : null, publisher });
  }
  return items;
}

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export async function collectNews({ now = Date.now(), timeout = 15000 } = {}) {
  const results = await pool(FEEDS, 8, async (f) => {
    const r = await getText(f.url, { accept: 'application/rss+xml, application/atom+xml, text/xml' }, { timeout, retries: timeout < 10000 ? 0 : undefined });
    if (!r?.ok) return { feed: f, items: [], error: r?.status };
    return { feed: f, items: parseFeed(r.text) };
  });
  const seen = new Set();
  const out = [];
  for (const { feed, items } of results) {
    for (const it of items) {
      let title = it.title;
      let source = feed.source;
      if (feed.aggregator) {
        // Google News titles end with " - Publisher"; credit the publisher.
        const m = title.match(/^(.*) - ([^-]{2,60})$/);
        if (m) {
          title = m[1];
          source = it.publisher || m[2];
        }
        const pub = PUBLISHERS.get(normPub(source));
        if (!pub) continue; // unknown or low-quality publisher
        source = pub;
      }
      if (/[\u0400-\u04FF\u0600-\u06FF\u3040-\u9FFF]/.test(source + title)) continue; // non-English mirrors
      if (BLOCK.test(title)) continue;
      if (!RELEVANT.test(title)) continue;
      const age = it.date ? now - Date.parse(it.date) : 0;
      if (age > 14 * 864e5) continue; // two weeks
      const key = norm(title).slice(0, 70);
      if (seen.has(key)) continue;
      seen.add(key);
      const tags = TAGS.filter(([, re]) => re.test(title)).map(([t]) => t).slice(0, 2);
      out.push({ title, link: it.link, source, date: it.date, tags });
    }
  }
  out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  // a short list, and no single publisher (least of all a listing portal) can dominate it
  const count = {};
  // An independent site shouldn't pass on portal clickbait: skip hype and listicle headlines
  const HYPE = /tipped to boom|\bboom(ing)?\b|skyrocket|soar(ing)?|hotspots?|\breveals?\b|\brevealed\b|you need to know|must[- ]know|secret|millionaire|\bhacks?\b|\bthe \d+ (best|worst)|\b(five|\d+) (markets|suburbs|places) (to|where)/i;
  const PROFILE = /'s (leap|journey|story)\b|\bmeet the\b/i;
  for (let i = out.length - 1; i >= 0; i--) if (HYPE.test(out[i].title) || PROFILE.test(out[i].title)) out.splice(i, 1);
  const curated = out.filter((x) => (count[x.source] = (count[x.source] || 0) + 1) <= (PER_SOURCE[x.source] ?? 5)).slice(0, 30);
  return {
    updated: new Date(now).toISOString(),
    feeds: results.map((r) => ({ source: r.feed.source, ok: !r.error, count: r.items.length })),
    items: curated,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const d = await collectNews();
  await mkdir(new URL('../site/data/', import.meta.url), { recursive: true });
  await writeFile(new URL('../site/data/news.json', import.meta.url), JSON.stringify(d));
  console.log(d.items.length, 'items;', d.feeds.map((f) => `${f.source}:${f.ok ? f.count : 'x'}`).join(' '));
}
