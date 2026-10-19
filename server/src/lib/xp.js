// level = floor(sqrt(xp / 100)) + 1  (mirrors the add_xp SQL function)
export const xpForLevel = (level) => 100 * (level - 1) ** 2;
export const levelFromXp = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, needed: next - base, percent: Math.round(((xp - base) / (next - base)) * 100) };
}
