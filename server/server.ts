import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { createClient, User } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

dotenv.config();

// Validate critical env vars but do NOT crash the serverless function; return 500s instead.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const missingEnvError = () => !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY;

// ========================
// Simple In-Memory Cache
// ========================
class Cache {
  private store: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number; // in milliseconds

  constructor(ttlSeconds: number = 600) {
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): any {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  clear(key: string): void {
    this.store.delete(key);
  }

  clearAll(): void {
    this.store.clear();
  }
}

const cache = new Cache(600); // 10 minutes TTL

if (missingEnvError()) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing. Server will respond 500 to protected routes.');
}

// Client with SERVICE ROLE - ONLY for backend use
const supabaseAdmin = (!missingEnvError())
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const app = express();
app.use(cors());
// Explicitly cast middleware to RequestHandler to resolve type mismatch in some environments
app.use(express.json() as RequestHandler);

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware: Extracts Bearer token and validates with Supabase
 */
const requireAuth = (async (req: Request, res: Response, next: NextFunction) => {
  if (missingEnvError() || !supabaseAdmin) {
    res.status(500).json({ error: 'Server configuration missing Supabase credentials' });
    return;
  }
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    
    // Verify token against Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = data.user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}) as RequestHandler;

/**
 * Example Endpoint: Get 'books' for the authenticated user
 */
app.get('/api/books', requireAuth, (async (req: Request, res: Response) => {
  try {
    const userReq = req as AuthenticatedRequest;
    const userId = userReq.user?.id;
    if (!userId) {
         res.status(400).json({ error: 'User ID missing' });
         return;
    }

        if (!supabaseAdmin) {
          res.status(500).json({ error: 'Supabase client not initialized' });
          return;
        }

    // Query filtered by user_id for security
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('owner_id', userId);

    if (error) throw error;
    res.json({ data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}) as RequestHandler);

/**
 * Example Endpoint: Create a 'book'
 */
app.post('/api/books', requireAuth, (async (req: Request, res: Response) => {
  try {
    const userReq = req as AuthenticatedRequest;
    const userId = userReq.user?.id;
    if (!userId) {
         res.status(400).json({ error: 'User ID missing' });
         return;
    }

    const { title, content } = req.body;

        if (!supabaseAdmin) {
          res.status(500).json({ error: 'Supabase client not initialized' });
          return;
        }

        const { data, error } = await supabaseAdmin
      .from('books')
      .insert([{ title, content, owner_id: userId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}) as RequestHandler);

/**
 * Generate Dynamic Robots.txt
 */
async function generateRobots(): Promise<string> {
  try {
    if (missingEnvError() || !supabaseAdmin) {
      throw new Error('Supabase credentials are missing');
    }
    const { data: tools } = await supabaseAdmin
      .from('tools')
      .select('id')
      .limit(1);

    let robots = `# =========================
# Dynamic robots.txt
# Generated from Supabase
# =========================

User-agent: *
Disallow: /admin
Disallow: /.env*
Disallow: /private
Allow: /

Sitemap: https://ainewsroll.space/api/seo?sitemap=1

# Resources
Allow: /*.js$
Allow: /*.css$
Allow: /*.png$
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.gif$
Allow: /*.svg$

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Disallow: /

User-agent: Yandex
Disallow: /
`;
    return robots;
  } catch (err) {
    console.error('Error generating robots.txt:', err);
    return '';
  }
}

const slugifyCategory = (cat: string) => cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function fetchAllRows<T>(table: string, columns: string, chunkSize = 500): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    if (missingEnvError() || !supabaseAdmin) {
      throw new Error('Supabase credentials are missing');
    }
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(columns)
      .range(from, from + chunkSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    const rowsToAdd = Array.isArray(data) ? (data as T[]) : [];
    rows.push(...rowsToAdd);
    if (data.length < chunkSize) break;
    from += chunkSize;
  }
  return rows;
}

/**
 * Generate Dynamic Sitemap.xml
 */
async function generateSitemap(): Promise<string> {
  try {
    const baseUrl = 'https://ainewsroll.space';
    
    let tools: any[] = [];
    let news: any[] = [];
    
    // Safely fetch data with error handling
    try {
      if (!missingEnvError() && supabaseAdmin) {
        tools = await fetchAllRows<any>('tools', 'id, name, updated_at, image_url, category');
      }
    } catch (err) {
      console.warn('Warning: Could not fetch tools for sitemap:', err);
    }
    
    try {
      if (!missingEnvError() && supabaseAdmin) {
        news = await fetchAllRows<any>('news', 'id, title, date');
      }
    } catch (err) {
      console.warn('Warning: Could not fetch news for sitemap:', err);
    }

    const uniqueCategories = Array.from(new Set(tools.map((t) => t.category).filter(Boolean)));
    const today = new Date().toISOString().split('T')[0];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/news</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools/free</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools/paid</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
  <url>
    <loc>${baseUrl}/tools/latest</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
`;

    // Category landing pages
    uniqueCategories.forEach((cat) => {
      const slug = slugifyCategory(cat);
      sitemap += `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.75</priority>
  </url>
`;
    });

    // Add Tools with images (safely handle escaped content)
    tools.forEach((tool) => {
      try {
        const date = tool.updated_at ? tool.updated_at.split('T')[0] : today;
        const safeName = (tool.name || '').replace(/[&<>"']/g, (c: string) => {
          const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
          return map[c];
        });
        
        const imageTag = tool.image_url
          ? `
    <image:image>
      <image:loc>${tool.image_url}</image:loc>
      <image:title>${safeName}</image:title>
    </image:image>`
          : '';

        sitemap += `  <url>
    <loc>${baseUrl}/tool/${tool.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageTag}
  </url>
`;
      } catch (toolErr) {
        console.warn('Warning: Error processing tool for sitemap:', toolErr);
      }
    });

    // Add News (safely handle escaped content)
    news.forEach((article) => {
      try {
        const date = article.date ? article.date.split('T')[0] : today;
        sitemap += `  <url>
    <loc>${baseUrl}/news/${article.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      } catch (newsErr) {
        console.warn('Warning: Error processing news for sitemap:', newsErr);
      }
    });

    sitemap += `</urlset>`;
    return sitemap;
  } catch (err) {
    console.error('Error generating sitemap:', err);
    // Return minimal valid sitemap as fallback
    const baseUrl = 'https://ainewsroll.space';
    const today = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/news</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
  }
}

/**
 * SEO Endpoint: Dynamic sitemap.xml and robots.txt
 */
app.get('/api/seo', (async (req: Request, res: Response) => {
  try {
    const { sitemap: sitemapQuery, gzip: gzipQuery } = req.query;
    const useGzip = gzipQuery === '1';

    if (sitemapQuery === '1') {
      if (missingEnvError()) {
        res.status(500).json({ error: 'Server missing Supabase configuration for sitemap' });
        return;
      }
      // Sitemap
      let sitemapContent = cache.get('sitemap-xml');
      if (!sitemapContent) {
        sitemapContent = await generateSitemap();
        cache.set('sitemap-xml', sitemapContent);
      }

      let buffer: Buffer;
      if (useGzip) {
        buffer = zlib.gzipSync(sitemapContent);
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Disposition', 'attachment; filename="sitemap.xml.gz"');
      } else {
        buffer = Buffer.from(sitemapContent, 'utf-8');
        res.setHeader('Content-Type', 'application/xml');
      }
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      return res.send(buffer);
    } else {
      if (missingEnvError()) {
        res.status(500).json({ error: 'Server missing Supabase configuration for robots' });
        return;
      }
      // Robots.txt
      let robotsContent = cache.get('robots-txt');
      if (!robotsContent) {
        robotsContent = await generateRobots();
        cache.set('robots-txt', robotsContent);
      }
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      return res.send(robotsContent);
    }
  } catch (err: any) {
    console.error('SEO endpoint error:', err);
    res.status(500).json({ error: err.message || 'SEO generation failed' });
  }
}) as RequestHandler);

/**
 * Sitemap Endpoint: Fallback to static file
 */
app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.redirect('/api/seo?sitemap=1');
});

/**
 * Robots.txt Endpoint: Fallback
 */
app.get('/robots.txt', (req: Request, res: Response) => {
  res.redirect('/api/seo');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));