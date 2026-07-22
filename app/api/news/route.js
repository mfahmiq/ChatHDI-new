import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/supabaseClient';

// Verified fallback image just in case
const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60';

// Complete HTML entities decoder
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--');
}

// Process social media URLs for inline video/embed players
function processSocialMediaUrl(url, source) {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    
    // YouTube
    if (source === 'YouTube' || host.includes('youtube.com') || host.includes('youtu.be')) {
      let videoId = '';
      if (host.includes('youtu.be')) {
        videoId = urlObj.pathname.split('/').filter(Boolean)[0];
      } else {
        videoId = urlObj.searchParams.get('v');
        if (!videoId && urlObj.pathname.includes('/embed/')) {
          videoId = urlObj.pathname.split('/').filter(Boolean).pop();
        }
      }
      if (videoId) {
        return {
          video_url: `https://www.youtube.com/embed/${videoId}`,
          image_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
      }
    }
    
    // Instagram
    if (source === 'Instagram' || host.includes('instagram.com')) {
      const match = url.match(/\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const postCode = match[1];
        return {
          video_url: `https://www.instagram.com/p/${postCode}/embed/`,
          image_url: `https://www.instagram.com/p/${postCode}/media/?size=l`
        };
      }
    }
  } catch (e) {
    console.error('Error processing social media URL:', e);
  }
  return null;
}

// Extract base64 string from Google News redirect URL
function getBase64Str(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (
      url.hostname === 'news.google.com' &&
      pathParts.length > 1 &&
      ['articles', 'read'].includes(pathParts[pathParts.length - 2])
    ) {
      return { status: true, base64Str: pathParts[pathParts.length - 1] };
    }
    return { status: false, message: 'Invalid Google News URL format.' };
  } catch (e) {
    return { status: false, message: `Error in getBase64Str: ${e.message}` };
  }
}

// Fetch signature & timestamp attributes from Google News redirect page HTML
async function getDecodingParams(base64Str) {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // Try articles URL first
  try {
    const url = `https://news.google.com/articles/${base64Str}`;
    const response = await fetch(url, { headers: { 'User-Agent': ua } });
    if (response.ok) {
      const html = await response.text();
      const sgMatch = html.match(/data-n-a-sg="([^"]+)"/);
      const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);
      if (sgMatch && tsMatch) {
        return {
          status: true,
          signature: sgMatch[1],
          timestamp: tsMatch[1],
          base64Str
        };
      }
    }
  } catch (err) {
    console.warn("[Decoder] Failed with articles URL, trying fallback RSS URL:", err.message);
  }

  // Fallback to RSS articles URL
  try {
    const url = `https://news.google.com/rss/articles/${base64Str}`;
    const response = await fetch(url, { headers: { 'User-Agent': ua } });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();
    const sgMatch = html.match(/data-n-a-sg="([^"]+)"/);
    const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);
    if (sgMatch && tsMatch) {
      return {
        status: true,
        signature: sgMatch[1],
        timestamp: tsMatch[1],
        base64Str
      };
    }
    return {
      status: false,
      message: 'Failed to fetch data attributes from Google News HTML.'
    };
  } catch (err) {
    return {
      status: false,
      message: `Error in getDecodingParams: ${err.message}`
    };
  }
}

