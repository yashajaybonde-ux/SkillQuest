import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Code2, Crown, FileCode2, Flame, ListChecks, Lock, Zap } from 'lucide-react';
import { CATEGORY } from '../lib/utils';
import { XPBar } from './ui';

const LEVEL = { beginner: 0, intermediate: 1, advanced: 2 };
const TYPE_ICON = { code: Code2, html: FileCode2, quiz: ListChecks };
// Full class names so Tailwind can see them.
const ACCENT = {
  javascript: { ring: 'border-amber-400', text: 'text-amber-300', fill: 'bg-amber-400', glow: 'shadow-[0_0_26px_-4px_rgba(245,158,11,.75)]' },
  html_css: { ring: 'border-blue-400', text: 'text-blue-300', fill: 'bg-blue-400', glow: 'shadow-[0_0_26px_-4px_rgba(20,184,166,.75)]' },
  programming: { ring: 'border-sky-400', text: 'text-sky-300', fill: 'bg-sky-400', glow: 'shadow-[0_0_26px_-4px_rgba(56,189,248,.75)]' },
  blockchain: { ring: 'border-violet-400', text: 'text-violet-300', fill: 'bg-violet-400', glow: 'shadow-[0_0_26px_-4px_rgba(16,185,129,.75)]' },
  web_dev: { ring: 'border-cyan-400', text: 'text-cyan-300', fill: 'bg-cyan-400', glow: 'shadow-[0_0_26px_-4px_rgba(132,204,22,.75)]' },
};

// Paths are built from the quest list: easiest first inside each topic.
// "Up next" is the first unfinished quest in a path. Later nodes are only a suggested order, they stay open.
function buildPaths(quests) {
  return Object.keys(CATEGORY).map((cat) => {
    const items = quests.filter((q) => q.category === cat).sort((a, b) => LEVEL[a.difficulty] - LEVEL[b.difficulty] || a.xp_reward - b.xp_reward);
    const nextIdx = items.findIndex((q) => !q.completed);
    const nodes = items.map((q, i) => ({ q, state: q.completed ? 'done' : i === nextIdx ? 'next' : 'locked' }));
    return { cat, nodes, done: items.filter((q) => q.completed).length, total: items.length };
  }).filter((p) => p.total > 0);
}

function Node({ q, state, accent: a, index }) {
  const Icon = TYPE_ICON[q.type] || Code2;
  const xp = q.xp_reward + (q.bonus_xp || 0);
  const face = state === 'done' ? `${a.fill} border-transparent text-white`
    : state === 'next' ? `${a.ring} ${a.glow} bg-ink-900/80 ${a.text}`
    : 'border-ink-600 bg-ink-700/60 text-slate-500';
  return (
    <motion.div initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }} className="flex w-24 shrink-0 flex-col items-center">
      <Link to={`/quests/${q.slug}`} className="group relative" aria-label={`${q.title}, ${q.difficulty}, ${xp} XP, ${state === 'done' ? 'completed' : state === 'next' ? 'up next' : 'later in the path'}`} title={state === 'locked' ? 'Suggested for later, but you can start it now' : q.title}>
        {state === 'next' && <span className={`absolute inset-0 rounded-full border-2 ${a.ring} node-pulse`} />}
        <span className={`relative grid h-16 w-16 place-items-center rounded-full border-2 transition duration-300 group-hover:scale-110 ${face}`}>
          {state === 'done' ? <Check className="h-7 w-7" strokeWidth={3} /> : state === 'locked' ? <Lock className="h-5 w-5" /> : <Icon className="h-6 w-6" />}
        </span>
        {q.weekly && !q.completed && <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-cyan-400 text-white" title="Weekly challenge, double XP"><Crown className="h-3.5 w-3.5" /></span>}
        {q.daily && !q.weekly && !q.completed && <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-amber-400 text-white" title="Daily quest, bonus XP"><Flame className="h-3.5 w-3.5" /></span>}
      </Link>
      <p className={`mt-2 line-clamp-2 text-center text-xs font-semibold leading-tight ${state === 'locked' ? 'text-slate-500' : 'text-fg'}`}>{q.title}</p>
      <p className="text-[11px] text-slate-500">{xp} XP</p>
    </motion.div>
  );
}

const Link_ = ({ lit, a }) => <div className={`mt-[30px] h-1 w-7 shrink-0 rounded-full transition-colors duration-500 ${lit ? a.fill : 'bg-ink-600'}`} />;

export default function SkillMap({ quests }) {
  const paths = buildPaths(quests);
  const allNext = paths.flatMap((p) => p.nodes.filter((n) => n.state === 'next').map((n) => n.q));
  const pick = allNext.find((q) => q.weekly) || allNext.find((q) => q.daily) || [...allNext].sort((a, b) => LEVEL[a.difficulty] - LEVEL[b.difficulty])[0];
  const xpLeft = quests.filter((q) => !q.completed).reduce((n, q) => n + q.xp_reward, 0);

  return (
    <div className="space-y-5">
      {pick ? (
        <Link to={`/quests/${pick.slug}`} className="panel panel-hover flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-[14rem] flex-1"><p className="text-sm font-semibold text-violet-300">Up next for you</p><h2 className="text-xl font-extrabold sm:truncate">{pick.title}</h2><p className="text-sm text-slate-400">{xpLeft.toLocaleString()} XP still to earn across the map</p></div>
          <span className="flex items-center gap-1 text-lg font-extrabold text-violet-300"><Zap className="h-5 w-5" />{pick.xp_reward + (pick.bonus_xp || 0)} XP</span>
          <span className="btn-primary"><ArrowRight className="h-4 w-4" />Continue</span>
        </Link>
      ) : quests.length > 0 && <div className="panel p-5 text-center"><h2 className="text-xl font-extrabold">Every path is complete</h2><p className="text-slate-400">You cleared the whole map. New quests will appear here.</p></div>}

      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded-full bg-violet-400 text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>Completed</span>
        <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full border-2 border-violet-400" />Up next</span>
        <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Suggested later (still open)</span>
        <span className="flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-amber-300" />Weekly 2x</span>
        <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-amber-300" />Daily bonus</span>
      </p>

      {paths.map((p) => {
        const a = ACCENT[p.cat];
        const mastered = p.done === p.total;
        return (
          <section key={p.cat} className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className={`text-lg font-bold ${a.text}`}>{CATEGORY[p.cat].label}</h2>
              <span className="text-sm text-slate-400">{p.done} of {p.total} complete</span>
              <div className="ml-auto w-36"><XPBar percent={(p.done / p.total) * 100} /></div>
            </div>
            <div className="flex items-start overflow-x-auto px-3 pb-4 pt-5">
              {p.nodes.map(({ q, state }, i) => (
                <div key={q.id} className="flex items-start">
                  <Node q={q} state={state} accent={a} index={i} />
                  <Link_ lit={q.completed} a={a} />
                </div>
              ))}
              <div className="flex w-24 shrink-0 flex-col items-center">
                <span className={`grid h-16 w-16 place-items-center rounded-full border-2 transition-all duration-500 ${mastered ? 'border-transparent bg-gradient-to-br from-amber-400 to-cyan-400 text-white shadow-[0_0_30px_-4px_rgba(245,158,11,.8)]' : 'border-dashed border-ink-600 text-slate-500'}`}>
                  <Crown className="h-7 w-7" />
                </span>
                <p className={`mt-2 text-center text-xs font-semibold ${mastered ? 'text-fg' : 'text-slate-500'}`}>{mastered ? 'Path mastered' : 'Finish the path'}</p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
