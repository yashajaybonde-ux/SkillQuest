import { motion } from 'framer-motion';
import { Award, Flag, Code2, Compass, Link2, Box, Trophy, Crown, Flame, Zap, ShieldCheck, Star, Lock } from 'lucide-react';

const ICONS = { award: Award, flag: Flag, code: Code2, compass: Compass, link: Link2, box: Box, trophy: Trophy, crown: Crown, flame: Flame, zap: Zap, shield: ShieldCheck, star: Star };
const TONE = {
  violet: 'text-violet-300 border-violet-400/70 shadow-[0_0_28px_-6px_rgba(16,185,129,.7)]',
  blue: 'text-blue-300 border-blue-400/70 shadow-[0_0_28px_-6px_rgba(20,184,166,.7)]',
  cyan: 'text-cyan-300 border-cyan-400/70 shadow-[0_0_28px_-6px_rgba(132,204,22,.6)]',
  amber: 'text-amber-300 border-amber-400/70 shadow-[0_0_28px_-6px_rgba(251,191,36,.55)]',
};
export const badgeIcons = Object.keys(ICONS);

// A badge rendered as a passport stamp: double ring, slightly rotated.
export function Stamp({ icon = 'award', color = 'violet', earned = true, size = 72, rotate = -6 }) {
  const Icon = earned ? ICONS[icon] || Award : Lock;
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-full border-2 ${earned ? TONE[color] || TONE.violet : 'border-ink-600 text-slate-600'}`} style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}>
      <div className={`absolute inset-1.5 rounded-full border border-dashed ${earned ? 'border-current opacity-50' : 'border-ink-600'}`} />
      <Icon style={{ width: size * 0.42, height: size * 0.42 }} />
    </div>
  );
}

// Used by the landing page and completion modal: stamps that thud onto the page one at a time.
export const StampIn = ({ delay = 0, children }) => (
  <motion.div initial={{ scale: 2.4, opacity: 0, rotate: 18 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ delay, type: 'spring', stiffness: 380, damping: 16 }}>{children}</motion.div>
);
