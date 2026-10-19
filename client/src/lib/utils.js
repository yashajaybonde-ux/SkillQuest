export const CATEGORY = {
  javascript: { label: 'JavaScript', color: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  html_css: { label: 'HTML & CSS', color: 'text-blue-300 border-blue-400/30 bg-blue-400/10' },
  programming: { label: 'Programming', color: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' },
  blockchain: { label: 'Blockchain', color: 'text-violet-300 border-violet-400/30 bg-violet-400/10' },
  web_dev: { label: 'Web development', color: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10' },
};
export const DIFFICULTY = {
  beginner: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  intermediate: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  advanced: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/10',
};
export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
export const initials = (p) => ((p?.full_name || p?.username || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('') || '?').toUpperCase();
export const verifyUrl = (id) => `${window.location.origin}/verify/${id}`;
export const passportUrl = (u) => `${window.location.origin}/u/${u}`;
export const timeLeft = (iso) => { const ms = new Date(iso) - Date.now(); if (ms <= 0) return 'ending now'; const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5); return d > 0 ? `${d}d ${h}h left` : `${h}h left`; };
