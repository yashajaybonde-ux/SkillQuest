import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Crown, Flame, Play, XCircle, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORY, DIFFICULTY } from '../lib/utils';
import { Spinner } from '../components/ui';
import CompletionModal from '../components/CompletionModal';

const tabKey = (e, value, set) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const el = e.target, s = el.selectionStart;
  set(value.slice(0, s) + '  ' + value.slice(el.selectionEnd));
  requestAnimationFrame(() => (el.selectionStart = el.selectionEnd = s + 2));
};

export default function QuestDetail() {
  const { slug } = useParams();
  const { refresh } = useAuth();
  const [quest, setQuest] = useState(null);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [celebrate, setCelebrate] = useState(null);

  useEffect(() => {
    api(`/api/quests/${slug}`).then(({ quest }) => {
      setQuest(quest);
      setAnswer(quest.type === 'quiz' ? Array(quest.challenge.questions.length).fill(null) : quest.challenge.starter || '');
    }).catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="panel p-8 text-center"><p className="text-red-300">{error}</p><Link to="/quests" className="btn-ghost mt-4">Back to quests</Link></div>;
  if (!quest) return <Spinner />;

  const submit = async () => {
    setBusy(true); setResult(null);
    try {
      const r = await api(`/api/quests/${slug}/submit`, { method: 'POST', body: { answer } });
      setResult(r);
      if (r.passed) { setCelebrate(r); setQuest({ ...quest, completed: true }); refresh(); } else toast.error('Not quite yet. Check the feedback below.');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const ready = quest.type === 'quiz' ? answer.every((a) => a !== null) : String(answer).trim().length > 0;

  return (
    <>
      <Link to="/quests" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-fg"><ArrowLeft className="h-4 w-4" />All quests</Link>
      <div className="panel mb-6 p-6">
        <div className="flex flex-wrap items-center gap-2"><span className={`pill ${CATEGORY[quest.category]?.color}`}>{CATEGORY[quest.category]?.label}</span><span className={`pill ${DIFFICULTY[quest.difficulty]}`}>{quest.difficulty}</span>{quest.weekly ? <span className="pill border-amber-400/50 bg-amber-400/15 text-amber-300"><Crown className="h-3 w-3" />Weekly challenge · double XP</span> : quest.daily && <span className="pill border-amber-400/40 bg-amber-400/10 text-amber-300"><Flame className="h-3 w-3" />Daily +50% XP</span>}<span className="ml-auto flex items-center gap-1 font-semibold text-violet-300"><Zap className="h-4 w-4" />{quest.xp_reward + quest.bonus_xp} XP</span></div>
        <h1 className="mt-3 text-3xl font-extrabold">{quest.title}</h1>
        <p className="mt-2 text-slate-400">{quest.description}</p>
        <p className="mt-4 whitespace-pre-line rounded-lg border border-ink-600/50 bg-ink-900/60 p-4 text-sm text-slate-200">{quest.instructions}</p>
        {quest.completed && <p className="mt-4 flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" />You completed this quest. XP can only be earned once.</p>}
      </div>

      {quest.type === 'quiz' && (
        <div className="space-y-5">{quest.challenge.questions.map((q, i) => (
          <fieldset key={i} className="panel p-5"><legend className="px-1 font-semibold text-fg">{i + 1}. {q.q}</legend>
            <div className="mt-3 grid gap-2">{q.options.map((o, j) => <label key={j} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${answer[i] === j ? 'border-violet-400 bg-violet-600/20 text-fg' : 'border-ink-600 hover:border-ink-500'}`}><input type="radio" className="accent-violet-500" name={`q${i}`} checked={answer[i] === j} disabled={quest.completed} onChange={() => setAnswer(answer.map((a, k) => (k === i ? j : a)))} />{o}</label>)}</div>
          </fieldset>))}</div>
      )}

      {quest.type !== 'quiz' && (
        <div className={`grid gap-4 ${quest.type === 'html' ? 'lg:grid-cols-2' : ''}`}>
          <div>
            <label htmlFor="code" className="label">{quest.type === 'code' ? 'Your JavaScript' : 'Your HTML and CSS'}</label>
            <textarea id="code" spellCheck={false} disabled={quest.completed} value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => tabKey(e, answer, setAnswer)} className="input h-80 resize-y font-mono text-[13px] leading-relaxed" />
            {quest.type === 'code' && quest.challenge.examples?.length > 0 && <div className="mt-3 rounded-lg border border-ink-600/50 p-3 text-sm"><p className="mb-1 font-semibold text-slate-200">Examples</p>{quest.challenge.examples.map((x, i) => <p key={i} className="font-mono text-xs text-slate-400">{quest.challenge.fn}({x.input}) → <span className="text-cyan-300">{x.output}</span></p>)}</div>}
          </div>
          {quest.type === 'html' && <div><p className="label">Live preview</p><iframe title="Preview" sandbox="" srcDoc={answer} className="h-80 w-full rounded-lg border border-ink-600 bg-white" /></div>}
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button className="btn-primary px-6" disabled={busy || !ready || quest.completed} onClick={submit}><Play className="h-4 w-4" />{busy ? 'Checking…' : quest.type === 'quiz' ? 'Submit answers' : 'Run and submit'}</button>
        {!ready && !quest.completed && <span className="text-sm text-slate-500">{quest.type === 'quiz' ? 'Answer every question to submit.' : 'Write your solution first.'}</span>}
      </div>

      {result && !result.passed && (
        <div className="panel mt-6 border-red-500/30 p-5" role="alert"><h2 className="flex items-center gap-2 text-lg font-bold text-red-300"><XCircle className="h-5 w-5" />Score: {result.score}%</h2>
          {result.feedback.message && <p className="mt-2 text-sm text-slate-300">{result.feedback.message}</p>}
          {result.feedback.total != null && <p className="mt-2 text-sm text-slate-300">You got {result.feedback.correct} of {result.feedback.total} right. You need 70% to pass.</p>}
          {result.feedback.failed?.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">{result.feedback.failed.map((m) => <li key={m}>{m}</li>)}</ul>}
          {result.feedback.totalTests != null && <><p className="mt-2 text-sm text-slate-300">{result.feedback.passedTests} of {result.feedback.totalTests} tests passed.</p><ul className="mt-2 space-y-1 font-mono text-xs">{result.feedback.visible.map((t, i) => <li key={i} className={t.ok ? 'text-emerald-300' : 'text-red-300'}>{t.ok ? 'pass' : 'fail'} {t.args ? `(${t.args.map((a) => JSON.stringify(a)).join(', ')}) expected ${JSON.stringify(t.expected)}${t.ok ? '' : `, got ${t.got ?? t.error ?? 'nothing'}`}` : '(hidden test)'}</li>)}</ul></>}
        </div>
      )}
      <CompletionModal result={celebrate} onClose={() => setCelebrate(null)} />
    </>
  );
}
