import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import zlib from 'zlib';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('[SEO] Initializing with SUPABASE_URL:', !!SUPABASE_URL ? 'present' : 'missing');
console.log('[SEO] Initializing with SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing');

// Create Supabase client only if credentials are available
let supabaseAdmin: any = null;
try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('[SEO] Supabase client initialized');
  } else {
    console.log('[SEO] Supabase credentials missing; will use fallback');
  }
} catch (err) {
  console.error('[SEO] Failed to create Supabase client:', err);
  supabaseAdmin = null;
}

// In-memory cache
const cache: { [key: string]: { data: string; timestamp: number } } = {};
const CACHE_TTL = 600000; // 10 minutes

function getCache(key: string): string | null {
  const entry = cache[key];
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: string): void {
  cache[key] = { data, timestamp: Date.now() };
}

async function generateRobots(): Promise<string> {
  const cached = getCache('robots');
  if (cached) return cached;

  const baseUrl = 'https://ainewsroll.space';
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /tools/
Allow: /tools/free
Allow: /tools/paid
Allow: /tools/latest
Allow: /news
Allow: /category/

Disallow: /admin
Disallow: /payment
Disallow: /.env*
Disallow: /private
Disallow: /api/
Disallow: /node_modules/
Disallow: /*?*sort=
Disallow: /*?*filter=

# Static Resources
Allow: /*.js$
Allow: /*.css$
Allow: /*.png$
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.gif$
Allow: /*.svg$
Allow: /*.webp$
Allow: /*.woff$
Allow: /*.woff2$

# Crawl control
# Note: Googlebot ignores Crawl-delay and Request-rate.
# These directives are intentionally omitted for the default agent.

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Disallow: /

User-agent: Yandex
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/api/seo?sitemap=1&gzip=0
`;

  setCache('robots', robotsTxt);
  return robotsTxt;
}

async function generateSitemap(): Promise<string> {
  const cached = getCache('sitemap');
  if (cached) return cached;

  const baseUrl = 'https://ainewsroll.space';
  const now = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/news</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools/free</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools/paid</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  // Fetch tools from Supabase with error handling
  if (supabaseAdmin) {
    try {
      const { data: tools, error: toolsError } = await supabaseAdmin
        .from('tools')
        .select('id, name, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (toolsError) {
        console.error('Error fetching tools for sitemap:', toolsError);
      } else if (tools && tools.length > 0) {
        tools.forEach((tool: any) => {
          const lastmod = tool.updated_at || tool.created_at || now;
          const toolName = (tool.name || '').replace(/[&<>"']/g, (c: string) => {
            const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
            return map[c];
          });
          xml += `  <url>
    <loc>${baseUrl}/tool/${tool.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        });
      }
    } catch (toolsErr) {
      console.error('Exception fetching tools:', toolsErr);
    }
  } else {
    console.warn('Supabase not configured; skipping tools fetch for sitemap');
  }

  // Fetch news from Supabase with error handling
  if (supabaseAdmin) {
    try {
      const { data: news, error: newsError } = await supabaseAdmin
        .from('news')
        .select('id, title, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (newsError) {
        console.error('Error fetching news for sitemap:', newsError);
      } else if (news && news.length > 0) {
        news.forEach((article: any) => {
          const lastmod = article.updated_at || article.created_at || now;
          xml += `  <url>
    <loc>${baseUrl}/news/${article.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
`;
        });
      }
    } catch (newsErr) {
      console.error('Exception fetching news:', newsErr);
    }
  } else {
    console.warn('Supabase not configured; skipping news fetch for sitemap');
  }

  xml += `</urlset>`;
  
  setCache('sitemap', xml);
  return xml;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[SEO] Incoming request:', { sitemap: req.query.sitemap, gzip: req.query.gzip });
    
    const { sitemap, gzip } = req.query;

    if (sitemap === '1') {
      // Generate sitemap
      console.log('[SEO] Generating sitemap...');
      const sitemapContent = await generateSitemap();
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      if (gzip === '1') {
        const compressed = zlib.gzipSync(sitemapContent);
        res.setHeader('Content-Encoding', 'gzip');
        console.log('[SEO] Sending gzipped sitemap, size:', compressed.length);
        return res.send(compressed);
      }
      
      console.log('[SEO] Sending sitemap, size:', sitemapContent.length);
      return res.send(sitemapContent);
    } else {
      // Generate robots.txt
      console.log('[SEO] Generating robots.txt...');
      const robotsContent = await generateRobots();
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      console.log('[SEO] Sending robots.txt, size:', robotsContent.length);
      return res.send(robotsContent);
    }
  } catch (error) {
    console.error('[SEO] CRITICAL ERROR in handler:', error);
    
    try {
      // Always return a valid fallback response
      const isSitemapRequest = req.query.sitemap === '1';
      
      if (isSitemapRequest) {
        const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ainewsroll.space/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ainewsroll.space/news</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        console.log('[SEO] Returning fallback sitemap due to error');
        return res.send(fallbackSitemap);
      } else {
        const fallbackRobots = `User-agent: *
Allow: /
Sitemap: https://ainewsroll.space/sitemap.xml
Sitemap: https://ainewsroll.space/api/seo?sitemap=1&gzip=0
`;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        console.log('[SEO] Returning fallback robots.txt due to error');
        return res.send(fallbackRobots);
      }
    } catch (fallbackErr) {
      console.error('[SEO] FATAL ERROR - even fallback failed:', fallbackErr);
      return res.status(500).json({ error: 'SEO generation failed' });
    }
  }
}
