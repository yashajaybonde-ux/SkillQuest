// Edit the roles below to match who did what
const TEAM = [
  { name: "Yash Bonde", role: "Frontend developer" },
  { name: "Samyak Ahiwale", role: "Backend developer" },
  { name: "Dipesh Bante", role: "Blockchain developer" },
  { name: "Saad Adhal", role: "UI/UX designer" },
];

const FEATURES = [
  [
    "Gamified quests",
    "JavaScript, HTML/CSS, programming and blockchain challenges, graded securely on the server.",
  ],
  [
    "XP, levels and badges",
    "Students earn XP, level up, and collect badges automatically when they reach milestones.",
  ],
  [
    "Blockchain certificates",
    "Milestone certificates are anchored on an Ethereum-compatible test network, so they cannot be forged or silently changed.",
  ],
  [
    "Public verification",
    "Anyone can scan a certificate QR code or enter its ID to check it against the blockchain.",
  ],
  [
    "Achievement passport",
    "Every student gets a shareable public profile, with full control over what is visible.",
  ],
  [
    "Admin dashboard",
    "Admins manage quests, badges, students and certificates, and monitor verifications.",
  ],
];

const STACK = [
  "React",
  "Vite",
  "Tailwind CSS",
  "Framer Motion",
  "Node.js",
  "Express",
  "Supabase",
  "Solidity",
  "Hardhat",
  "ethers.js",
  "MetaMask",
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-extrabold">About SkillQuest</h1>
      <p className="mt-3 text-slate-400">
        SkillQuest is a gamified learning platform where students complete
        coding quests, earn XP and badges, and collect certificates that anyone
        can verify on the blockchain. It is our final-year Computer Science
        Engineering (Blockchain) project.
      </p>

      <h2 className="mb-3 mt-10 text-xl font-bold">What it does</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map(([title, text]) => (
          <div key={title} className="panel p-5">
            <p className="font-bold text-fg">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">
        How the blockchain is used
      </h2>
      <div className="panel p-5 text-sm text-slate-300">
        <p>
          When a student claims a certificate, only a hash (a unique
          fingerprint) of the credential is stored on the blockchain, along with
          the student's wallet address and the time. Personal details such as
          names stay in the private database. If even one letter of a
          certificate is changed, its hash no longer matches the blockchain
          record, and verification fails.
        </p>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">Built with</h2>
      <div className="flex flex-wrap gap-2">
        {STACK.map((t) => (
          <span
            key={t}
            className="pill border-emerald-300/60 bg-white/60 text-emerald-800"
          >
            {t}
          </span>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">Team</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEAM.map((m) => (
          <div key={m.name} className="panel p-5">
            <p className="text-lg font-bold text-fg">{m.name}</p>
            <p className="text-sm text-cyan-300">{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
