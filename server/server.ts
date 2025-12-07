import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { createClient, User } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing in .env');
  process.exit(1);
}

// Client with SERVICE ROLE - ONLY for backend use
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));