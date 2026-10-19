import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekStart, weekEnd, weeklyQuest } from '../src/lib/weekly.js';
import { xpPlan } from '../src/lib/bonus.js';
import { quests } from '../src/seed/data.js';
import { extraQuests } from '../src/seed/extra.js';

const all = [...quests, ...extraQuests].map(({ quest }, i) => ({ id: String(i), slug: quest.slug, difficulty: quest.difficulty, xp_reward: quest.xp_reward }));

test('weeks start on Monday 00:00 UTC and last 7 days', () => {
  const wed = new Date('2026-10-14T15:30:00Z');
  assert.equal(weekStart(wed).toISOString(), '2026-10-12T00:00:00.000Z');
  assert.equal(weekStart(new Date('2026-10-18T23:59:00Z')).toISOString(), '2026-10-12T00:00:00.000Z'); // Sunday
  assert.equal(weekEnd(wed).toISOString(), '2026-10-19T00:00:00.000Z');
});

test('the weekly quest is advanced and stays the same all week', () => {
  const mon = weeklyQuest(all, new Date('2026-10-12T00:00:00Z')), sun = weeklyQuest(all, new Date('2026-10-18T23:00:00Z'));
  assert.equal(mon.difficulty, 'advanced');
  assert.equal(mon.id, sun.id);
});

test('it rotates fairly: no repeat until every advanced quest has had a turn', () => {
  const picks = new Set(Array.from({ length: 12 }, (_, w) => weeklyQuest(all, new Date(Date.UTC(2026, 9, 12 + 7 * w))).slug));
  assert.equal(picks.size, 5, `expected all 5 advanced quests to appear in 12 weeks, got ${picks.size}`);
});

test('falls back when there are no advanced quests, and handles an empty list', () => {
  assert.equal(weeklyQuest(all.filter((q) => q.difficulty === 'beginner')).difficulty, 'beginner');
  assert.equal(weeklyQuest([]), null);
});

test('weekly pays 2x, daily 1.5x, and they never stack', () => {
  const d = new Date('2026-10-14T10:00:00Z');
  const plan = xpPlan(all, d);
  assert.equal(plan.multiplier(plan.weekly.id), 2);
  const dailyOnly = [...plan.daily].find((id) => id !== plan.weekly.id);
  if (dailyOnly) assert.equal(plan.multiplier(dailyOnly), 1.5);
  const normal = all.find((q) => q.id !== plan.weekly.id && !plan.daily.has(q.id));
  assert.equal(plan.multiplier(normal.id), 1);
  assert.equal(plan.weeklyEndsAt, '2026-10-19T00:00:00.000Z');
});

test('five consecutive weeks give five different quests', () => {
  const five = Array.from({ length: 5 }, (_, w) => weeklyQuest(all, new Date(Date.UTC(2026, 9, 12 + 7 * w))).slug);
  assert.equal(new Set(five).size, 5);
});
