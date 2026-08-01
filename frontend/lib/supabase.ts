import { createClient as createBrowserClient } from '@/utils/supabase/client';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project')
);

export const supabase = createBrowserClient();
