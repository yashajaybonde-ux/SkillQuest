import { useState } from 'react';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { linkWallet } from '../lib/wallet';
import { shortAddr } from '../lib/utils';

export default function WalletButton({ className = '' }) {
  const { profile, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  if (profile?.wallet_address) {
    return <span className={`pill border-emerald-400/30 bg-emerald-400/10 text-emerald-300 ${className}`}><Wallet className="h-3.5 w-3.5" />{shortAddr(profile.wallet_address)}</span>;
  }
  const connect = async () => {
    setBusy(true);
    try { await linkWallet(); await refresh(); toast.success('Wallet linked to your account'); }
    catch (e) { toast.error(e.code === 4001 ? 'You declined the MetaMask request.' : e.message); }
    finally { setBusy(false); }
  };
  return <button onClick={connect} disabled={busy} className={`btn-ghost !py-1.5 ${className}`}><Wallet className="h-4 w-4" />{busy ? 'Waiting for MetaMask…' : 'Connect wallet'}</button>;
}
