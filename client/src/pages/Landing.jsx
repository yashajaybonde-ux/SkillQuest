import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Award, ScrollText, ShieldCheck, Database, Lock } from 'lucide-react';
import { Stamp, StampIn } from '../components/Stamp';

function PassportPreview() {
  const stamps = [['flag', 'cyan', -8], ['code', 'amber', 6], ['link', 'violet', -4], ['box', 'violet', 9]];
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative mx-auto w-full max-w-md rotate-2 rounded-3xl border border-violet-400/30 bg-gradient-to-br from-ink-700 to-ink-900 p-7 shadow-glow">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-400">Achievement passport</p><p className="font-display text-2xl font-extrabold text-fg">Aanya Mehta</p><p className="text-sm text-cyan-300">Level 4 · 960 XP</p></div>
        <img src="/favicon.svg" alt="" className="h-10 w-10" />
      </div>
      <div className="my-6 grid grid-cols-4 gap-3 rounded-2xl border border-dashed border-ink-500 bg-ink-950/50 p-4">
        {stamps.map(([i, c, r], n) => <StampIn key={i} delay={0.7 + n * 0.45}><Stamp icon={i} color={c} rotate={r} size={58} /></StampIn>)}
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300"><ShieldCheck className="h-4 w-4" />Certificate SQ-7F3A-92C1-0B4E verified on-chain</div>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <>
      <section className="grid items-center gap-12 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">Prove what you can do. Permanently.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-400">Complete coding quests, earn XP and badges, and collect certificates that anyone can check against the blockchain. No middleman, no screenshots to forge.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/register" className="btn-primary px-6 py-3">Start your first quest</Link><Link to="/verify" className="btn-ghost px-6 py-3">Verify a certificate</Link></div>
          <p className="mt-4 text-sm text-slate-500">Free. Runs on a test network, so no real crypto is ever needed.</p>
        </div>
        <PassportPreview />
      </section>

      <section className="py-14">
        <h2 className="text-3xl font-extrabold">From first line of code to verified credential</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[[Code2, 'Complete quests', 'JavaScript, HTML and CSS, programming and blockchain challenges graded on the server.'], [Award, 'Earn XP and badges', 'Level up and fill your passport with stamps as you hit milestones.'], [ScrollText, 'Claim a certificate', 'Link MetaMask and the platform anchors a fingerprint of your credential on-chain.'], [ShieldCheck, 'Anyone can verify', 'Scan the QR code or enter the ID. The blockchain says valid, revoked or unknown.']].map(([Icon, t, d], i) => (
            <div key={t} className="panel p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><span className="grid h-6 w-6 place-items-center rounded-full bg-violet-600/30 text-xs font-bold text-violet-200">{i + 1}</span><Icon className="h-4 w-4 text-cyan-400" /></div><h3 className="mt-3 text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-slate-400">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <h2 className="text-3xl font-extrabold">What goes on the blockchain, and what does not</h2>
        <p className="mt-2 max-w-2xl text-slate-400">Public ledgers are permanent, so your personal details never touch one.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="panel p-6"><h3 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-5 w-5 text-violet-400" />On-chain (public)</h3><ul className="mt-3 space-y-2 text-sm text-slate-300"><li>A hash of the credential, which is a fingerprint, not the content</li><li>Certificate ID (hashed), issuer address, recipient wallet</li><li>Issue time and revoked flag</li></ul></div>
          <div className="panel p-6"><h3 className="flex items-center gap-2 text-lg font-bold"><Database className="h-5 w-5 text-cyan-400" />Off-chain (private database)</h3><ul className="mt-3 space-y-2 text-sm text-slate-300"><li>Your name, email and profile details</li><li>The full credential: achievement, skills, dates</li><li>Quest history, XP and badges, shown publicly only if you choose</li></ul></div>
        </div>
        <p className="mt-4 text-sm text-slate-500">Change a single letter in a credential and its hash no longer matches the one on-chain. That is how tampering is detected.</p>
      </section>
    </>
  );
}
