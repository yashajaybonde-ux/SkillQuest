export const WEEKLY_BONUS = 2; // double XP
const DAY = 864e5;

// Weeks run Monday 00:00 UTC to the next Monday 00:00 UTC.
export function weekStart(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
}
export const weekEnd = (date = new Date()) => new Date(weekStart(date).getTime() + 7 * DAY);

// One hard quest per week, the same for everyone. Advanced quests first, then intermediate, then anything.
export function weeklyQuest(quests, date = new Date()) {
  const pool = ['advanced', 'intermediate'].map((d) => quests.filter((q) => q.difficulty === d)).find((p) => p.length) || quests;
  if (!pool.length) return null;
  // Fair rotation: walk through the pool in slug order, one quest per week, so nothing repeats until all have had a turn.
  const weekNumber = Math.floor(weekStart(date).getTime() / (7 * DAY));
  return [...pool].sort((a, b) => a.slug.localeCompare(b.slug))[weekNumber % pool.length];
}
