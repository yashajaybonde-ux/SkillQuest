// LOCAL DEMO ONLY. The Hardhat chain forgets everything when it restarts, so certificates you already issued
// show "Not found". This re-records each stored certificate (same ID, same credential hash) on the fresh chain,
// so existing PDFs and QR codes verify again. Run it after: npm run chain, npm run deploy:local, restart the server.
// Usage (from the server folder):  node scripts/restore-chain.js
import { sb } from '../src/supabase.js';
import { config } from '../src/config.js';
import { getOnChain, issueOnChain, revokeOnChain } from '../src/lib/chain.js';

if (config.chain.network !== 'localhost') {
  console.error(`Refusing to run on "${config.chain.network}". This script is only for the local Hardhat chain.`);
  process.exit(1);
}

const { data: certs, error } = await sb.from('certificates').select('id, public_id, credential_hash, recipient_wallet, status').in('status', ['issued', 'revoked']);
if (error) { console.error('Could not read certificates:', error.message); process.exit(1); }

let restored = 0, alreadyThere = 0, skipped = 0;
try {
  for (const c of certs) {
    if (!c.public_id || !c.credential_hash || !c.recipient_wallet) { skipped++; continue; }
    if (await getOnChain(c.public_id)) { alreadyThere++; continue; }
    const { txHash, blockNumber } = await issueOnChain(c.public_id, c.recipient_wallet, c.credential_hash);
    if (c.status === 'revoked') await revokeOnChain(c.public_id);
    await sb.from('certificates').update({ tx_hash: txHash, block_number: blockNumber, chain_id: config.chain.chainId }).eq('id', c.id);
    console.log(`  restored ${c.public_id}${c.status === 'revoked' ? ' (kept revoked)' : ''}`);
    restored++;
  }
} catch (e) {
  console.error('\nStopped:', e.message);
  process.exit(1);
}
console.log(`\nDone. ${restored} restored, ${alreadyThere} already on the chain, ${skipped} skipped.\n`);
process.exit(0);
