import { ethers } from 'ethers';
import { config } from '../config.js';
import { HttpError } from './errors.js';
import { certKey } from './credential.js';

const ABI = [
  'function issueCertificate(bytes32 certId, address recipient, bytes32 credentialHash)',
  'function revokeCertificate(bytes32 certId)',
  'function getCertificate(bytes32 certId) view returns (tuple(bytes32 credentialHash, address issuer, address recipient, uint64 issuedAt, bool revoked))',
  'function totalIssued() view returns (uint256)',
];

let provider, readC, writeC;
function setup(needWriter) {
  const { rpcUrl, address, issuerKey } = config.chain;
  if (!address) throw new HttpError(503, 'Smart contract not deployed yet. Run "npm run deploy:local" (or set CONTRACT_ADDRESS).');
  provider ||= new ethers.JsonRpcProvider(rpcUrl, config.chain.chainId, { staticNetwork: true });
  readC ||= new ethers.Contract(address, ABI, provider);
  if (needWriter) {
    if (!issuerKey) throw new HttpError(503, 'ISSUER_PRIVATE_KEY is not configured on the server.');
    writeC ||= new ethers.Contract(address, ABI, new ethers.NonceManager(new ethers.Wallet(issuerKey, provider)));
  }
}

const chainDown = (e) => {
  console.error('Blockchain error:', e?.shortMessage || e?.message || e);
  return new HttpError(502, 'Could not reach the blockchain network. Is your Hardhat node (npm run chain) or RPC provider running?');
};

let queue = Promise.resolve(); // serialise transactions from the single issuer wallet
export function issueOnChain(publicId, recipient, credentialHash) {
  const job = queue.then(async () => {
    setup(true);
    try {
      const tx = await writeC.issueCertificate(certKey(publicId), recipient, credentialHash);
      const receipt = await tx.wait();
      return { txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (e) {
      if (e?.revert?.name === 'AccessControlUnauthorizedAccount') throw new HttpError(500, 'Server wallet lacks ISSUER_ROLE on the contract.');
      throw chainDown(e);
    }
  });
  queue = job.catch(() => {});
  return job;
}

export async function revokeOnChain(publicId) {
  setup(true);
  try {
    const tx = await writeC.revokeCertificate(certKey(publicId));
    await tx.wait();
    return tx.hash;
  } catch (e) { throw chainDown(e); }
}

export async function getOnChain(publicId) {
  setup(false);
  try {
    const c = await readC.getCertificate(certKey(publicId));
    if (c.issuedAt === 0n) return null;
    return { credentialHash: c.credentialHash, issuer: c.issuer, recipient: c.recipient, issuedAt: Number(c.issuedAt), revoked: c.revoked };
  } catch (e) { throw chainDown(e); }
}

export const chainInfo = () => ({
  network: config.chain.network, chainId: config.chain.chainId, contract: config.chain.address,
  explorerTx: config.chain.explorerTx, explorerAddress: config.chain.explorerAddress,
});
export const txUrl = (hash) => (config.chain.explorerTx && hash ? config.chain.explorerTx + hash : null);
