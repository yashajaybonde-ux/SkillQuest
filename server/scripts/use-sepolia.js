// Points the SERVER at your Sepolia deployment. Copies the values from contracts/.env and
// contracts/deployments/sepolia.json into server/.env. Never prints any key.
// Usage (from the server folder):  node scripts/use-sepolia.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = (p) => path.join(root, p);
const parse = (txt) => Object.fromEntries(txt.split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const fail = (m) => { console.error(`\n${m}\n`); process.exit(1); };

if (!fs.existsSync(file('contracts/.env'))) fail('contracts/.env not found. Finish the Sepolia deployment first.');
if (!fs.existsSync(file('contracts/deployments/sepolia.json'))) fail('contracts/deployments/sepolia.json not found. Run: npm run deploy:sepolia --prefix contracts');
if (!fs.existsSync(file('server/.env'))) fail('server/.env not found. Copy server/.env.example to server/.env first.');

const c = parse(fs.readFileSync(file('contracts/.env'), 'utf8'));
const dep = JSON.parse(fs.readFileSync(file('contracts/deployments/sepolia.json'), 'utf8'));
if (!/^https:\/\/eth-sepolia|sepolia/i.test(c.SEPOLIA_RPC_URL || '')) fail('SEPOLIA_RPC_URL in contracts/.env is empty or is not a Sepolia URL.');
if (!/^0x[0-9a-fA-F]{64}$/.test(c.DEPLOYER_PRIVATE_KEY || '')) fail('DEPLOYER_PRIVATE_KEY in contracts/.env is missing or not 0x + 64 characters.');
if (!/^0x[0-9a-fA-F]{40}$/.test(dep.address || '')) fail('No valid contract address in sepolia.json.');

const updates = {
  CHAIN_NETWORK: 'sepolia', RPC_URL: c.SEPOLIA_RPC_URL, CHAIN_ID: '11155111',
  ISSUER_PRIVATE_KEY: c.DEPLOYER_PRIVATE_KEY, CONTRACT_ADDRESS: dep.address,
  EXPLORER_TX_URL: 'https://sepolia.etherscan.io/tx/', EXPLORER_ADDRESS_URL: 'https://sepolia.etherscan.io/address/',
};
let lines = fs.readFileSync(file('server/.env'), 'utf8').split('\n');
for (const [k, v] of Object.entries(updates)) {
  const i = lines.findIndex((l) => l.startsWith(`${k}=`));
  if (i >= 0) lines[i] = `${k}=${v}`;
  else lines.push(`${k}=${v}`);
}
fs.writeFileSync(file('server/.env'), lines.join('\n').replace(/\n*$/, '\n'));
console.log(`\nserver/.env now points at Sepolia.\n  Contract: ${dep.address}\n  Keys set: ${Object.keys(updates).join(', ')}\n(Secrets were copied but not printed.) Restart the server: npm run dev\n`);
