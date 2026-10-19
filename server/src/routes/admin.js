import { Router } from 'express';
import { z } from 'zod';
import { sb } from '../supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { HttpError, wrap, must } from '../lib/errors.js';
import { issueRow } from '../lib/certificates.js';
import { revokeOnChain, txUrl } from '../lib/chain.js';

const r = Router();
r.use(requireAdmin); // every admin route is checked against the DB role on the server

const CATS = ['javascript', 'html_css', 'programming', 'blockchain', 'web_dev'];
const questSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/, 'Slug: lowercase letters, numbers and dashes.'),
  title: z.string().trim().min(3).max(120), description: z.string().max(500).default(''), instructions: z.string().max(4000).default(''),
  category: z.enum(CATS), difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  xp_reward: z.number().int().min(5).max(1000), type: z.enum(['quiz', 'code', 'html']),
  challenge: z.record(z.any()), answer_key: z.record(z.any()), is_active: z.boolean().default(true),
});
const badgeSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/), name: z.string().trim().min(2).max(60), description: z.string().max(200).default(''),
  icon: z.string().max(30).default('award'), color: z.enum(['violet', 'blue', 'cyan', 'amber']).default('violet'),
  condition_type: z.enum(['quests_completed', 'category_count', 'quest_slug', 'level', 'all_quests']),
  condition_value: z.number().int().min(1).max(10000).default(1),
  condition_category: z.string().max(100).nullable().optional(), condition_slug: z.string().max(60).nullable().optional(),
  issues_certificate: z.boolean().default(false), skills: z.array(z.string().max(40)).max(10).default([]),
});

const dupMsg = (e, what) => { if (e?.code === '23505') throw new HttpError(409, `${what} already exists.`); };

// ---------- Overview / analytics ----------
r.get('/stats', wrap(async (_req, res) => {
  const count = async (t, f) => { let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); return (await q).count ?? 0; };
  const since = new Date(Date.now() - 13 * 864e5).toISOString();
  const [students, quests, submissions, passed, issued, revoked, eligible, verifications] = await Promise.all([
    count('profiles'), count('quests', (q) => q.eq('is_active', true)), count('quest_submissions'), count('quest_submissions', (q) => q.eq('passed', true)),
    count('certificates', (q) => q.eq('status', 'issued')), count('certificates', (q) => q.eq('status', 'revoked')), count('certificates', (q) => q.eq('status', 'eligible')), count('verification_logs'),
  ]);
  const prog = must(await sb.from('user_progress').select('xp_awarded, completed_at, quests(category)').gte('completed_at', since));
  const days = {}; for (let i = 13; i >= 0; i--) days[new Date(Date.now() - i * 864e5).toISOString().slice(5, 10)] = { day: '', completions: 0, xp: 0 };
  const cats = {};
  prog.forEach((p) => { const d = days[p.completed_at.slice(5, 10)]; if (d) { d.completions++; d.xp += p.xp_awarded; } const c = p.quests?.category; if (c) cats[c] = (cats[c] || 0) + 1; });
  const vlogs = must(await sb.from('verification_logs').select('result').gte('created_at', since));
  const vres = {}; vlogs.forEach((v) => (vres[v.result] = (vres[v.result] || 0) + 1));
  res.json({
    totals: { students, quests, submissions, passRate: submissions ? Math.round((passed / submissions) * 100) : 0, issued, revoked, eligible, verifications },
    activity: Object.entries(days).map(([day, v]) => ({ ...v, day })),
    categories: Object.entries(cats).map(([name, value]) => ({ name, value })),
    verificationResults: Object.entries(vres).map(([name, value]) => ({ name, value })),
  });
}));

