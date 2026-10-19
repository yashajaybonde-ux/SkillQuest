import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseReady = Boolean(url && key);
// Browser client uses the public ANON key only. Row Level Security protects the data.
export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-anon-key');
