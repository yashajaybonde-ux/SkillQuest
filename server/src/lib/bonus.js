import { dailyQuestIds, DAILY_BONUS } from './daily.js';
import { weeklyQuest, weekEnd, WEEKLY_BONUS } from './weekly.js';

// Single source of truth for XP multipliers. A quest that is both daily and weekly gets 2x, not 3x.
// `quests` need id, slug and difficulty.
export function xpPlan(quests, date = new Date()) {
  const daily = dailyQuestIds(quests, date);
  const weekly = weeklyQuest(quests, date);
  const multiplier = (id) => (weekly && id === weekly.id ? WEEKLY_BONUS : daily.has(id) ? DAILY_BONUS : 1);
  return { daily, weekly, multiplier, weeklyEndsAt: weekEnd(date).toISOString() };
}