// ---------- Quests ----------
r.get('/quests', wrap(async (_req, res) => {
  const rows = must(await sb.from('quests').select('*, quest_answers(answer_key)').order('created_at', { ascending: false }));
  res.json({ quests: rows.map(({ quest_answers, ...q }) => ({ ...q, answer_key: quest_answers?.answer_key ?? {} })) });
}));
r.post('/quests', wrap(async (req, res) => {
  const { answer_key, ...q } = questSchema.parse(req.body);
  const { data, error } = await sb.from('quests').insert(q).select().single();
  dupMsg(error, 'A quest with that slug'); if (error) throw new HttpError(500, 'Could not create quest.');
  must(await sb.from('quest_answers').insert({ quest_id: data.id, answer_key }));
  res.status(201).json({ quest: data });
}));
r.put('/quests/:id', wrap(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { answer_key, ...q } = questSchema.parse(req.body);
  const { data, error } = await sb.from('quests').update({ ...q, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  dupMsg(error, 'A quest with that slug'); if (error) throw new HttpError(500, 'Could not update quest.');
  must(await sb.from('quest_answers').upsert({ quest_id: id, answer_key }));
  res.json({ quest: data });
}));
r.delete('/quests/:id', wrap(async (req, res) => {
  must(await sb.from('quests').delete().eq('id', z.string().uuid().parse(req.params.id)));
  res.json({ ok: true });
}));

// ---------- Badges ----------
r.get('/badges', wrap(async (_req, res) => res.json({ badges: must(await sb.from('badges').select('*').order('created_at')) })));
r.post('/badges', wrap(async (req, res) => {
  const { data, error } = await sb.from('badges').insert(badgeSchema.parse(req.body)).select().single();
  dupMsg(error, 'A badge with that slug'); if (error) throw new HttpError(500, 'Could not create badge.');
  res.status(201).json({ badge: data });
}));
r.put('/badges/:id', wrap(async (req, res) => {
  const { data, error } = await sb.from('badges').update(badgeSchema.parse(req.body)).eq('id', z.string().uuid().parse(req.params.id)).select().single();
  dupMsg(error, 'A badge with that slug'); if (error) throw new HttpError(500, 'Could not update badge.');
  res.json({ badge: data });
}));
r.delete('/badges/:id', wrap(async (req, res) => {
  must(await sb.from('badges').delete().eq('id', z.string().uuid().parse(req.params.id)));
  res.json({ ok: true });
}));

// ---------- Students ----------
r.get('/students', wrap(async (_req, res) => {
  res.json({ students: must(await sb.from('profiles').select('id, username, full_name, role, xp, level, wallet_address, created_at').order('xp', { ascending: false }).limit(500)) });
}));
r.patch('/students/:id', wrap(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { role } = z.object({ role: z.enum(['student', 'admin']) }).parse(req.body);
  if (id === req.user.id) throw new HttpError(400, 'You cannot change your own role.');
  must(await sb.from('profiles').update({ role }).eq('id', id));
  res.json({ ok: true });
}));

// ---------- Certificates ----------
r.get('/certificates', wrap(async (_req, res) => {
  const rows = must(await sb.from('certificates').select('id, public_id, title, status, tx_hash, issued_at, created_at, profiles(username, full_name)').order('created_at', { ascending: false }).limit(200));
  res.json({ certificates: rows.map((c) => ({ ...c, tx_url: txUrl(c.tx_hash) })) });
}));
r.post('/certificates/issue', wrap(async (req, res) => {
  const b = z.object({ userId: z.string().uuid(), title: z.string().trim().min(3).max(120), milestone: z.string().max(300).default(''), skills: z.array(z.string().max(40)).max(10).default([]) }).parse(req.body);
  const row = must(await sb.from('certificates').insert({ user_id: b.userId, title: b.title, milestone: b.milestone, skills: b.skills, status: 'issuing' }).select().single());
  try { const cert = await issueRow(row); res.status(201).json({ certificate: cert }); }
  catch (e) { await sb.from('certificates').delete().eq('id', row.id).eq('status', 'eligible'); throw e; }
}));
r.post('/certificates/:id/revoke', wrap(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const c = must(await sb.from('certificates').select('public_id, status').eq('id', id).single());
  if (c.status !== 'issued') throw new HttpError(400, 'Only issued certificates can be revoked.');
  await revokeOnChain(c.public_id);
  must(await sb.from('certificates').update({ status: 'revoked' }).eq('id', id));
  res.json({ ok: true });
}));

// ---------- Verification monitoring ----------
r.get('/verifications', wrap(async (_req, res) => {
  res.json({ logs: must(await sb.from('verification_logs').select('*').order('created_at', { ascending: false }).limit(100)) });
}));

export default r;
