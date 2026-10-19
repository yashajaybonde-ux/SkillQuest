import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Crown, Flame, Search, Swords, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORY, DIFFICULTY, timeLeft } from '../lib/utils';
import { PageHeader, Skeleton, Empty } from '../components/ui';

export default function Quests() {
  const [quests, setQuests] = useState(null);
  const [error, setError] = useState('');
  const [endsAt, setEndsAt] = useState(null);
  const [f, setF] = useState({ q: '', category: 'all', difficulty: 'all', status: 'all' });
  useEffect(() => { api('/api/quests').then((d) => { setQuests(d.quests); setEndsAt(d.weeklyEndsAt); }).catch((e) => setError(e.message)); }, []);

  const list = useMemo(() => (quests || []).filter((x) =>
    (f.category === 'all' || x.category === f.category) && (f.difficulty === 'all' || x.difficulty === f.difficulty) &&
    (f.status === 'all' || (f.status === 'done') === x.completed) && (x.title + x.description).toLowerCase().includes(f.q.toLowerCase())), [quests, f]);
  const done = (quests || []).filter((q) => q.completed).length;
  const weekly = (quests || []).find((q) => q.weekly);

  const Chip = ({ k, v, label }) => <button onClick={() => setF({ ...f, [k]: v })} className={`pill cursor-pointer transition ${f[k] === v ? 'border-violet-400 bg-violet-600/30 text-fg' : 'border-ink-600 text-slate-400 hover:text-fg'}`}>{label}</button>;

  return (
    <>
      <PageHeader title="Quests">{quests ? `${done} of ${quests.length} completed. ${quests.length - done} remaining.` : 'Loading quests…'}</PageHeader>
      {weekly && (
        <Link to={`/quests/${weekly.slug}`} className="panel panel-hover mb-6 flex flex-wrap items-center gap-4 !border-amber-400/50 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-cyan-400 text-white"><Crown className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-amber-300">Weekly challenge · double XP · {timeLeft(endsAt)}</p><h2 className="truncate text-xl font-extrabold">{weekly.title}</h2></div>
          {weekly.completed ? <span className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="h-5 w-5" />Completed</span> : <span className="flex items-center gap-1 text-lg font-extrabold text-violet-300"><Zap className="h-5 w-5" />{weekly.xp_reward + weekly.bonus_xp} XP</span>}
        </Link>
      )}
      <div className="mb-6 space-y-3">
        <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input className="input !pl-9" placeholder="Search quests" aria-label="Search quests" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <div className="flex flex-wrap gap-2"><Chip k="category" v="all" label="All topics" />{Object.entries(CATEGORY).map(([k, c]) => <Chip key={k} k="category" v={k} label={c.label} />)}</div>
        <div className="flex flex-wrap gap-2"><Chip k="difficulty" v="all" label="Any level" />{['beginner', 'intermediate', 'advanced'].map((d) => <Chip key={d} k="difficulty" v={d} label={d[0].toUpperCase() + d.slice(1)} />)}<span className="mx-1 w-px bg-ink-600" /><Chip k="status" v="all" label="All" /><Chip k="status" v="todo" label="To do" /><Chip k="status" v="done" label="Completed" /></div>
      </div>
      {error && <p className="panel border-red-500/40 p-4 text-red-300">{error}</p>}
      {!quests && !error && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}
      {quests && list.length === 0 && <Empty icon={Swords} title="No quests match">{quests.length ? 'Try clearing a filter.' : 'No quests exist yet. Run "npm run seed" in the project root to add the demo quests.'}</Empty>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((q) => (
          <Link key={q.id} to={`/quests/${q.slug}`} className={`panel panel-hover flex flex-col p-5 ${q.completed ? 'opacity-70' : ''}`}>
            <div className="flex flex-wrap items-center gap-2"><span className={`pill ${CATEGORY[q.category]?.color}`}>{CATEGORY[q.category]?.label}</span><span className={`pill ${DIFFICULTY[q.difficulty]}`}>{q.difficulty}</span>{q.weekly && !q.completed && <span className="pill border-amber-400/50 bg-amber-400/15 text-amber-300"><Crown className="h-3 w-3" />Weekly 2x</span>}{q.daily && !q.weekly && !q.completed && <span className="pill border-amber-400/40 bg-amber-400/10 text-amber-300"><Flame className="h-3 w-3" />Daily</span>}</div>
            <h3 className="mt-3 text-lg font-bold">{q.title}</h3><p className="mt-1 flex-1 text-sm text-slate-400">{q.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">{q.completed ? <span className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="h-4 w-4" />Completed</span> : <span className="text-slate-500">{q.type === 'quiz' ? 'Quiz' : q.type === 'code' ? 'Code challenge' : 'HTML/CSS mission'}</span>}<span className="flex items-center gap-1 font-semibold text-violet-300"><Zap className="h-4 w-4" />{q.xp_reward + q.bonus_xp} XP</span></div>
          </Link>
        ))}
      </div>
    </>
  );
}
