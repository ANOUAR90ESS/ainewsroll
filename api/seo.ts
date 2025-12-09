import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import zlib from 'zlib';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// In-memory cache
const cache: { [key: string]: { data: string; timestamp: number } } = {};
const CACHE_TTL = 0; // Disabled - regenerate on each request for debugging

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
  
  const robotsTxt = `# Robots.txt for AI News-Roll
User-agent: *
Allow: /
Disallow: /admin
Disallow: /.env*
Disallow: /private

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Search Engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

User-agent: Yandex
Allow: /

# Crawl-delay
Crawl-delay: 1

# Request rate
Request-rate: 1/1s
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
    <loc>${baseUrl}/pricing</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  // Fetch tools from Supabase with error handling
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

  // Fetch news from Supabase with error handling
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

  xml += `</urlset>`;
  
  setCache('sitemap', xml);
  return xml;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { sitemap, gzip } = req.query;

  try {
    if (sitemap === '1') {
      // Generate sitemap
      const sitemapContent = await generateSitemap();
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      
      if (gzip === '1') {
        const compressed = zlib.gzipSync(sitemapContent);
        res.setHeader('Content-Encoding', 'gzip');
        return res.send(compressed);
      }
      
      return res.send(sitemapContent);
    } else {
      // Generate robots.txt
      const robotsContent = await generateRobots();
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(robotsContent);
    }
  } catch (error) {
    console.error('SEO endpoint error:', error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
}