// Execute batchexecute RPC POST to decode the URL
async function decodeUrl(signature, timestamp, base64Str) {
  try {
    const url = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';
    const innerPayload = ['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1];
    const garturlreq = ['garturlreq', [innerPayload, 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], base64Str, parseInt(timestamp, 10), signature];
    const payload = [['Fbv4je', JSON.stringify(garturlreq), null, 'generic']];
    const fReq = JSON.stringify([payload]);
    
    const body = new URLSearchParams();
    body.append('f.req', fReq);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: body.toString()
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const parts = text.split('\n\n');
    if (parts.length < 2) throw new Error('Invalid response format.');
    
    const parsedData = JSON.parse(parts[1]);
    const innerJsonStr = parsedData[0][2];
    const innerData = JSON.parse(innerJsonStr);
    const decodedUrl = innerData[1];
    
    return { status: true, decodedUrl };
  } catch (err) {
    return {
      status: false,
      message: `Error in decodeUrl: ${err.message}`
    };
  }
}

// Decode Google News URL to original URL
async function decodeGoogleNewsUrl(sourceUrl) {
  const base64Res = getBase64Str(sourceUrl);
  if (!base64Res.status) return { status: false, message: base64Res.message };
  
  const paramsRes = await getDecodingParams(base64Res.base64Str);
  if (!paramsRes.status) return { status: false, message: paramsRes.message };
  
  return decodeUrl(paramsRes.signature, paramsRes.timestamp, paramsRes.base64Str);
}

// Extract OpenGraph Image from HTML content
function extractOgImage(html) {
  if (!html) return '';
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                  html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  return ogMatch ? decodeHtmlEntities(ogMatch[1]) : '';
}

// Extract video embed iframe from original article HTML
function extractVideoIframe(html) {
  if (!html) return null;
  const iframeMatch = html.match(/<iframe[^>]*?src=["'](https:\/\/www\.youtube\.com\/embed\/[^"']+)["']/i) ||
                      html.match(/<iframe[^>]*?src=["'](https:\/\/player\.vimeo\.com\/video\/[^"']+)["']/i);
  return iframeMatch ? iframeMatch[1] : null;
}

// Extract clean paragraphs from HTML
function extractArticleContent(html) {
  if (!html) return '';
  
  // 1. Decode Unicode escapes first to handle Next.js / state-encoded HTML
  let decodedHtml = html
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0022/g, '"')
    .replace(/\\u0027/g, "'")
    .replace(/\\u0026/g, '&')
    .replace(/\\\/|\\"/g, m => m === '\\/' ? '/' : '"');

  // Match all paragraphs
  const pMatches = decodedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const paragraphs = [];
  const seen = new Set();

  for (let p of pMatches) {
    let text = p.replace(/<[^>]*>/g, '').trim();
    text = decodeHtmlEntities(text);
    
    // Clean up slash escapes
    text = text.replace(/\\/g, '');

    const hasLongWord = text.split(/\s+/).some(word => word.length > 25);
    const isRelatedLink = /baca juga|read also|baca selengkapnya|related posts|advertisement|advertising/i.test(text);
    const isMenuOrFooter = /sign in|search|subscribe|whatsapp|facebook|twitter|instagram|linkedin|share on/i.test(text) && text.length < 250;

    const isValid = text.length > 40 && 
                    !hasLongWord && 
                    !isRelatedLink && 
                    !isMenuOrFooter &&
                    !text.toLowerCase().includes('we use cookies') && 
                    !text.toLowerCase().includes('accept cookies') && 
                    !text.toLowerCase().includes('agree to our cookie') && 
                    !/privacy policy|terms of service|terms of use|subscribe to|all rights reserved/i.test(text);

    if (isValid && !seen.has(text)) {
      seen.add(text);
      paragraphs.push(text);
    }
  }

  return paragraphs.slice(0, 15).join('\n\n');
}

// Scrape original website content
async function scrapeArticleData(url, rssImage = '') {
  try {
    console.log(`[Scraper] Scraping original page: ${url}`);
    const res = await axios.get(url, { 
      timeout: 5000, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = res.data;
    const ogImage = extractOgImage(html);
    const content = extractArticleContent(html);
    const videoUrl = extractVideoIframe(html);

    return {
      image_url: ogImage || rssImage || IMAGE_FALLBACK,
      content: content || '',
      video_url: videoUrl
    };
  } catch (err) {
    console.warn(`[Scraper] Failed to scrape ${url}:`, err.message);
    return {
      image_url: rssImage || IMAGE_FALLBACK,
      content: '',
      video_url: null
    };
  }
}

// Check if CNBC article is AI related
function isAiRelated(title, description) {
  const keywords = [
    'ai', 'kecerdasan buatan', 'chatgpt', 'openai', 'copilot', 'gemini', 
    'nvidia', 'deep learning', 'machine learning', 'robot', 'sora', 
    'claude', 'semikonduktor', 'chip'
  ];
  const searchStr = `${title} ${description}`.toLowerCase();
  return keywords.some(kw => searchStr.includes(kw));
}

// Parse XML RSS
function parseRss(xmlText, sourceName) {
  const items = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || [];

  itemMatches.forEach((itemXml) => {
    let titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
    let linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    let descriptionMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/);
    let pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

    let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    let link = linkMatch ? linkMatch[1].trim() : '';
    let descContent = descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
    let publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();

    let source = sourceName;

    // Google News source parsing
    if (sourceName.startsWith('Google News') && title.includes(' - ')) {
      const parts = title.split(' - ');
      source = parts.pop() || 'Google News';
      title = parts.join(' - ');
    }

    if (sourceName === 'CNBC Indonesia' && !isAiRelated(title, descContent)) {
      return;
    }

    // Extract image URL from feed
    let imageUrl = '';
    const mediaMatch = itemXml.match(/<(?:media:thumbnail|media:content)[^>]*?url=["']([^"']+)["']/);
    if (mediaMatch) {
      imageUrl = mediaMatch[1];
    }

    if (!imageUrl) {
      const enclosureMatch = itemXml.match(/<enclosure[^>]*?url=["']([^"']+)["']/);
      if (enclosureMatch) {
        imageUrl = enclosureMatch[1];
      }
    }

    if (!imageUrl && descContent) {
      const imgMatch = descContent.match(/<img[^>]*?src=["']([^"']+)["']/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    // Clean summary (decode HTML entities first, then strip tags)
    let summary = decodeHtmlEntities(descContent);
    summary = summary.replace(/<[^>]*>/g, '').trim();

    if (summary.length > 250) {
      summary = summary.substring(0, 247) + '...';
    }

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        summary: summary || 'Read more details about this AI news at the original source.',
        url: link,
        image_url: imageUrl,
        source: source,
        published_at: publishedAt
      });
    }
  });

  return items;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log(`[GET /api/news] Request received (forceRefresh=${forceRefresh})`);

    // 1. Fetch from Supabase cache if not forced refresh
    if (!forceRefresh) {
      // Reduced cache time to 1 hour to support more frequent auto-updates
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      const { data: cachedNews, error: fetchErr } = await supabase
        .from('ai_news')
        .select('*')
        .gt('created_at', oneHourAgo)
        .order('published_at', { ascending: false })
        .limit(50);

      if (!fetchErr && cachedNews && cachedNews.length > 0) {
        console.log(`[GET /api/news] Returning ${cachedNews.length} cached articles`);
        return NextResponse.json({ success: true, source: 'cache', news: cachedNews });
      }
    }

    // 2. Fetch RSS feeds (prioritizing user's requested Indonesian portals and Reuters)
    console.log('[GET /api/news] Fetching latest feeds...');

    const priorityIdQuery = '(site:cnnindonesia.com OR site:detik.com OR site:tempo.co OR site:okezone.com OR site:sindonews.com OR site:cnbcindonesia.com) (AI OR "Artificial Intelligence" OR "Kecerdasan Buatan")';
    const priorityEnQuery = 'site:reuters.com (AI OR "Artificial Intelligence")';
    const youtubeQuery = 'site:youtube.com (AI OR "Artificial Intelligence" OR "Kecerdasan Buatan")';
    const instagramQuery = 'site:instagram.com (AI OR "Artificial Intelligence" OR "Kecerdasan Buatan")';

    // Priority Feeds
    const priorityFeeds = [
      { url: `https://news.google.com/rss/search?q=${encodeURIComponent(priorityIdQuery)}&hl=id&gl=ID&ceid=ID:id`, source: 'Priority ID News' },
      { url: `https://news.google.com/rss/search?q=${encodeURIComponent(priorityEnQuery)}&hl=en-US&gl=US&ceid=US:en`, source: 'Priority Reuters News' },
      { url: `https://news.google.com/rss/search?q=${encodeURIComponent(youtubeQuery)}&hl=id&gl=ID&ceid=ID:id`, source: 'YouTube' },
      { url: `https://news.google.com/rss/search?q=${encodeURIComponent(instagramQuery)}&hl=id&gl=ID&ceid=ID:id`, source: 'Instagram' }
    ];

    // Secondary Fallback Feeds (TechCrunch & VentureBeat)
    const secondaryFeeds = [
      { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
      { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat' }
    ];

    let priorityArticles = [];
    let secondaryArticles = [];

    // Fetch Priority Feeds
    for (const feed of priorityFeeds) {
      try {
        const res = await axios.get(feed.url, {
          timeout: 7000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        priorityArticles = [...priorityArticles, ...parseRss(res.data, feed.source)];
      } catch (err) {
        console.error(`[GET /api/news] Failed to fetch priority feed ${feed.source}:`, err.message);
      }
    }

    // Fetch Secondary Feeds
    for (const feed of secondaryFeeds) {
      try {
        const res = await axios.get(feed.url, {
          timeout: 7000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        secondaryArticles = [...secondaryArticles, ...parseRss(res.data, feed.source)];
      } catch (err) {
        console.error(`[GET /api/news] Failed to fetch secondary feed ${feed.source}:`, err.message);
      }
    }

    // Sort priority and secondary articles by date
    priorityArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    secondaryArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    // Combine: Max 40 priority (requested sites, YouTube, Instagram) and fill up to 15 secondary/backup
    const filteredPriority = priorityArticles.slice(0, 40);
    const filteredSecondary = secondaryArticles.slice(0, 15);

    let combinedArticles = [...filteredPriority, ...filteredSecondary];
    combinedArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    if (combinedArticles.length === 0) {
      const { data: fallbackNews } = await supabase
        .from('ai_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);
      
      return NextResponse.json({ success: true, source: 'fallback_db', news: fallbackNews || [] });
    }

    // Decode Google News URLs for all combined articles in parallel
    console.log('[GET /api/news] Decoding Google News URLs for all combined articles...');
    combinedArticles = await Promise.all(
      combinedArticles.map(async (art) => {
        if (art.url.includes('news.google.com')) {
          const decoded = await decodeGoogleNewsUrl(art.url);
          if (decoded.status && decoded.decodedUrl) {
            let dynamicSource = art.source;
            try {
              const host = new URL(decoded.decodedUrl).hostname.toLowerCase();
              if (host.includes('cnnindonesia.com')) dynamicSource = 'CNN Indonesia';
              else if (host.includes('detik.com')) dynamicSource = 'Detikcom';
              else if (host.includes('reuters.com')) dynamicSource = 'Reuters';
              else if (host.includes('tempo.co')) dynamicSource = 'Tempo.co';
              else if (host.includes('okezone.com')) dynamicSource = 'Okezone';
              else if (host.includes('sindonews.com')) dynamicSource = 'Sindonews';
              else if (host.includes('cnbcindonesia.com')) dynamicSource = 'CNBC Indonesia';
              else if (host.includes('youtube.com')) dynamicSource = 'YouTube';
              else if (host.includes('instagram.com')) dynamicSource = 'Instagram';
              else if (host.includes('techcrunch.com')) dynamicSource = 'TechCrunch';
              else if (host.includes('venturebeat.com')) dynamicSource = 'VentureBeat';
              else {
                const parts = host.replace('www.', '').split('.');
                dynamicSource = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
              }
            } catch (e) {
              // Ignore host formatting errors
            }
            return {
              ...art,
              url: decoded.decodedUrl,
              source: dynamicSource
            };
          }
        }
        return art;
      })
    );

    // Pre-process social media URLs for inline embeds
    combinedArticles = combinedArticles.map(art => {
      const social = processSocialMediaUrl(art.url, art.source);
      if (social) {
        return {
          ...art,
          video_url: social.video_url,
          image_url: social.image_url || art.image_url || IMAGE_FALLBACK,
          content: art.summary,
          isSocial: true
        };
      }
      return art;
    });

    // 3. Concurrently scrape original articles for real image & full content (top 15 latest)
    console.log('[GET /api/news] Scraping original article content and real images for top 15 items...');
    const topToScrape = combinedArticles.slice(0, 15);
    const remaining = combinedArticles.slice(15);

    const scrapedTop = await Promise.all(
      topToScrape.map(async (art) => {
        if (art.isSocial) {
          return art;
        }
        const scraped = await scrapeArticleData(art.url, art.image_url);
        return {
          ...art,
          image_url: scraped.image_url,
          content: scraped.content,
          video_url: scraped.video_url
        };
      })
    );

    // Remaining items just get fallback config (but URLs are already decoded)
    const processedArticles = [
      ...scrapedTop,
      ...remaining.map(art => ({
        ...art,
        image_url: art.image_url || IMAGE_FALLBACK,
        content: art.summary,
        video_url: art.video_url || null
      }))
    ];

    // 4. Save/Cache to Supabase
    console.log('[GET /api/news] Caching scraped news to Supabase...');
    const { error: upsertErr } = await supabase
      .from('ai_news')
      .upsert(
        processedArticles.map(art => ({
          title: art.title,
          summary: art.summary,
          content: art.content || art.summary,
          url: art.url,
          image_url: art.image_url,
          video_url: art.video_url,
          source: art.source,
          published_at: art.published_at,
          created_at: new Date().toISOString()
        })),
        { onConflict: 'url' }
      );

    if (upsertErr) {
      console.error('[GET /api/news] Error upserting cached news:', upsertErr);
    }

    return NextResponse.json({ success: true, source: 'network', news: processedArticles });

  } catch (error) {
    console.error('[GET /api/news] General error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
