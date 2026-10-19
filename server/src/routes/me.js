import { Router } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { sb } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, wrap, must } from '../lib/errors.js';
import { levelProgress, levelFromXp } from '../lib/xp.js';
import { xpPlan } from '../lib/bonus.js';
import { gradeSubmission } from '../lib/grader.js';
import { evaluateBadges } from '../lib/badges.js';
import { claimEligible } from '../lib/certificates.js';
import { txUrl } from '../lib/chain.js';

const r = Router();
r.use(requireAuth);

// ---------- Dashboard / profile ----------
r.get('/me', wrap(async (req, res) => {
  const id = req.user.id;
  const profile = must(await sb.from('profiles').select('*').eq('id', id).single());
  const [quests, progress, badges, certs] = await Promise.all([
    sb.from('quests').select('id, slug, title, category, difficulty, xp_reward').eq('is_active', true),
    sb.from('user_progress').select('quest_id, xp_awarded, completed_at').eq('user_id', id).order('completed_at', { ascending: false }),
    sb.from('achievements').select('awarded_at, badges(name, icon, color)').eq('user_id', id).order('awarded_at', { ascending: false }),
    sb.from('certificates').select('id, status').eq('user_id', id),
  ]).then((rs) => rs.map((x) => must(x)));
  const { count: rankAhead } = await sb.from('profiles').select('id', { count: 'exact', head: true }).gt('xp', profile.xp);

  const doneIds = new Set(progress.map((p) => p.quest_id));
  const byCategory = {};
  quests.forEach((q) => { const c = (byCategory[q.category] ||= { total: 0, completed: 0 }); c.total++; if (doneIds.has(q.id)) c.completed++; });
  const questMap = Object.fromEntries(quests.map((q) => [q.id, q]));
  const plan = xpPlan(quests);
  const bonusXp = (q) => Math.round(q.xp_reward * plan.multiplier(q.id));
  const week = {};
  for (let i = 6; i >= 0; i--) week[new Date(Date.now() - i * 864e5).toISOString().slice(5, 10)] = 0;
  progress.forEach((p) => { const k = p.completed_at.slice(5, 10); if (k in week) week[k] += p.xp_awarded; });

  res.json({
    profile, level: levelProgress(profile.xp), rank: (rankAhead ?? 0) + 1,
    progress: { total: quests.length, completed: doneIds.size, byCategory },
    daily: quests.filter((q) => plan.daily.has(q.id)).map((q) => ({ ...q, xp: bonusXp(q), completed: doneIds.has(q.id) })),
    weekly: plan.weekly && { id: plan.weekly.id, slug: plan.weekly.slug, title: plan.weekly.title, xp: bonusXp(plan.weekly), completed: doneIds.has(plan.weekly.id), endsAt: plan.weeklyEndsAt },
    recent: progress.slice(0, 5).map((p) => ({ title: questMap[p.quest_id]?.title, xp: p.xp_awarded, at: p.completed_at })),
    xpWeek: Object.entries(week).map(([day, xp]) => ({ day, xp })),
    badgeCount: badges.length, recentBadges: badges.slice(0, 4).map((b) => b.badges),
    certificateCount: certs.filter((c) => c.status === 'issued').length,
    claimable: certs.filter((c) => c.status === 'eligible').length,
  });
}));

