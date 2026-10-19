import { ethers } from 'ethers';
import { sb } from '../supabase.js';
import { config } from '../config.js';
import { HttpError, must } from './errors.js';
import { hashCredential, newPublicId } from './credential.js';
import { issueOnChain } from './chain.js';

// Issues a certificate on-chain for a student. `row` is an existing 'issuing' certificate row.
// The off-chain credential (with the student's name) goes to Supabase; only its hash goes on-chain.
export async function issueRow(row) {
  const profile = must(await sb.from('profiles').select('id, full_name, username, wallet_address').eq('id', row.user_id).single());
  if (!profile.wallet_address) throw new HttpError(400, 'Link a MetaMask wallet before claiming a certificate.');

  const publicId = newPublicId();
  const issuedAt = new Date().toISOString();
  const credential = {
    certificateId: publicId,
    student: profile.full_name || profile.username,
    achievement: row.title,
    milestone: row.milestone,
    skills: row.skills,
    recipientWallet: ethers.getAddress(profile.wallet_address),
    issuer: 'SkillQuest',
    issuedAt,
    salt: ethers.hexlify(ethers.randomBytes(16)), // stops anyone guessing the hash from a known name
  };
  const credentialHash = hashCredential(credential);

  try {
    const { txHash, blockNumber } = await issueOnChain(publicId, profile.wallet_address, credentialHash);
    return must(await sb.from('certificates').update({
      status: 'issued', public_id: publicId, credential, credential_hash: credentialHash, tx_hash: txHash,
      block_number: blockNumber, chain_id: config.chain.chainId, recipient_wallet: profile.wallet_address, issued_at: issuedAt,
    }).eq('id', row.id).select().single());
  } catch (e) {
    // Put it back so the student can retry (admin-created rows have no badge: mark eligible too).
    await sb.from('certificates').update({ status: 'eligible' }).eq('id', row.id).eq('status', 'issuing');
    throw e;
  }
}

// Atomically move eligible -> issuing so a double click can never issue twice.
export async function claimEligible(certId, userId) {
  const { data } = await sb.from('certificates').update({ status: 'issuing' })
    .eq('id', certId).eq('user_id', userId).eq('status', 'eligible').select().maybeSingle();
  if (!data) throw new HttpError(409, 'This certificate is not available to claim.');
  return issueRow(data);
}
