import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, ExternalLink, FileSearch, SearchX, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/ui';
import { fmtDate, shortAddr } from '../lib/utils';

const STATUS = {
  valid: { icon: BadgeCheck, tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', title: 'Valid certificate', text: 'This certificate is recorded on the blockchain and its details match.' },
  revoked: { icon: ShieldAlert, tone: 'border-amber-400/40 bg-amber-400/10 text-amber-300', title: 'Revoked', text: 'The issuer cancelled this certificate. It is no longer valid.' },
  tampered: { icon: AlertTriangle, tone: 'border-red-400/40 bg-red-400/10 text-red-300', title: 'Details do not match the blockchain', text: 'The stored certificate has been altered since it was issued. Do not trust it.' },
  not_found: { icon: SearchX, tone: 'border-red-400/40 bg-red-400/10 text-red-300', title: 'Not found', text: 'No certificate with this ID exists on the blockchain.' },
};
const Row = ({ k, children }) => <div className="flex flex-col gap-0.5 border-b border-ink-600/40 py-3 sm:flex-row sm:gap-4"><dt className="w-44 shrink-0 text-sm text-slate-500">{k}</dt><dd className="min-w-0 break-all text-sm text-slate-200">{children}</dd></div>;

export default function Verify() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(id || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState('');
  const [check, setCheck] = useState(null);

  useEffect(() => {
    setData(null); setError(''); setCheck(null); setInput(id || '');
    if (!id) return;
    setLoading(true);
    api(`/api/verify/${encodeURIComponent(id)}`).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const runCheck = async () => {
    setCheck(null);
    try { setCheck(await api(`/api/verify/${encodeURIComponent(id)}/check`, { method: 'POST', body: { credential: JSON.parse(file) } })); }
    catch (e) { setCheck({ error: e instanceof SyntaxError ? 'That is not valid JSON.' : e.message }); }
  };
  const s = data && STATUS[data.result];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold">Verify a certificate</h1>
      <p className="mt-1 text-slate-400">Scan the QR code on a certificate, or enter its ID. The answer comes from the blockchain, not from SkillQuest.</p>
      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (input.trim()) navigate(`/verify/${input.trim().toUpperCase()}`); }}>
        <input className="input font-mono" placeholder="SQ-1A2B-3C4D-5E6F" aria-label="Certificate ID" value={input} onChange={(e) => setInput(e.target.value)} /><button className="btn-primary">Verify</button>
      </form>

      {loading && <Spinner label="Checking the blockchain" />}
      {error && <p className="panel mt-6 border-red-500/40 p-4 text-red-300" role="alert">{error}</p>}
      {data && (
        <div className="mt-6 space-y-6">
          <div className={`flex items-start gap-4 rounded-2xl border p-5 ${s.tone}`} role="status"><s.icon className="h-9 w-9 shrink-0" /><div><h2 className="!text-current text-2xl font-extrabold">{s.title}</h2><p className="text-sm opacity-90">{s.text}</p></div></div>
          {data.onChain && (
            <dl className="panel px-5">
              <Row k="Certificate ID"><span className="font-mono">{data.publicId}</span></Row>
              {data.certificate && <><Row k="Achievement">{data.certificate.title}</Row><Row k="Awarded to">{data.certificate.student}</Row><Row k="Skills demonstrated">{data.certificate.skills?.join(', ') || 'n/a'}</Row></>}
              <Row k="Issued">{fmtDate(data.onChain.issuedAtIso)}</Row>
              <Row k="Recipient wallet"><span className="font-mono">{data.onChain.recipient}</span></Row>
              <Row k="Issuer wallet"><span className="font-mono">{shortAddr(data.onChain.issuer)}</span></Row>
              <Row k="Credential hash"><span className="font-mono text-xs">{data.onChain.credentialHash}</span></Row>
              <Row k="Transaction">{data.certificate?.txUrl ? <a className="inline-flex items-center gap-1 font-mono text-cyan-300 hover:underline" href={data.certificate.txUrl} target="_blank" rel="noreferrer">{data.certificate.txHash}<ExternalLink className="h-3 w-3 shrink-0" /></a> : <span className="font-mono">{data.certificate?.txHash || 'n/a'}</span>}</Row>
              <Row k="Network">{data.chain.network} (chain {data.chain.chainId})</Row>
              <Row k="Contract"><span className="font-mono">{data.chain.contract}</span></Row>
            </dl>
          )}
          {data.result !== 'not_found' && (
            <div className="panel p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold"><FileSearch className="h-5 w-5 text-violet-400" />Check a credential file</h3>
              <p className="mt-1 text-sm text-slate-400">Have a downloaded credential file? Paste its contents to confirm it is exactly what was issued. Any edit, even one letter, is detected.</p>
              <textarea className="input mt-3 h-32 font-mono text-xs" aria-label="Credential JSON" placeholder='{"certificateId": "SQ-…", …}' value={file} onChange={(e) => setFile(e.target.value)} />
              <div className="mt-3 flex flex-wrap items-center gap-3"><button className="btn-primary" disabled={!file.trim()} onClick={runCheck}>Check file</button><label className="btn-ghost cursor-pointer">Upload .json<input type="file" accept=".json,application/json" className="sr-only" onChange={async (e) => e.target.files[0] && setFile(await e.target.files[0].text())} /></label></div>
              {check && <p className={`mt-4 rounded-lg border p-3 text-sm ${check.result === 'authentic' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-red-400/40 bg-red-400/10 text-red-300'}`} role="status">{check.error || (check.result === 'authentic' ? 'Authentic: this file matches the hash on the blockchain.' : check.result === 'revoked' ? 'This certificate was revoked.' : 'Modified: this file does not match the blockchain record.')}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
