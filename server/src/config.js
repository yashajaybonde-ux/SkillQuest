import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const need = (k) => {
  const v = process.env[k];
  if (!v) { console.error(`\nMissing env var ${k}. Copy server/.env.example to server/.env and fill it in.\n`); process.exit(1); }
  return v;
};

const network = process.env.CHAIN_NETWORK || 'localhost';
let deployed = {};
try {
  deployed = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'contracts', 'deployments', `${network}.json`), 'utf8'));
} catch { /* not deployed yet or running without the contracts folder */ }

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  supabaseUrl: need('SUPABASE_URL'),
  serviceKey: need('SUPABASE_SERVICE_ROLE_KEY'),
  chain: {
    network,
    rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
    issuerKey: process.env.ISSUER_PRIVATE_KEY || '',
    address: process.env.CONTRACT_ADDRESS || deployed.address || '',
    chainId: Number(process.env.CHAIN_ID || deployed.chainId || 31337),
    explorerTx: process.env.EXPLORER_TX_URL || '',
    explorerAddress: process.env.EXPLORER_ADDRESS_URL || '',
  },
};
