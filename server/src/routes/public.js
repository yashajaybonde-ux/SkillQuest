import { Router } from 'express';
import { z } from 'zod';
import { sb } from '../supabase.js';
import { optionalAuth } from '../middleware/auth.js';
import { HttpError, wrap, must } from '../lib/errors.js';
import { xpPlan } from '../lib/bonus.js';
import { getOnChain, chainInfo, txUrl } from '../lib/chain.js';
import { hashCredential, PUBLIC_ID_RE } from '../lib/credential.js';

const r = Router();
const DIFF = { beginner: 0, intermediate: 1, advanced: 2 };

r.get('/health', (_req, res) => res.json({ ok: true }));

r.get('/quests', optionalAuth, wrap(async (req, res) => {
  const quests = must(await sb.from('quests').select('id, slug, title, description, category, difficulty, xp_reward, type').eq('is_active', true));
  let done = new Set();
  if (req.user) done = new Set(must(await sb.from('user_progress').select('quest_id').eq('user_id', req.user.id)).map((d) => d.quest_id));
  const plan = xpPlan(quests);
  quests.sort((a, b) => DIFF[a.difficulty] - DIFF[b.difficulty] || a.xp_reward - b.xp_reward);
  res.json({
    weeklyEndsAt: plan.weeklyEndsAt,
    quests: quests.map((q) => ({ ...q, completed: done.has(q.id), daily: plan.daily.has(q.id), weekly: plan.weekly?.id === q.id, bonus_xp: Math.round(q.xp_reward * (plan.multiplier(q.id) - 1)) })),
  });
}));

r.get('/quests/:slug', optionalAuth, wrap(async (req, res) => {
  const quest = must(await sb.from('quests').select('id, slug, title, description, instructions, category, difficulty, xp_reward, type, challenge').eq('slug', req.params.slug).eq('is_active', true).maybeSingle());
  if (!quest) throw new HttpError(404, 'Quest not found.');
  let completed = false;
  if (req.user) completed = !!must(await sb.from('user_progress').select('quest_id').eq('user_id', req.user.id).eq('quest_id', quest.id).maybeSingle());
  const all = must(await sb.from('quests').select('id, slug, difficulty').eq('is_active', true));
  const plan = xpPlan(all);
  res.json({ quest: { ...quest, completed, daily: plan.daily.has(quest.id), weekly: plan.weekly?.id === quest.id, bonus_xp: Math.round(quest.xp_reward * (plan.multiplier(quest.id) - 1)) } });
}));

r.get('/badges', wrap(async (_req, res) => {
  res.json({ badges: must(await sb.from('badges').select('id, slug, name, description, icon, color, condition_type, condition_value, issues_certificate').order('created_at')) });
}));

r.get('/leaderboard', wrap(async (req, res) => {
  const period = z.enum(['weekly', 'all']).catch('all').parse(req.query.period);
  const rows = must(await sb.rpc('leaderboard', { p_period: period, p_limit: 50 }));
  res.json({ period, entries: rows.map((e, i) => ({ rank: i + 1, ...e, xp: Number(e.xp), quests_completed: Number(e.quests_completed), badges_count: Number(e.badges_count) })) });
}));

// ---------- Public passport (honours each student's privacy switches) ----------
r.get('/passports/:username', wrap(async (req, res) => {
  const p = must(await sb.from('profiles').select('*').eq('username', String(req.params.username).toLowerCase()).eq('is_public', true).maybeSingle());
  if (!p) throw new HttpError(404, 'This passport does not exist or is private.');
  const out = { profile: { username: p.username, full_name: p.full_name, avatar_url: p.avatar_url, bio: p.bio, level: p.level, xp: p.xp, joined: p.created_at, skills: p.show_skills ? p.skills : null } };
  const prog = must(await sb.from('user_progress').select('completed_at, quests(title, category, difficulty)').eq('user_id', p.id).order('completed_at', { ascending: false }));
  out.stats = { quests_completed: prog.length };
  out.milestones = p.show_progress ? prog.slice(0, 20).map((x) => ({ ...x.quests, completed_at: x.completed_at })) : null;
  out.badges = p.show_badges ? must(await sb.from('achievements').select('awarded_at, badges(name, description, icon, color)').eq('user_id', p.id).order('awarded_at')).map((a) => ({ ...a.badges, awarded_at: a.awarded_at })) : null;
  out.certificates = p.show_certificates
    ? must(await sb.from('certificates').select('public_id, title, skills, issued_at, tx_hash').eq('user_id', p.id).eq('status', 'issued').order('issued_at', { ascending: false })).map((c) => ({ ...c, tx_url: txUrl(c.tx_hash) }))
    : null;
  res.json(out);
}));

// ---------- Certificate verification ----------
const parseId = (raw) => {
  const id = String(raw || '').trim().toUpperCase();
  if (!PUBLIC_ID_RE.test(id)) throw new HttpError(400, 'Certificate IDs look like SQ-1A2B-3C4D-5E6F.');
  return id;
};
const log = (public_id, result, source) => sb.from('verification_logs').insert({ public_id, result, source }).then(() => {}, () => {});

r.get('/verify/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const chain = await getOnChain(id); // source of truth
  const row = must(await sb.from('certificates').select('title, skills, credential, credential_hash, tx_hash, block_number, chain_id, issued_at, status').eq('public_id', id).maybeSingle());

  let result = 'valid';
  if (!chain) result = 'not_found';
  else if (chain.revoked) result = 'revoked';
  else if (!row?.credential || hashCredential(row.credential) !== chain.credentialHash) result = 'tampered'; // off-chain record no longer matches the on-chain hash
  await log(id, result, 'lookup');

  res.json({
    result, publicId: id, chain: chainInfo(),
    onChain: chain && { ...chain, issuedAtIso: new Date(chain.issuedAt * 1000).toISOString() },
    certificate: chain && row ? { title: row.title, skills: row.skills, student: row.credential?.student, issuedAt: row.issued_at, txHash: row.tx_hash, txUrl: txUrl(row.tx_hash), blockNumber: row.block_number } : null,
  });
}));

// Paste/upload a credential file: is it byte-for-byte what was issued?
r.post('/verify/:id/check', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { credential } = z.object({ credential: z.record(z.any()) }).parse(req.body);
  const chain = await getOnChain(id);
  if (!chain) { await log(id, 'not_found', 'check'); return res.json({ result: 'not_found' }); }
  const same = hashCredential(credential) === chain.credentialHash;
  const result = chain.revoked ? 'revoked' : same ? 'authentic' : 'modified';
  await log(id, result, 'check');
  res.json({ result, submittedHash: hashCredential(credential), onChainHash: chain.credentialHash });
}));

export default r;
