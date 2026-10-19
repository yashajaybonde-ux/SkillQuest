import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Service-role client: bypasses RLS. Used ONLY on the server, after we have
// authenticated and authorised the caller ourselves.
export const sb = createClient(config.supabaseUrl, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
