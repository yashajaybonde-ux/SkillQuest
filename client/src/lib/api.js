import { supabase } from './supabase';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function api(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Cannot reach the SkillQuest server at ${API_URL}. Is it running?`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
