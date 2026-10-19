// Issues a REAL certificate on the blockchain for a demo user.
// Usage (from the server folder):  node scripts/demo-certificate.js [username] ["Certificate title"]
import { sb } from '../src/supabase.js';
import { issueRow } from '../src/lib/certificates.js';
import { config } from '../src/config.js';

const username = (process.argv[2] || 'demo').toLowerCase();
const title = process.argv[3] || 'Blockchain Learner';

const { data: profile, error } = await sb.from('profiles').select('id, username, full_name, wallet_address').eq('username', username).maybeSingle();
if (error || !profile) { console.error(`No user named "${username}". Create the demo account first (node scripts/create-demo.js).`); process.exit(1); }

if (!profile.wallet_address) {
  if (config.chain.network !== 'localhost') { console.error('That user has no wallet linked. Link MetaMask in the app first.'); process.exit(1); }
  // Local demo only: use Hardhat's test account #1 so a certificate can be issued without MetaMask.
  const demoWallet = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
  const { error: werr } = await sb.from('profiles').update({ wallet_address: demoWallet }).eq('id', profile.id);
  if (werr) { console.error('Could not set a demo wallet:', werr.message); process.exit(1); }
  console.log(`No wallet was linked, so the local test wallet ${demoWallet} was used.`);
}

const { data: row, error: rerr } = await sb.from('certificates').insert({
  user_id: profile.id, title, status: 'issuing',
  milestone: 'Completed the blockchain learning path on SkillQuest.',
  skills: ['Blockchain fundamentals', 'Cryptography', 'Smart contracts'],
}).select().single();
if (rerr) { console.error('Could not create the certificate record:', rerr.message); process.exit(1); }

try {
  const cert = await issueRow(row);
  console.log('\nCertificate issued on the blockchain.');
  console.log(`  Holder:         ${profile.full_name || profile.username}`);
  console.log(`  Title:          ${cert.title}`);
  console.log(`  Certificate ID: ${cert.public_id}`);
  console.log(`  Transaction:    ${cert.tx_hash}`);
  console.log(`\nSee it:    log in as "${profile.username}" and open Certificates (download the PDF there)`);
  console.log(`Verify it: http://localhost:5173/verify/${cert.public_id}\n`);
} catch (e) {
  await sb.from('certificates').delete().eq('id', row.id);
  console.error('\nFailed:', e.message);
  process.exit(1);
}
process.exit(0);
