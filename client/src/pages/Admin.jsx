import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus, Trash2, Pencil, Ban } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Spinner, Stat } from '../components/ui';
import { Users, Swords, ScrollText, ShieldCheck } from 'lucide-react';
import { badgeIcons } from '../components/Stamp';
import { CATEGORY, fmtDate } from '../lib/utils';

const TABS = ['Overview', 'Quests', 'Badges', 'Students', 'Certificates', 'Verifications'];
const COLORS = ['#10b981', '#14b8a6', '#84cc16', '#f59e0b', '#10b981'];
const tip = { contentStyle: { background: 'rgb(var(--ink-900))', border: '1px solid rgb(var(--ink-600))', color: 'rgb(var(--fg))', borderRadius: 8 } };
const J = (v) => JSON.stringify(v, null, 2);

function useLoad(path) {
  const [d, setD] = useState(null);
  const load = useCallback(() => api(path).then(setD).catch((e) => toast.error(e.message)), [path]);
  useEffect(() => { load(); }, [load]);
  return [d, load];
}
const Table = ({ head, children }) => <div className="panel overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-ink-600/50 text-slate-500"><tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-ink-600/30">{children}</tbody></table></div>;
const Td = (p) => <td className="px-4 py-3 align-top" {...p} />;

function Overview() {
  const [d] = useLoad('/api/admin/stats');
  if (!d) return <Spinner />;
  const t = d.totals;
  return (<div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Stat icon={Users} label="Students" value={t.students} /><Stat icon={Swords} label="Active quests" value={t.quests} hint={`${t.passRate}% submission pass rate`} /><Stat icon={ScrollText} label="Certificates issued" value={t.issued} hint={`${t.eligible} awaiting claim · ${t.revoked} revoked`} /><Stat icon={ShieldCheck} label="Verifications" value={t.verifications} /></div>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="panel p-5 lg:col-span-2"><h2 className="mb-3 font-bold">Quest completions, last 14 days</h2><div className="h-56"><ResponsiveContainer><BarChart data={d.activity}><CartesianGrid stroke="rgba(120,160,140,.3)" vertical={false} /><XAxis dataKey="day" stroke="#6b8a7b" fontSize={11} /><YAxis stroke="#6b8a7b" fontSize={11} allowDecimals={false} width={28} /><Tooltip {...tip} /><Bar dataKey="completions" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="panel p-5"><h2 className="mb-3 font-bold">Completions by topic</h2>{d.categories.length ? <div className="h-56"><ResponsiveContainer><PieChart><Pie data={d.categories} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>{d.categories.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div> : <p className="py-16 text-center text-sm text-slate-500">No data yet</p>}</section>
    </div></div>);
}

function Quests() {
  const [d, load] = useLoad('/api/admin/quests');
  const [edit, setEdit] = useState(null);
  const blank = { slug: '', title: '', description: '', instructions: '', category: 'javascript', difficulty: 'beginner', xp_reward: 50, type: 'quiz', is_active: true, challenge: J({ pass_percent: 70, questions: [{ q: 'Question?', options: ['A', 'B', 'C'] }] }), answer_key: J({ answers: [0] }) };
  const open = (q) => setEdit(q ? { ...q, challenge: J(q.challenge), answer_key: J(q.answer_key) } : blank);
  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { ...edit, xp_reward: Number(edit.xp_reward), challenge: JSON.parse(edit.challenge), answer_key: JSON.parse(edit.answer_key) };
      ['id', 'created_at', 'updated_at'].forEach((k) => delete body[k]);
      await api(edit.id ? `/api/admin/quests/${edit.id}` : '/api/admin/quests', { method: edit.id ? 'PUT' : 'POST', body });
      toast.success('Quest saved'); setEdit(null); load();
    } catch (err) { toast.error(err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : err.message); }
  };
  const del = async (q) => { if (!confirm(`Delete "${q.title}"? Student progress for it will be removed.`)) return; try { await api(`/api/admin/quests/${q.id}`, { method: 'DELETE' }); load(); } catch (e) { toast.error(e.message); } };
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  if (!d) return <Spinner />;
  return (<>
    <div className="mb-4 flex justify-end"><button className="btn-primary" onClick={() => open()}><Plus className="h-4 w-4" />New quest</button></div>
    <Table head={['Quest', 'Topic', 'Level', 'Type', 'XP', 'Status', '']}>{d.quests.map((q) => <tr key={q.id}><Td><span className="font-semibold text-fg">{q.title}</span><br /><span className="font-mono text-xs text-slate-500">{q.slug}</span></Td><Td>{CATEGORY[q.category]?.label}</Td><Td>{q.difficulty}</Td><Td>{q.type}</Td><Td>{q.xp_reward}</Td><Td>{q.is_active ? 'Active' : 'Hidden'}</Td><Td><div className="flex gap-2"><button aria-label="Edit" onClick={() => open(q)}><Pencil className="h-4 w-4" /></button><button aria-label="Delete" className="text-red-400" onClick={() => del(q)}><Trash2 className="h-4 w-4" /></button></div></Td></tr>)}</Table>
    {edit && <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/40 backdrop-blur-sm p-4"><form onSubmit={save} className="panel mx-auto my-6 max-w-2xl space-y-3 bg-ink-800 p-6"><h2 className="text-xl font-bold">{edit.id ? 'Edit quest' : 'New quest'}</h2>
      <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Title</label><input className="input" required value={edit.title} onChange={set('title')} /></div><div><label className="label">Slug</label><input className="input font-mono" required value={edit.slug} onChange={set('slug')} /></div>
        <div><label className="label">Topic</label><select className="input" value={edit.category} onChange={set('category')}>{Object.entries(CATEGORY).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}</select></div><div><label className="label">Difficulty</label><select className="input" value={edit.difficulty} onChange={set('difficulty')}>{['beginner', 'intermediate', 'advanced'].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div><label className="label">Type</label><select className="input" value={edit.type} onChange={set('type')}><option value="quiz">quiz</option><option value="code">code</option><option value="html">html</option></select></div><div><label className="label">XP reward</label><input type="number" min={5} max={1000} className="input" value={edit.xp_reward} onChange={set('xp_reward')} /></div></div>
      <div><label className="label">Description</label><input className="input" value={edit.description} onChange={set('description')} /></div><div><label className="label">Instructions</label><textarea className="input h-20" value={edit.instructions} onChange={set('instructions')} /></div>
      <div><label className="label">Challenge JSON (public)</label><textarea className="input h-36 font-mono text-xs" value={edit.challenge} onChange={set('challenge')} spellCheck={false} /><p className="mt-1 text-xs text-slate-500">quiz: pass_percent + questions[ {'{q, options[]}'} ] · code: fn, starter, examples · html: starter</p></div>
      <div><label className="label">Answer key JSON (server only, never sent to students)</label><textarea className="input h-28 font-mono text-xs" value={edit.answer_key} onChange={set('answer_key')} spellCheck={false} /><p className="mt-1 text-xs text-slate-500">quiz: {'{answers:[index,…]}'} · code: {'{tests:[{args,expected,visible}]}'} · html: {'{rules:[{type:"regex"|"contains",value,message}]}'}</p></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-violet-500" checked={edit.is_active} onChange={set('is_active')} />Active (visible to students)</label>
      <div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary">Save quest</button></div></form></div>}
  </>);
}

function Badges() {
  const [d, load] = useLoad('/api/admin/badges');
  const [edit, setEdit] = useState(null);
  const blank = { slug: '', name: '', description: '', icon: 'award', color: 'violet', condition_type: 'quests_completed', condition_value: 1, condition_category: '', condition_slug: '', issues_certificate: false, skills: '' };
  const save = async (e) => {
    e.preventDefault();
    const body = { ...edit, condition_value: Number(edit.condition_value), condition_category: edit.condition_category || null, condition_slug: edit.condition_slug || null, skills: String(edit.skills).split(',').map((s) => s.trim()).filter(Boolean) };
    ['id', 'created_at'].forEach((k) => delete body[k]);
    try { await api(edit.id ? `/api/admin/badges/${edit.id}` : '/api/admin/badges', { method: edit.id ? 'PUT' : 'POST', body }); toast.success('Badge saved'); setEdit(null); load(); } catch (err) { toast.error(err.message); }
  };
  const del = async (b) => { if (confirm(`Delete "${b.name}"? It will be removed from every student.`)) { try { await api(`/api/admin/badges/${b.id}`, { method: 'DELETE' }); load(); } catch (e) { toast.error(e.message); } } };
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  if (!d) return <Spinner />;
  return (<>
    <div className="mb-4 flex justify-end"><button className="btn-primary" onClick={() => setEdit(blank)}><Plus className="h-4 w-4" />New badge</button></div>
    <Table head={['Badge', 'Condition', 'Certificate', '']}>{d.badges.map((b) => <tr key={b.id}><Td><span className="font-semibold text-fg">{b.name}</span><br /><span className="text-xs text-slate-500">{b.description}</span></Td><Td className="px-4 py-3 text-xs">{b.condition_type} {b.condition_category || b.condition_slug || ''} ≥ {b.condition_value}</Td><Td>{b.issues_certificate ? 'Yes' : 'No'}</Td><Td><div className="flex gap-2"><button aria-label="Edit" onClick={() => setEdit({ ...b, skills: b.skills.join(', '), condition_category: b.condition_category || '', condition_slug: b.condition_slug || '' })}><Pencil className="h-4 w-4" /></button><button aria-label="Delete" className="text-red-400" onClick={() => del(b)}><Trash2 className="h-4 w-4" /></button></div></Td></tr>)}</Table>
    {edit && <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/40 backdrop-blur-sm p-4"><form onSubmit={save} className="panel mx-auto my-6 max-w-xl space-y-3 bg-ink-800 p-6"><h2 className="text-xl font-bold">{edit.id ? 'Edit badge' : 'New badge'}</h2>
      <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Name</label><input className="input" required value={edit.name} onChange={set('name')} /></div><div><label className="label">Slug</label><input className="input font-mono" required value={edit.slug} onChange={set('slug')} /></div>
        <div><label className="label">Icon</label><select className="input" value={edit.icon} onChange={set('icon')}>{badgeIcons.map((i) => <option key={i}>{i}</option>)}</select></div><div><label className="label">Colour</label><select className="input" value={edit.color} onChange={set('color')}>{['violet', 'blue', 'cyan', 'amber'].map((i) => <option key={i}>{i}</option>)}</select></div>
        <div><label className="label">Condition</label><select className="input" value={edit.condition_type} onChange={set('condition_type')}>{['quests_completed', 'category_count', 'quest_slug', 'level', 'all_quests'].map((i) => <option key={i}>{i}</option>)}</select></div><div><label className="label">Threshold</label><input type="number" min={1} className="input" value={edit.condition_value} onChange={set('condition_value')} /></div>
        <div><label className="label">Categories (comma separated)</label><input className="input" placeholder="javascript or html_css,web_dev" value={edit.condition_category} onChange={set('condition_category')} /></div><div><label className="label">Quest slug</label><input className="input font-mono" value={edit.condition_slug} onChange={set('condition_slug')} /></div></div>
      <div><label className="label">Description</label><input className="input" value={edit.description} onChange={set('description')} /></div><div><label className="label">Skills on certificate</label><input className="input" value={edit.skills} onChange={set('skills')} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-violet-500" checked={edit.issues_certificate} onChange={set('issues_certificate')} />Earning this badge makes a certificate claimable</label>
      <div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary">Save badge</button></div></form></div>}
  </>);
}

function Students() {
  const [d, load] = useLoad('/api/admin/students');
  const [q, setQ] = useState('');
  const toggle = async (s) => { try { await api(`/api/admin/students/${s.id}`, { method: 'PATCH', body: { role: s.role === 'admin' ? 'student' : 'admin' } }); load(); } catch (e) { toast.error(e.message); } };
  if (!d) return <Spinner />;
  const rows = d.students.filter((s) => (s.username + s.full_name).toLowerCase().includes(q.toLowerCase()));
  return (<><input className="input mb-4 max-w-sm" placeholder="Search students" aria-label="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
    <Table head={['Student', 'Level', 'XP', 'Wallet', 'Joined', 'Role']}>{rows.map((s) => <tr key={s.id}><Td><span className="font-semibold text-fg">{s.full_name || s.username}</span><br /><span className="text-xs text-slate-500">@{s.username}</span></Td><Td>{s.level}</Td><Td>{s.xp}</Td><Td className="px-4 py-3 font-mono text-xs">{s.wallet_address ? `${s.wallet_address.slice(0, 8)}…` : 'none'}</Td><Td>{fmtDate(s.created_at)}</Td><Td><button className="btn-ghost !py-1 !text-xs" onClick={() => toggle(s)}>{s.role === 'admin' ? 'Admin · demote' : 'Student · make admin'}</button></Td></tr>)}</Table></>);
}

function Certificates() {
  const [d, load] = useLoad('/api/admin/certificates');
  const [students] = useLoad('/api/admin/students');
  const [f, setF] = useState({ userId: '', title: '', milestone: '', skills: '' });
  const [busy, setBusy] = useState(false);
  const issue = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api('/api/admin/certificates/issue', { method: 'POST', body: { ...f, skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean) } }); toast.success('Certificate issued on-chain'); setF({ userId: '', title: '', milestone: '', skills: '' }); load(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  const revoke = async (c) => { if (!confirm(`Revoke ${c.public_id}? This is recorded permanently on-chain.`)) return; try { await api(`/api/admin/certificates/${c.id}/revoke`, { method: 'POST' }); toast.success('Revoked'); load(); } catch (e) { toast.error(e.message); } };
  if (!d || !students) return <Spinner />;
  return (<div className="space-y-6">
    <form onSubmit={issue} className="panel grid gap-3 p-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">Issue a certificate manually</h2>
      <div><label className="label">Student (must have a linked wallet)</label><select className="input" required value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}><option value="">Choose…</option>{students.students.filter((s) => s.wallet_address).map((s) => <option key={s.id} value={s.id}>{s.full_name || s.username} (@{s.username})</option>)}</select></div>
      <div><label className="label">Achievement title</label><input className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div><label className="label">Milestone note</label><input className="input" value={f.milestone} onChange={(e) => setF({ ...f, milestone: e.target.value })} /></div><div><label className="label">Skills (comma separated)</label><input className="input" value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} /></div>
      <div className="sm:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? 'Recording on-chain…' : 'Issue certificate'}</button></div></form>
    <Table head={['Certificate', 'Student', 'Status', 'Issued', '']}>{d.certificates.map((c) => <tr key={c.id}><Td><span className="font-semibold text-fg">{c.title}</span><br /><span className="font-mono text-xs text-slate-500">{c.public_id || 'not yet issued'}</span></Td><Td>@{c.profiles?.username}</Td><Td>{c.status}</Td><Td>{fmtDate(c.issued_at)}</Td><Td>{c.status === 'issued' && <button className="btn-danger !py-1 !text-xs" onClick={() => revoke(c)}><Ban className="h-3 w-3" />Revoke</button>}</Td></tr>)}</Table></div>);
}

