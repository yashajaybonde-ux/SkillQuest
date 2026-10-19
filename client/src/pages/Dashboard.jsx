import { Link } from 'react-router-dom';
import { Zap, Swords, Award, ScrollText, Flame, ArrowRight, Crown, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Stat, XPBar, Skeleton, Empty } from '../components/ui';
import { Stamp } from '../components/Stamp';
import { CATEGORY, fmtDate, timeLeft } from '../lib/utils';

export default function Dashboard() {
  const { me } = useAuth();
  if (!me) return <div className="space-y-4"><Skeleton className="h-28" /><div className="grid gap-4 sm:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div></div>;
  const { profile, level, progress, daily, weekly, recent, xpWeek, recentBadges } = me;
  const pct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <>
      <PageHeader title={`Hey ${profile.full_name?.split(' ')[0] || profile.username}`} right={<Link to="/quests" className="btn-primary">Browse quests <ArrowRight className="h-4 w-4" /></Link>}>Rank #{me.rank} on the all-time leaderboard.</PageHeader>

      <div className="panel mb-6 p-6">
        <div className="flex items-end justify-between"><div><p className="text-sm text-slate-400">Current level</p><p className="font-display text-4xl font-extrabold text-fg">Level {level.level}</p></div><p className="text-sm text-slate-400">{level.needed - level.current} XP to level {level.level + 1}</p></div>
        <XPBar percent={level.percent} className="mt-4 !h-3.5" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Zap} label="Total XP" value={profile.xp.toLocaleString()} />
        <Stat icon={Swords} label="Quests done" value={`${progress.completed}/${progress.total}`} hint={`${pct}% complete`} />
        <Stat icon={Award} label="Badges" value={me.badgeCount} />
        <Stat icon={ScrollText} label="Certificates" value={me.certificateCount} hint={me.claimable ? `${me.claimable} ready to claim` : undefined} />
      </div>

      {me.claimable > 0 && <Link to="/certificates" className="panel panel-hover mb-6 flex items-center justify-between p-4"><span className="font-semibold text-fg">You have {me.claimable} certificate{me.claimable > 1 ? 's' : ''} ready to claim</span><ArrowRight className="h-4 w-4 text-cyan-300" /></Link>}

      {weekly && (
        <Link to={`/quests/${weekly.slug}`} className="panel panel-hover mb-6 flex flex-wrap items-center gap-4 !border-amber-400/50 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-cyan-400 text-white"><Crown className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-amber-300">Weekly challenge · double XP · {timeLeft(weekly.endsAt)}</p><h2 className="truncate text-xl font-extrabold">{weekly.title}</h2></div>
          {weekly.completed ? <span className="flex items-center gap-1.5 font-semibold text-emerald-300"><CheckCircle2 className="h-5 w-5" />Completed</span> : <span className="flex items-center gap-1 text-lg font-extrabold text-violet-300"><Zap className="h-5 w-5" />+{weekly.xp} XP</span>}
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="panel p-6 lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold">XP this week</h2>
          <div className="h-52"><ResponsiveContainer><AreaChart data={xpWeek}>
            <defs><linearGradient id="xg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.6} /><stop offset="100%" stopColor="#84cc16" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" stroke="#6b8a7b" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#6b8a7b" fontSize={12} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'rgb(var(--ink-900))', border: '1px solid rgb(var(--ink-600))', color: 'rgb(var(--fg))', borderRadius: 8 }} /><Area type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={2.5} fill="url(#xg)" />
          </AreaChart></ResponsiveContainer></div>
        </section>

        <section className="panel p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Flame className="h-5 w-5 text-amber-400" />Daily quests</h2>
          <p className="-mt-2 mb-3 text-xs text-slate-500">50% bonus XP today</p>
          <ul className="space-y-2">{daily.map((q) => <li key={q.id}><Link to={`/quests/${q.slug}`} className="flex items-center justify-between rounded-lg border border-ink-600/50 px-3 py-2.5 text-sm hover:border-violet-500/50"><span className={q.completed ? 'text-slate-500 line-through' : 'text-fg'}>{q.title}</span><span className="text-violet-300">{q.completed ? 'Done' : `+${q.xp}`}</span></Link></li>)}</ul>
        </section>

        <section className="panel p-6 lg:col-span-3">
          <h2 className="mb-4 text-lg font-bold">Learning progress</h2>
          <div className="space-y-4">{Object.entries(progress.byCategory).map(([c, v]) => <div key={c}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-200">{CATEGORY[c]?.label || c}</span><span className="text-slate-500">{v.completed} of {v.total}</span></div><XPBar percent={v.total ? (v.completed / v.total) * 100 : 0} className="!h-2" /></div>)}</div>
        </section>

        <section className="panel p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Latest stamps</h2>
          {recentBadges.length ? <div className="flex flex-wrap gap-4">{recentBadges.map((b, i) => <div key={b.name} className="flex w-20 flex-col items-center gap-1.5 text-center"><Stamp icon={b.icon} color={b.color} size={56} rotate={i % 2 ? 5 : -6} /><span className="text-xs text-slate-300">{b.name}</span></div>)}</div> : <p className="text-sm text-slate-400">Finish a quest to earn your first stamp.</p>}
          {recent.length > 0 && <><h3 className="mb-2 mt-6 text-sm font-semibold text-slate-300">Recent activity</h3><ul className="space-y-1.5 text-sm text-slate-400">{recent.map((r, i) => <li key={i} className="flex justify-between"><span className="truncate">{r.title}</span><span className="shrink-0 pl-2 text-slate-500">+{r.xp} XP · {fmtDate(r.at)}</span></li>)}</ul></>}
        </section>
      </div>
      {progress.completed === 0 && <div className="mt-6"><Empty icon={Swords} title="No quests completed yet" action={<Link to="/quests" className="btn-primary">Start with a beginner quest</Link>}>Your first quest takes about five minutes and earns you your first badge.</Empty></div>}
    </>
  );
}
