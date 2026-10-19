import { BrowserProvider, getAddress } from 'ethers';
import { api } from './api';

// Connects MetaMask and proves ownership by signing a message (free, no gas, no crypto needed).
export async function linkWallet() {
  if (!window.ethereum) throw new Error('MetaMask not found. Install it from metamask.io, then reload this page.');
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  const address = getAddress(accounts[0]);
  const { message, issuedAt } = await api('/api/wallet/challenge', { method: 'POST', body: { address } });
  const signature = await (await provider.getSigner()).signMessage(message);
  return api('/api/wallet/link', { method: 'POST', body: { address, issuedAt, signature } });
}
