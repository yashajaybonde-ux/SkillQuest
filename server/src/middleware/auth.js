import { sb } from '../supabase.js';
import { HttpError, wrap } from '../lib/errors.js';

const tokenOf = (req) => { const h = req.headers.authorization || ''; return h.startsWith('Bearer ') ? h.slice(7) : null; };

export const optionalAuth = wrap(async (req, _res, next) => {
  const t = tokenOf(req);
  if (t) { const { data } = await sb.auth.getUser(t); if (data?.user) req.user = data.user; }
  next();
});

export const requireAuth = wrap(async (req, _res, next) => {
  const t = tokenOf(req);
  if (!t) throw new HttpError(401, 'Please sign in.');
  const { data, error } = await sb.auth.getUser(t); // validates the JWT with Supabase
  if (error || !data?.user) throw new HttpError(401, 'Your session expired. Please sign in again.');
  req.user = data.user;
  next();
});

// Role is read from the database on every request, never from the token or the client.
export const requireAdmin = [requireAuth, wrap(async (req, _res, next) => {
  const { data } = await sb.from('profiles').select('role').eq('id', req.user.id).single();
  if (data?.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
  next();
})];
