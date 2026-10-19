// Fills a demo user's profile with completed quests, XP, badges and stamps.
// Usage (from the server folder):  node scripts/demo-badges.js [username] [number of quests]
// Example: node scripts/demo-badges.js demo 12   (leaves the rest to complete live in a presentation)
import { sb } from '../src/supabase.js';
import { evaluateBadges } from '../src/lib/badges.js';

const username = (process.argv[2] || 'demo').toLowerCase();
const limit = Number(process.argv[3]) || Infinity;

const { data: profile } = await sb.from('profiles').select('id, username').eq('username', username).maybeSingle();
if (!profile) { console.error(`No user named "${username}". Create the demo account first (node scripts/create-demo.js).`); process.exit(1); }

const { data: quests, error } = await sb.from('quests').select('id, title, xp_reward, created_at').eq('is_active', true).order('created_at');
if (error || !quests?.length) { console.error('No quests found. Run "npm run seed" first.'); process.exit(1); }

// Spread completions over the last 7 days so the dashboard chart and weekly leaderboard look natural.
const rows = quests.slice(0, limit).map((q, i) => ({
  user_id: profile.id, quest_id: q.id, xp_awarded: q.xp_reward,
  completed_at: new Date(Date.now() - (i % 7) * 864e5 - Math.floor(Math.random() * 6) * 36e5).toISOString(),
}));

// The (user_id, quest_id) primary key means quests already completed are skipped, never double-counted.
const { data: inserted, error: perr } = await sb.from('user_progress').upsert(rows, { onConflict: 'user_id,quest_id', ignoreDuplicates: true }).select();
if (perr) { console.error('Could not save progress:', perr.message); process.exit(1); }

const xp = inserted.reduce((n, r) => n + r.xp_awarded, 0);
if (xp > 0) {
  const { error: xerr } = await sb.rpc('add_xp', { p_user: profile.id, p_xp: xp });
  if (xerr) { console.error('Could not add XP:', xerr.message); process.exit(1); }
}

const badges = await evaluateBadges(profile.id); // same rules the app uses for real completions

const { data: me } = await sb.from('profiles').select('xp, level').eq('id', profile.id).single();
console.log(`\n${profile.username}: ${inserted.length} quest(s) newly completed, +${xp} XP`);
console.log(`Now level ${me.level} with ${me.xp} XP`);
console.log(badges.length ? `New badges: ${badges.map((b) => b.name).join(', ')}` : 'No new badges (already earned, or conditions not met yet).');
if (badges.some((b) => b.issues_certificate)) console.log('Certificates are now ready to claim on the Certificates page.');
console.log('');
process.exit(0);
