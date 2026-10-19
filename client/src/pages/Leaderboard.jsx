import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Swords, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Empty, Skeleton } from '../components/ui';
import { initials } from '../lib/utils';

export default function Leaderboard() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState('weekly');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () => api(`/api/leaderboard?period=${period}`).then((d) => alive && setRows(d.entries)).catch((e) => alive && setError(e.message));
    setRows(null); load();
    const t = setInterval(load, 15000); // refreshes on its own, so new completions show up
    return () => { alive = false; clearInterval(t); };
  }, [period]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-extrabold">Leaderboard</h1><p className="mt-1 text-slate-400">Top students by XP. Updates live as quests are completed.</p></div>
        <div className="flex rounded-lg border border-ink-600 p-1" role="tablist">{[['weekly', 'This week'], ['all', 'All time']].map(([k, l]) => <button key={k} role="tab" aria-selected={period === k} onClick={() => setPeriod(k)} className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${period === k ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>{l}</button>)}</div></div>
      {error && <p className="text-red-300">{error}</p>}
      {!rows && !error && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
      {rows?.length === 0 && <Empty icon={Trophy} title={period === 'weekly' ? 'Nobody has earned XP this week' : 'No students on the board yet'}>Complete a quest to claim the top spot.</Empty>}
      <ol className="space-y-2">
        {rows?.map((r) => (
          <li key={r.user_id} className={`panel flex items-center gap-4 px-4 py-3 ${r.username === profile?.username ? 'border-cyan-400/50' : ''}`}>
            <span className={`w-8 text-center font-display text-xl font-extrabold ${r.rank === 1 ? 'text-amber-300' : r.rank === 2 ? 'text-slate-300' : r.rank === 3 ? 'text-orange-300' : 'text-slate-500'}`}>{r.rank}</span>
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white">{r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(r)}</div>
            <div className="min-w-0 flex-1"><Link to={`/u/${r.username}`} className="block truncate font-semibold text-fg hover:text-cyan-300">{r.full_name || r.username}</Link><p className="text-xs text-slate-500">Level {r.level}</p></div>
            <span className="hidden items-center gap-1 text-sm text-slate-400 sm:flex" title="Quests completed"><Swords className="h-4 w-4" />{r.quests_completed}</span>
            <span className="hidden items-center gap-1 text-sm text-slate-400 sm:flex" title="Badges earned"><Award className="h-4 w-4" />{r.badges_count}</span>
            <span className="w-24 text-right font-display text-lg font-extrabold text-violet-300">{r.xp.toLocaleString()} <span className="text-xs font-medium text-slate-500">XP</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}
