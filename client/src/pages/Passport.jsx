import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, ExternalLink, Share2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/ui';
import { Stamp } from '../components/Stamp';
import { CATEGORY, fmtDate, initials, passportUrl } from '../lib/utils';

export default function Passport() {
  const { username } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { setD(null); setError(''); api(`/api/passports/${username}`).then(setD).catch((e) => setError(e.message)); }, [username]);

  if (error) return <div className="panel mx-auto mt-10 max-w-md p-8 text-center"><h1 className="text-2xl font-extrabold">Passport unavailable</h1><p className="mt-2 text-slate-400">{error}</p></div>;
  if (!d) return <Spinner />;
  const { profile: p } = d;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-br from-ink-700 to-ink-900 p-7 shadow-glow">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 font-display text-3xl font-extrabold text-white">{p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(p)}</div>
          <div className="min-w-0 flex-1"><h1 className="text-3xl font-extrabold">{p.full_name || p.username}</h1><p className="text-cyan-300">@{p.username} · Level {p.level} · {p.xp.toLocaleString()} XP</p>{p.bio && <p className="mt-2 max-w-xl text-slate-300">{p.bio}</p>}</div>
          <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(passportUrl(p.username)).then(() => toast.success('Passport link copied'))}><Share2 className="h-4 w-4" />Share</button>
        </div>
        <p className="mt-5 text-sm text-slate-400">{d.stats.quests_completed} quests completed · member since {fmtDate(p.joined)}</p>
      </div>

      {p.skills?.length > 0 && <section className="mt-6"><h2 className="mb-3 text-xl font-bold">Skills</h2><div className="flex flex-wrap gap-2">{p.skills.map((s) => <span key={s} className="pill border-violet-400/30 bg-violet-400/10 text-violet-200">{s}</span>)}</div></section>}

      {d.badges && <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Stamps</h2>{d.badges.length ? <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">{d.badges.map((b, i) => <div key={b.name} className="flex flex-col items-center gap-2 text-center"><Stamp icon={b.icon} color={b.color} rotate={i % 2 ? 6 : -7} /><span className="text-sm font-semibold text-fg">{b.name}</span><span className="text-xs text-slate-500">{fmtDate(b.awarded_at)}</span></div>)}</div> : <p className="text-slate-500">No badges yet.</p>}</section>}

      {d.certificates && <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Verified certificates</h2>{d.certificates.length ? <div className="grid gap-3 sm:grid-cols-2">{d.certificates.map((c) => <div key={c.public_id} className="panel p-5"><h3 className="flex items-center gap-2 font-bold text-fg"><ShieldCheck className="h-5 w-5 text-emerald-400" />{c.title}</h3><p className="mt-1 text-xs text-slate-500">{c.skills?.join(', ')}</p><p className="mt-2 font-mono text-sm text-cyan-300">{c.public_id}</p><div className="mt-3 flex gap-4 text-sm"><Link className="font-semibold text-cyan-300 hover:underline" to={`/verify/${c.public_id}`}>Verify</Link>{c.tx_url && <a className="inline-flex items-center gap-1 text-slate-400 hover:text-fg" href={c.tx_url} target="_blank" rel="noreferrer">Transaction<ExternalLink className="h-3 w-3" /></a>}</div></div>)}</div> : <p className="text-slate-500">No certificates yet.</p>}</section>}

      {d.milestones && <section className="mt-8"><h2 className="mb-4 text-xl font-bold">Learning milestones</h2>{d.milestones.length ? <ul className="panel divide-y divide-ink-600/40">{d.milestones.map((m, i) => <li key={i} className="flex items-center gap-3 px-5 py-3 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /><span className="flex-1 text-slate-200">{m.title}</span><span className={`pill hidden sm:inline-flex ${CATEGORY[m.category]?.color}`}>{CATEGORY[m.category]?.label}</span><span className="text-slate-500">{fmtDate(m.completed_at)}</span></li>)}</ul> : <p className="text-slate-500">No quests completed yet.</p>}</section>}
    </div>
  );
}