function Verifications() {
  const [d] = useLoad('/api/admin/verifications');
  const [s] = useLoad('/api/admin/stats');
  if (!d || !s) return <Spinner />;
  return (<div className="space-y-6">
    <div className="flex flex-wrap gap-3">{s.verificationResults.length ? s.verificationResults.map((r) => <span key={r.name} className={`pill ${['valid', 'authentic'].includes(r.name) ? 'border-emerald-400/30 text-emerald-300' : 'border-red-400/30 text-red-300'}`}>{r.name}: {r.value}</span>) : <span className="text-sm text-slate-500">No verifications in the last 14 days.</span>}</div>
    <Table head={['Time', 'Certificate ID', 'Result', 'Source']}>{d.logs.map((l) => <tr key={l.id}><Td>{new Date(l.created_at).toLocaleString()}</Td><Td className="px-4 py-3 font-mono text-xs">{l.public_id}</Td><Td>{l.result}</Td><Td>{l.source}</Td></tr>)}</Table></div>);
}

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const Body = { Overview, Quests, Badges, Students, Certificates, Verifications }[tab];
  return (<>
    <PageHeader title="Admin">Every action here is re-checked against your role on the server.</PageHeader>
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-600/50" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-violet-400 text-fg' : 'border-transparent text-slate-400 hover:text-fg'}`}>{t}</button>)}</div>
    <Body />
  </>);
}
