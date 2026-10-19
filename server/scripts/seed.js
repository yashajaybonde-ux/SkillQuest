import { sb } from '../src/supabase.js';
import { quests, badges } from '../src/seed/data.js';

const ok = (label, { error }) => { if (error) { console.error(`${label} failed:`, error.message); process.exit(1); } };

for (const { quest, key } of quests) {
  const { data, error } = await sb.from('quests').upsert(quest, { onConflict: 'slug' }).select('id').single();
  ok(`quest ${quest.slug}`, { error });
  ok(`answers ${quest.slug}`, await sb.from('quest_answers').upsert({ quest_id: data.id, answer_key: key }));
}
ok('badges', await sb.from('badges').upsert(badges, { onConflict: 'slug' }));
console.log(`Seeded ${quests.length} quests and ${badges.length} badges.`);
