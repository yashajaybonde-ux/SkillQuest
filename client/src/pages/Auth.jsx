import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Layout';
import { Spinner } from '../components/ui';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/dashboard';
  const [f, setF] = useState({ full_name: '', username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (loading) return <Spinner />;
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (isRegister) {
        if (!/^[a-z0-9_]{3,20}$/.test(f.username)) throw new Error('Username: 3-20 lowercase letters, numbers or underscores.');
        const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name.trim(), username: f.username } } });
        if (error) throw error;
        if (!data.session) setNotice('Account created. Check your email to confirm it, then log in.');
        else { toast.success('Welcome to SkillQuest'); navigate('/dashboard'); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
        navigate(from);
      }
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <form onSubmit={submit} className="panel space-y-4 p-7">
          <h1 className="text-2xl font-extrabold">{isRegister ? 'Create your passport' : 'Welcome back'}</h1>
          {notice ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300">{notice}</p> : (
            <>
              {isRegister && <>
                <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" required maxLength={80} value={f.full_name} onChange={set('full_name')} autoComplete="name" /></div>
                <div><label className="label" htmlFor="u">Username</label><input id="u" className="input" required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} placeholder="aanya_dev" autoComplete="username" /><p className="mt-1 text-xs text-slate-500">Your public passport lives at /u/username</p></div>
              </>}
              <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" className="input" required value={f.email} onChange={set('email')} autoComplete="email" /></div>
              <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" className="input" required minLength={8} value={f.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} />{isRegister && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}</div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
            </>
          )}
          <p className="text-center text-sm text-slate-400">{isRegister ? 'Already have an account?' : 'New to SkillQuest?'} <Link className="font-semibold text-cyan-300 hover:underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
        </form>
      </div>
    </div>
  );
}
