import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { PageHeader, Toggle, Spinner } from '../components/ui';
import WalletButton from '../components/WalletButton';
import { passportUrl } from '../lib/utils';

export default function Settings() {
  const { profile, refresh, signOut } = useAuth();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (profile) setF({ ...profile, skills: (profile.skills || []).join(', '), avatar_url: profile.avatar_url || '' }); }, [profile]);
  if (!f) return <Spinner />;

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { username, full_name, bio, avatar_url, is_public, show_certificates, show_badges, show_skills, show_progress, show_on_leaderboard } = f;
      const skills = f.skills.split(',').map((s) => s.trim()).filter(Boolean);
      await api('/api/me', { method: 'PATCH', body: { username, full_name, bio: bio || '', avatar_url, skills, is_public, show_certificates, show_badges, show_skills, show_progress, show_on_leaderboard } });
      await refresh(); toast.success('Profile saved');
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const unlink = async () => { try { await api('/api/wallet', { method: 'DELETE' }); await refresh(); toast.success('Wallet unlinked'); } catch (e) { toast.error(e.message); } };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const tog = (k, label, hint) => <Toggle key={k} checked={f[k]} onChange={(v) => setF({ ...f, [k]: v })} label={label} hint={hint} />;

  return (
    <>
      <PageHeader title="Profile and settings" />
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <section className="panel space-y-4 p-6"><h2 className="text-lg font-bold">Profile</h2>
          <div><label className="label" htmlFor="fn">Full name</label><input id="fn" className="input" maxLength={80} value={f.full_name} onChange={set('full_name')} /></div>
          <div><label className="label" htmlFor="un">Username</label><input id="un" className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} /><p className="mt-1 text-xs text-slate-500">{passportUrl(f.username)}</p></div>
          <div><label className="label" htmlFor="av">Avatar image URL</label><input id="av" className="input" placeholder="https://… (optional)" value={f.avatar_url} onChange={set('avatar_url')} /></div>
          <div><label className="label" htmlFor="bio">Bio</label><textarea id="bio" className="input h-24" maxLength={300} value={f.bio || ''} onChange={set('bio')} /></div>
          <div><label className="label" htmlFor="sk">Skills</label><input id="sk" className="input" placeholder="React, Solidity, SQL" value={f.skills} onChange={set('skills')} /><p className="mt-1 text-xs text-slate-500">Separate with commas.</p></div>
        </section>
        <div className="space-y-6">
          <section className="panel p-6"><h2 className="text-lg font-bold">Public passport</h2><p className="text-sm text-slate-400">Choose what visitors to <Link className="text-cyan-300 hover:underline" to={`/u/${profile.username}`}>your passport page</Link> can see.</p>
            <div className="mt-2 divide-y divide-ink-600/40">{tog('is_public', 'Make my passport public', 'When off, your passport page is hidden entirely.')}{tog('show_badges', 'Show badges')}{tog('show_certificates', 'Show verified certificates')}{tog('show_skills', 'Show skills')}{tog('show_progress', 'Show completed milestones')}{tog('show_on_leaderboard', 'Appear on the leaderboard')}</div></section>
          <section className="panel p-6"><h2 className="text-lg font-bold">Blockchain wallet</h2>
            {profile.wallet_address ? <><p className="mt-2 break-all font-mono text-sm text-emerald-300">{profile.wallet_address}</p><p className="mt-1 text-sm text-slate-400">Certificates you claim are issued to this address.</p><button type="button" className="btn-danger mt-4" onClick={unlink}>Unlink wallet</button></> : <><p className="mb-4 mt-1 text-sm text-slate-400">Link MetaMask to receive blockchain certificates. You only sign a message; no funds are ever moved.</p><WalletButton /></>}</section>
        </div>
        <div className="flex gap-3 lg:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button><button type="button" className="btn-ghost" onClick={signOut}>Log out</button></div>
      </form>
    </>
  );
}
