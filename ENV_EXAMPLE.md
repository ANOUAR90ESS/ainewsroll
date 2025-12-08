# Environment Variables Configuration

Create a `.env.local` file in the root directory with these variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://upfjytumummgbnzykijj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google AdSense
VITE_ADSENSE_SLOT=9700587581
VITE_ADSENSE_SLOT_RSPV=your_responsive_slot_here
VITE_ADSENSE_SLOT_MCRSPV=your_multi_column_slot_here
```

## Vercel Configuration

In Vercel project settings → Environment Variables, add all the above variables.

## Important Notes

1. **Authentication**: The app uses Supabase Auth SDK (NOT raw fetch). This is more secure and handles:
   - Session management
   - Token refresh
   - Storage
   - Email confirmation
   - Password reset

2. **Login Issues**: If login fails, check:
   - Email confirmation is disabled OR user confirmed email
   - Supabase URL and Anon Key are correct
   - User exists in Supabase Auth dashboard
   - RLS policies allow access

3. **Testing Login**:
   ```javascript
   // Check in browser console
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
   console.log('Supabase configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
   ```

## Debugging Auth

If you need to debug authentication:

1. Open browser console
2. Try to login
3. Look for console logs:
   - "Attempting sign in for: [email]"
   - "Sign in error: [error details]"
   - "Sign in successful: [email]"

Common errors:
- "Invalid login credentials" → Wrong email/password
- "Email not confirmed" → User needs to confirm email
- "Network error" → Wrong Supabase URL or CORS issue
