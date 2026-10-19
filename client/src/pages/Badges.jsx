import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Skeleton, Empty } from '../components/ui';
import { Stamp } from '../components/Stamp';
import { fmtDate } from '../lib/utils';

export default function Badges() {
  const [badges, setBadges] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/me/badges').then((d) => setBadges(d.badges)).catch((e) => setError(e.message)); }, []);
  const earned = badges?.filter((b) => b.earned).length ?? 0;
  return (
    <>
      <PageHeader title="Badges">{badges ? `${earned} of ${badges.length} stamps collected.` : ' '}</PageHeader>
      {error && <p className="text-red-300">{error}</p>}
      {!badges && !error && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}
      {badges?.length === 0 && <Empty icon={Award} title="No badges configured">Run "npm run seed" to add the default badges.</Empty>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges?.map((b, i) => (
          <div key={b.id} className={`panel flex items-center gap-4 p-5 ${b.earned ? '' : 'opacity-60'}`}>
            <Stamp icon={b.icon} color={b.color} earned={b.earned} rotate={i % 2 ? 5 : -6} />
            <div><h3 className="font-bold text-fg">{b.name}</h3><p className="text-sm text-slate-400">{b.description}</p><p className="mt-1 text-xs text-slate-500">{b.earned ? `Earned ${fmtDate(b.awarded_at)}` : 'Not earned yet'}{b.issues_certificate ? ' · includes certificate' : ''}</p></div>
          </div>
        ))}
      </div>
    </>
  );
}
