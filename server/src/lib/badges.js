import { sb } from '../supabase.js';
import { must } from './errors.js';

// Evaluates every unearned badge for a student and awards the ones whose conditions are met.
// Runs on the server only. Returns the newly awarded badges.
export async function evaluateBadges(userId) {
  const [badges, earned, progress, profile, activeQuests] = await Promise.all([
    sb.from('badges').select('*'), sb.from('achievements').select('badge_id').eq('user_id', userId),
    sb.from('user_progress').select('quest_id, quests(slug, category)').eq('user_id', userId),
    sb.from('profiles').select('level').eq('id', userId).single(),
    sb.from('quests').select('id').eq('is_active', true),
  ].map((p) => p.then((r) => must(r))));

  const have = new Set(earned.map((e) => e.badge_id));
  const done = progress.map((p) => p.quests).filter(Boolean);
  const doneIds = new Set(progress.map((p) => p.quest_id));
  const byCat = {};
  done.forEach((q) => (byCat[q.category] = (byCat[q.category] || 0) + 1));

  const met = (b) => {
    switch (b.condition_type) {
      case 'quests_completed': return done.length >= b.condition_value;
      case 'category_count': return (b.condition_category || '').split(',').map((s) => s.trim()).reduce((n, c) => n + (byCat[c] || 0), 0) >= b.condition_value;
      case 'quest_slug': return done.some((q) => q.slug === b.condition_slug);
      case 'level': return profile.level >= b.condition_value;
      case 'all_quests': return activeQuests.length > 0 && activeQuests.every((q) => doneIds.has(q.id));
      default: return false;
    }
  };

  const awarded = [];
  for (const b of badges.filter((b) => !have.has(b.id) && met(b))) {
    // Primary key (user_id, badge_id) + ignoreDuplicates makes this race-safe.
    const inserted = must(await sb.from('achievements').upsert({ user_id: userId, badge_id: b.id }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true }).select());
    if (!inserted.length) continue;
    awarded.push(b);
    if (b.issues_certificate) {
      await sb.from('certificates').upsert({
        user_id: userId, badge_id: b.id, title: b.name, milestone: b.description, skills: b.skills, status: 'eligible',
      }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });
    }
  }
  return awarded;
}
