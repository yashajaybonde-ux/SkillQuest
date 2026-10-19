import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { Copy, Download, ExternalLink, FileJson, ScrollText, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Skeleton, Empty } from '../components/ui';
import WalletButton from '../components/WalletButton';
import { downloadCertificatePdf, downloadCredentialJson } from '../lib/certificate';
import { fmtDate, verifyUrl } from '../lib/utils';

function Qr({ id }) {
  const [src, setSrc] = useState('');
  useEffect(() => { QRCode.toDataURL(verifyUrl(id), { margin: 1, width: 200 }).then(setSrc); }, [id]);
  return src ? <img src={src} alt={`QR code to verify certificate ${id}`} className="h-24 w-24 rounded-lg bg-white p-1" /> : <div className="h-24 w-24" />;
}

export default function Certificates() {
  const { profile, refresh } = useAuth();
  const [certs, setCerts] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = () => api('/api/me/certificates').then((d) => setCerts(d.certificates)).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const claim = async (id) => {
    setBusy(id);
    try { await api(`/api/certificates/${id}/claim`, { method: 'POST' }); toast.success('Certificate recorded on the blockchain'); await load(); refresh(); }
    catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };
  const copy = (t) => navigator.clipboard.writeText(t).then(() => toast.success('Link copied'));
  const eligible = certs?.filter((c) => c.status === 'eligible' || c.status === 'issuing') || [];
  const issued = certs?.filter((c) => c.status === 'issued' || c.status === 'revoked') || [];

  return (
    <>
      <PageHeader title="Certificates">Milestone certificates are anchored on the blockchain so anyone can verify them.</PageHeader>
      {!certs && <Skeleton className="h-40" />}
      {certs?.length === 0 && <Empty icon={ScrollText} title="No certificates yet" action={<Link to="/quests" className="btn-primary">Go to quests</Link>}>Earn a milestone badge such as JavaScript Beginner or Blockchain Learner and your certificate will appear here.</Empty>}

      {eligible.length > 0 && (
        <section className="mb-8"><h2 className="mb-3 text-lg font-bold">Ready to claim</h2>
          {!profile?.wallet_address && <div className="panel mb-3 flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-slate-300">Link your MetaMask wallet first. It is free: you only sign a message, and the platform pays the transaction fee on the test network.</p><WalletButton /></div>}
          <div className="grid gap-4 md:grid-cols-2">{eligible.map((c) => (
            <div key={c.id} className="panel flex items-center justify-between gap-4 p-5"><div><h3 className="font-bold text-fg">{c.title}</h3><p className="text-sm text-slate-400">{c.milestone}</p></div>
              <button className="btn-primary shrink-0" disabled={!profile?.wallet_address || busy === c.id || c.status === 'issuing'} onClick={() => claim(c.id)}>{busy === c.id || c.status === 'issuing' ? 'Recording on-chain…' : 'Claim'}</button></div>))}</div>
        </section>
      )}

      {issued.length > 0 && <section><h2 className="mb-3 text-lg font-bold">Your certificates</h2>
        <div className="grid gap-4 lg:grid-cols-2">{issued.map((c) => (
          <div key={c.id} className="panel p-5">
            <div className="flex gap-4"><Qr id={c.public_id} />
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-bold text-fg">{c.title}</h3>{c.status === 'revoked' ? <span className="pill border-red-400/40 bg-red-400/10 text-red-300">Revoked</span> : <span className="pill border-emerald-400/30 bg-emerald-400/10 text-emerald-300"><ShieldCheck className="h-3 w-3" />On-chain</span>}</div>
                <p className="mt-1 font-mono text-sm text-cyan-300">{c.public_id}</p><p className="text-xs text-slate-500">Issued {fmtDate(c.issued_at)}</p>
                <p className="mt-1 truncate font-mono text-xs text-slate-500" title={c.tx_hash}>Tx {c.tx_hash}</p></div></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-ghost !py-1.5" onClick={() => downloadCertificatePdf(c)}><Download className="h-4 w-4" />PDF</button>
              <button className="btn-ghost !py-1.5" onClick={() => downloadCredentialJson(c)}><FileJson className="h-4 w-4" />Credential file</button>
              <button className="btn-ghost !py-1.5" onClick={() => copy(verifyUrl(c.public_id))}><Copy className="h-4 w-4" />Copy link</button>
              <Link className="btn-ghost !py-1.5" to={`/verify/${c.public_id}`}><ShieldCheck className="h-4 w-4" />Verify</Link>
              {c.tx_url && <a className="btn-ghost !py-1.5" href={c.tx_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Explorer</a>}
            </div>
          </div>))}</div></section>}
    </>
  );
}
