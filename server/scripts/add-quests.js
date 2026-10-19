// Adds the extra quests to your database. Safe to run again: quests are matched by slug.
// Usage (from the server folder):  node scripts/add-quests.js
import { sb } from '../src/supabase.js';
import { extraQuests } from '../src/seed/extra.js';

for (const { quest, key } of extraQuests) {
  const { data, error } = await sb.from('quests').upsert(quest, { onConflict: 'slug' }).select('id').single();
  if (error) { console.error(`Quest ${quest.slug} failed:`, error.message); process.exit(1); }
  const { error: aerr } = await sb.from('quest_answers').upsert({ quest_id: data.id, answer_key: key });
  if (aerr) { console.error(`Answers for ${quest.slug} failed:`, aerr.message); process.exit(1); }
}
console.log(`Added or updated ${extraQuests.length} quests.`);
process.exit(0);