const settingsSchema = z.object({
  username: z.string().regex(/^[a-z0-9_]{3,20}$/, 'Username: 3-20 lowercase letters, numbers or underscores.').optional(),
  full_name: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(300).optional(),
  avatar_url: z.union([z.string().url().max(500).regex(/^https?:\/\//), z.literal('')]).optional(),
  skills: z.array(z.string().trim().min(1).max(30)).max(15).optional(),
  is_public: z.boolean().optional(), show_certificates: z.boolean().optional(), show_badges: z.boolean().optional(),
  show_skills: z.boolean().optional(), show_progress: z.boolean().optional(), show_on_leaderboard: z.boolean().optional(),
}).strict();

r.patch('/me', wrap(async (req, res) => {
  const body = settingsSchema.parse(req.body);
  if (body.avatar_url === '') body.avatar_url = null;
  const { data, error } = await sb.from('profiles').update(body).eq('id', req.user.id).select().single();
  if (error?.code === '23505') throw new HttpError(409, 'That username is taken.');
  if (error) throw new HttpError(500, 'Could not save your profile.');
  res.json({ profile: data });
}));

r.get('/me/badges', wrap(async (req, res) => {
  const [all, mine] = await Promise.all([sb.from('badges').select('*').order('created_at'), sb.from('achievements').select('badge_id, awarded_at').eq('user_id', req.user.id)]).then((rs) => rs.map((x) => must(x)));
  const got = Object.fromEntries(mine.map((m) => [m.badge_id, m.awarded_at]));
  res.json({ badges: all.map((b) => ({ ...b, earned: !!got[b.id], awarded_at: got[b.id] || null })) });
}));

r.get('/me/certificates', wrap(async (req, res) => {
  const rows = must(await sb.from('certificates').select('id, public_id, title, milestone, skills, status, credential, credential_hash, tx_hash, block_number, chain_id, recipient_wallet, issued_at, created_at').eq('user_id', req.user.id).order('created_at', { ascending: false }));
  res.json({ certificates: rows.map((c) => ({ ...c, tx_url: txUrl(c.tx_hash) })) });
}));

r.post('/certificates/:id/claim', wrap(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const cert = await claimEligible(id, req.user.id);
  res.json({ certificate: { ...cert, tx_url: txUrl(cert.tx_hash) } });
}));

// ---------- Quest submission: all grading and rewards happen here, on the server ----------
r.post('/quests/:slug/submit', wrap(async (req, res) => {
  const { answer } = z.object({ answer: z.any() }).parse(req.body);
  if (JSON.stringify(answer ?? null).length > 40000) throw new HttpError(400, 'Submission is too large.');
  const uid = req.user.id;

  const quest = must(await sb.from('quests').select('*').eq('slug', req.params.slug).eq('is_active', true).maybeSingle());
  if (!quest) throw new HttpError(404, 'Quest not found.');
  const existing = must(await sb.from('user_progress').select('quest_id').eq('user_id', uid).eq('quest_id', quest.id).maybeSingle());
  if (existing) throw new HttpError(409, 'You already completed this quest.');
  const key = must(await sb.from('quest_answers').select('answer_key').eq('quest_id', quest.id).single()).answer_key;

  const result = await gradeSubmission(quest, key, answer);
  must(await sb.from('quest_submissions').insert({ user_id: uid, quest_id: quest.id, answer: typeof answer === 'string' ? { text: answer } : { value: answer }, passed: result.passed, score: result.score }));
  if (!result.passed) return res.json({ passed: false, score: result.score, feedback: result.feedback, xpAwarded: 0 });

  const active = must(await sb.from('quests').select('id, slug, difficulty').eq('is_active', true));
  const xp = Math.round(quest.xp_reward * xpPlan(active).multiplier(quest.id)); // weekly 2x, daily 1.5x, never stacked
  // The (user_id, quest_id) primary key makes this insert succeed exactly once, even for racing requests.
  const inserted = must(await sb.from('user_progress').upsert({ user_id: uid, quest_id: quest.id, xp_awarded: xp }, { onConflict: 'user_id,quest_id', ignoreDuplicates: true }).select());
  if (!inserted.length) throw new HttpError(409, 'You already completed this quest.');

  const before = must(await sb.from('profiles').select('level').eq('id', uid).single()).level;
  const [after] = must(await sb.rpc('add_xp', { p_user: uid, p_xp: xp }));
  const newBadges = await evaluateBadges(uid);
  res.json({
    passed: true, score: result.score, feedback: result.feedback, xpAwarded: xp, totalXp: after.xp,
    level: levelFromXp(after.xp), leveledUp: after.level > before,
    newBadges: newBadges.map((b) => ({ name: b.name, icon: b.icon, color: b.color, issues_certificate: b.issues_certificate })),
  });
}));

// ---------- MetaMask wallet linking (signature-verified, no gas) ----------
const linkMessage = (userId, address, issuedAt) => `Link this wallet to my SkillQuest account.\n\nAccount: ${userId}\nWallet: ${address}\nIssued: ${issuedAt}`;
const addr = z.string().refine((a) => ethers.isAddress(a), 'Invalid wallet address.');

r.post('/wallet/challenge', wrap(async (req, res) => {
  const { address } = z.object({ address: addr }).parse(req.body);
  const issuedAt = new Date().toISOString();
  res.json({ issuedAt, message: linkMessage(req.user.id, ethers.getAddress(address), issuedAt) });
}));

r.post('/wallet/link', wrap(async (req, res) => {
  const { address, issuedAt, signature } = z.object({ address: addr, issuedAt: z.string().datetime(), signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/) }).parse(req.body);
  if (Math.abs(Date.now() - Date.parse(issuedAt)) > 10 * 60 * 1000) throw new HttpError(400, 'That signature request expired. Try again.');
  const checksum = ethers.getAddress(address);
  let signer;
  try { signer = ethers.verifyMessage(linkMessage(req.user.id, checksum, issuedAt), signature); } catch { throw new HttpError(400, 'Invalid signature.'); }
  if (signer !== checksum) throw new HttpError(400, 'The signature does not match that wallet.');

  const lower = checksum.toLowerCase();
  const { error } = await sb.from('profiles').update({ wallet_address: lower }).eq('id', req.user.id);
  if (error?.code === '23505') throw new HttpError(409, 'That wallet is already linked to another account.');
  if (error) throw new HttpError(500, 'Could not link wallet.');
  await sb.from('wallet_connections').update({ unlinked_at: new Date().toISOString() }).eq('user_id', req.user.id).is('unlinked_at', null);
  await sb.from('wallet_connections').insert({ user_id: req.user.id, address: lower });
  res.json({ wallet_address: lower });
}));

r.delete('/wallet', wrap(async (req, res) => {
  must(await sb.from('profiles').update({ wallet_address: null }).eq('id', req.user.id));
  await sb.from('wallet_connections').update({ unlinked_at: new Date().toISOString() }).eq('user_id', req.user.id).is('unlinked_at', null);
  res.json({ wallet_address: null });
}));

export default r;
