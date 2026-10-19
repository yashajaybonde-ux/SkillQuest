import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-400" role="status"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /> {label}…</div>
);
export const Skeleton = ({ className = 'h-24' }) => <div className={`skeleton rounded-2xl ${className}`} />;

export const Empty = ({ icon: Icon, title, children, action }) => (
  <div className="panel flex flex-col items-center px-6 py-12 text-center">
    {Icon && <div className="mb-4 rounded-full border border-ink-600 bg-ink-900 p-3 text-violet-400"><Icon className="h-6 w-6" /></div>}
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-400">{children}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const PageHeader = ({ title, children, right }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-3xl font-extrabold">{title}</h1>{children && <p className="mt-1 text-slate-400">{children}</p>}</div>
    {right}
  </div>
);

// Animated XP bar: fills from 0 to the value on mount and whenever it changes.
export const XPBar = ({ percent, className = '' }) => (
  <div className={`h-2.5 overflow-hidden rounded-full bg-ink-900 ${className}`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
    <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${Math.max(2, percent)}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
  </div>
);

export const Stat = ({ icon: Icon, label, value, hint }) => (
  <div className="panel p-5">
    <div className="flex items-center gap-2 text-sm text-slate-400"><Icon className="h-4 w-4 text-cyan-400" />{label}</div>
    <div className="mt-2 font-display text-3xl font-extrabold text-fg">{value}</div>
    {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
  </div>
);

export const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
    <span><span className="block text-sm font-medium text-slate-200">{label}</span>{hint && <span className="block text-xs text-slate-500">{hint}</span>}</span>
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-ink-600 transition peer-checked:bg-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
  </label>
);
