import { useEffect, useState } from 'react';
import { AnimatePresence, motion, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUp } from 'lucide-react';
import { Stamp, StampIn } from './Stamp';

function Counter({ to }) {
  const [v, setV] = useState(0);
  useEffect(() => { const c = animate(0, to, { duration: 1, onUpdate: (x) => setV(Math.round(x)) }); return () => c.stop(); }, [to]);
  return <>{v}</>;
}

export default function CompletionModal({ result, onClose }) {
  if (!result) return null;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 grid place-items-center bg-emerald-950/40 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Quest complete">
        <motion.div className="panel w-full max-w-md p-8 text-center shadow-glow" initial={{ y: 30, scale: 0.95 }} animate={{ y: 0, scale: 1 }}>
          <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
          <h2 className="mt-3 text-3xl font-extrabold">Quest complete</h2>
          <p className="mt-4 font-display text-5xl font-extrabold text-violet-300">+<Counter to={result.xpAwarded} /> XP</p>
          {result.leveledUp && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300"><ArrowUp className="h-4 w-4" />You reached level {result.level}</p>}
          {result.newBadges.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-slate-400">New {result.newBadges.length > 1 ? 'badges' : 'badge'} stamped in your passport</p>
              <div className="flex flex-wrap justify-center gap-5">
                {result.newBadges.map((b, i) => <StampIn key={b.name} delay={0.5 + i * 0.35}><div className="flex w-24 flex-col items-center gap-2"><Stamp icon={b.icon} color={b.color} rotate={i % 2 ? 6 : -8} /><span className="text-xs font-semibold text-fg">{b.name}</span></div></StampIn>)}
              </div>
              {result.newBadges.some((b) => b.issues_certificate) && <Link to="/certificates" className="mt-5 inline-block text-sm font-semibold text-cyan-300 hover:underline">A certificate is ready to claim</Link>}
            </div>
          )}
          <div className="mt-8 flex justify-center gap-3"><Link to="/quests" className="btn-primary" onClick={onClose}>More quests</Link><button className="btn-ghost" onClick={onClose}>Close</button></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
