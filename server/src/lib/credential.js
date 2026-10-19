import { randomBytes } from 'node:crypto';
import { keccak256, toUtf8Bytes, id as keccakId } from 'ethers';

// Canonical JSON: keys sorted recursively, so the same credential always hashes the same.
export function canonicalJson(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const hashCredential = (credential) => keccak256(toUtf8Bytes(canonicalJson(credential)));
// On-chain key for a human-readable certificate ID.
export const certKey = (publicId) => keccakId(String(publicId).toUpperCase());
export const PUBLIC_ID_RE = /^SQ-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;
export function newPublicId() {
  const h = randomBytes(6).toString('hex').toUpperCase();
  return `SQ-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}
