import { createHash } from 'node:crypto';
export const DAILY_COUNT = 3;
export const DAILY_BONUS = 1.5;
// Deterministic rotation: same three quests for everyone on a given UTC day.
export function dailyQuestIds(quests, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const rank = (q) => createHash('sha1').update(`${q.slug}:${day}`).digest('hex');
  return new Set([...quests].sort((a, b) => rank(a).localeCompare(rank(b))).slice(0, DAILY_COUNT).map((q) => q.id));
}
