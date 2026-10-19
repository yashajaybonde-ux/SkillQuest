# SkillQuest: Blockchain Achievement Passport

Gamified learning platform. Students complete coding quests, earn XP and badges, and claim certificates whose fingerprint is stored on an Ethereum-compatible blockchain, so anyone can verify them.

**Stack:** React + Vite + Tailwind + Framer Motion · Node/Express · Supabase (Postgres, Auth, RLS) · Solidity + Hardhat · MetaMask + ethers.js

```
skillquest/
├── client/      React app (deploy to Vercel/Netlify)
├── server/      Express API: grading, XP, badges, certificates (deploy to Render/Railway)
├── contracts/   Solidity contract, tests, deploy script (Hardhat)
└── supabase/    schema.sql (tables, constraints, indexes, RLS)
```

## Requirements
Node.js 18.18+ (20 or 22 recommended), a free Supabase account, and the MetaMask browser extension.

## Local setup (about 15 minutes)

### 1. Install everything
```bash
npm run install:all
```
(Run this in the `skill quest` folder, i.e. the one containing this README.)

### 2. Create the Supabase project
1. Go to supabase.com, create a project.
2. **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
3. **Authentication → Providers → Email**: turn **off** "Confirm email" for a smooth demo (or keep it on and confirm via email).
4. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key.

### 3. Configure environment files
```bash
# macOS/Linux                              # Windows (PowerShell)
cp server/.env.example server/.env         Copy-Item server/.env.example server/.env
cp client/.env.example client/.env         Copy-Item client/.env.example client/.env
```
- `server/.env`: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Leave the local-chain defaults.
- `client/.env`: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

> The `service_role` key is a secret. It lives only in `server/.env` and is never sent to the browser.

### 4. Start the local blockchain and deploy the contract
Terminal A (leave running):
```bash
npm run chain
```
Terminal B:
```bash
npm run deploy:local
npm run seed
```
`deploy:local` writes `contracts/deployments/localhost.json`, which the server reads automatically. `seed` adds 16 quests and 7 badges.

### 5. Run the app
```bash
npm run dev
```
Open http://localhost:5173 (API on http://localhost:4000).

### 6. Make yourself admin
Register in the app, then in Supabase SQL Editor:
```sql
update public.profiles set role = 'admin' where username = 'your_username';
```
Refresh the app; **Admin** appears in the sidebar.

## Demo script
1. Register → complete the *JavaScript fundamentals* quiz and two code quests → watch XP, level-up and badge stamp animations.
2. Earn **JavaScript Beginner** (3 JS quests) → **Certificates** → connect MetaMask (sign a free message) → **Claim**.
3. Download the PDF, scan its QR code → public verification page shows **Valid** with the transaction hash.
4. On the verify page, paste the downloaded credential JSON → *Authentic*. Edit one letter → *Modified*.
5. Admin → Certificates → **Revoke** → verify again → *Revoked*.
6. Leaderboard updates as you complete quests. Share `/u/yourusername` as your public passport.

MetaMask needs no network setup for linking: it only signs a message. The server wallet pays gas on the test chain.

## Running on Sepolia (public test network)
1. Create a **new throwaway** MetaMask account, fund it from a Sepolia faucet. Never use a wallet that holds real funds.
2. Get a Sepolia RPC URL (Alchemy/Infura free tier).
3. `contracts/.env`: copy from `.env.example`, set `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY`.
4. `npm run deploy:sepolia --prefix contracts` and note the contract address.
5. `server/.env`: use the Sepolia block from `.env.example` (RPC URL, chain id 11155111, the throwaway key as `ISSUER_PRIVATE_KEY`, `CONTRACT_ADDRESS`, explorer URLs).

## Deployment
| Part | Service | Settings |
|---|---|---|
| Database/Auth | Supabase | already done |
| API | Render (Web Service) | Root dir `server`, build `npm install`, start `npm start`. Env vars: everything in `server/.env.example`, with `CLIENT_ORIGIN` = your frontend URL and `CONTRACT_ADDRESS` set explicitly. |
| Frontend | Vercel or Netlify | Root dir `client`, build `npm run build`, output `dist`. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` = your Render URL. SPA rewrites are included (`vercel.json`, `public/_redirects`). |

A deployed API cannot reach your laptop's Hardhat node, so **deploy on Sepolia** for a public demo. In Supabase, set **Authentication → URL Configuration → Site URL** to your frontend URL.

## What is on-chain and what is off-chain
| On-chain (public, permanent) | Off-chain (Supabase) |
|---|---|
| keccak256 hash of the credential | Student name, email, profile |
| keccak256 of the public certificate ID | Full credential JSON (achievement, skills, dates, random salt) |
| Issuer address, recipient wallet | Quest history, XP, badges |
| Issue timestamp, revoked flag | Privacy settings |

Verification recomputes the hash of the stored credential and compares it with the chain. If the database record is altered, the page reports **tampered**. If someone submits an edited credential file, it reports **modified**.

## Security notes
- **XP and badges are server-only.** Grading, XP and badge rules run in the API. The `user_progress` primary key `(user_id, quest_id)` prevents duplicate XP, even under racing requests. Browser clients have no INSERT/DELETE rights and can only update harmless profile columns (column-level grants in `schema.sql`), so `xp`, `level`, `role` and `wallet_address` cannot be self-edited.
- **Answer keys** live in `quest_answers`, which has RLS enabled with no policies, so it is unreachable from the browser.
- **Admin routes** check the role in the database on every request. Hiding the sidebar link is only cosmetic.
- **Contract access control:** OpenZeppelin `AccessControl`; only `ISSUER_ROLE` can issue or revoke.
- **Wallet linking** requires a signed message that binds your account ID, wallet and time, so nobody can attach a wallet they do not control.
- Input is validated with zod; the API uses helmet, CORS allow-listing and rate limits (including stricter limits on submissions and verification).
- **Code-challenge sandbox (important):** JavaScript quests run in a separate Node process with an empty environment, a 1s timeout and string-eval disabled. That is adequate for a demo but **not** a hardened sandbox. For real public use, run submissions in an isolated service (Judge0, containers, or `isolated-vm`).
- The Hardhat key in `.env.example` is public knowledge and only valid on your local chain. Never reuse it anywhere real.

## Tests
```bash
npm test                      # contract tests + server tests
npm run test --prefix server  # only server
```
Covers: contract access control, duplicates, tamper detection and revocation; level math; quiz/HTML/code grading; sandbox behaviour (infinite loop, syntax error, no secrets); credential hashing; certificate IDs; daily rotation.

## Troubleshooting
- **"Missing env var …"**: you did not create `server/.env`.
- **"Could not reach the blockchain network"**: `npm run chain` is not running (or the RPC URL is wrong).
- **"Smart contract not deployed yet"**: run `npm run deploy:local` and restart the server.
- **Quests page is empty**: run `npm run seed`.
- **Hardhat node restarted?** Its state resets. Re-run `npm run deploy:local`, restart the server, and note that previously issued local certificates will show "Not found".
- **MetaMask not detected**: install the extension and reload.
