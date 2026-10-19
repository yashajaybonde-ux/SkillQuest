import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Swords,
  Award,
  ScrollText,
  Trophy,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  BadgeCheck,
  Fingerprint,
  Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import WalletButton from "./WalletButton";
import { initials } from "../lib/utils";
import { XPBar } from "./ui";

export const Logo = ({ to = "/" }) => (
  <Link
    to={to}
    className="flex items-center gap-2.5 font-display text-xl font-extrabold text-fg"
  >
    <img src="/favicon.svg" alt="" className="h-8 w-8" />
    SkillQuest
  </Link>
);

const nav = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/quests", "Quests", Swords],
  ["/badges", "Badges", Award],
  ["/certificates", "Certificates", ScrollText],
  ["/leaderboard", "Leaderboard", Trophy],
  ["/verify", "Verify", BadgeCheck],
  ["/about", "About", Info],
];

function Sidebar({ onNavigate }) {
  const { profile } = useAuth();
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-violet-600/20 text-fg ring-1 ring-violet-500/40" : "text-slate-400 hover:bg-ink-700/60 hover:text-fg"}`;
  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main">
      <div className="mb-6 px-1">
        <Logo to="/dashboard" />
      </div>
      {nav.map(([to, label, Icon]) => (
        <NavLink key={to} to={to} className={link} onClick={onNavigate}>
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </NavLink>
      ))}
      {profile && (
        <NavLink
          to={`/u/${profile.username}`}
          className={link}
          onClick={onNavigate}
        >
          <Fingerprint className="h-[18px] w-[18px]" />
          My passport
        </NavLink>
      )}
      <div className="mt-auto space-y-1">
        {profile?.role === "admin" && (
          <NavLink to="/admin" className={link} onClick={onNavigate}>
            <ShieldCheck className="h-[18px] w-[18px]" />
            Admin
          </NavLink>
        )}
        <NavLink to="/settings" className={link} onClick={onNavigate}>
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </NavLink>
      </div>
    </nav>
  );
}

export function AppLayout({ children }) {
  const { me, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink-600/40 bg-ink-900/80 backdrop-blur lg:block">
        <Sidebar />
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-64 bg-ink-900">
            <button
              className="absolute right-3 top-4 text-slate-400"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-600/40 bg-ink-950/80 px-4 py-3 backdrop-blur sm:px-8">
        <button
          className="lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu />
        </button>
        {me && (
          <div className="hidden min-w-[190px] max-w-xs flex-1 sm:block">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span className="font-semibold text-fg">
                Level {me.level.level}
              </span>
              <span>
                {me.level.current} / {me.level.needed} XP
              </span>
            </div>
            <XPBar percent={me.level.percent} />
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <WalletButton className="hidden sm:inline-flex" />
          {profile && (
            <>
              <Link
                to="/settings"
                className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white"
                aria-label="Your profile"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(profile)
                )}
              </Link>
              <button
                className="text-slate-400 hover:text-fg"
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

export function PublicLayout({ children }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link
            className="hidden rounded-lg px-3 py-2 text-slate-300 hover:text-fg sm:block"
            to="/leaderboard"
          >
            Leaderboard
          </Link>
          <Link
            className="rounded-lg px-3 py-2 text-slate-300 hover:text-fg"
            to="/verify"
          >
            Verify a certificate
          </Link>
          {user ? (
            <Link className="btn-primary" to="/dashboard">
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                className="hidden rounded-lg px-3 py-2 text-slate-300 hover:text-fg sm:block"
                to="/login"
              >
                Log in
              </Link>
              <Link className="btn-primary" to="/register">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}

// Pages that work signed in or out (leaderboard, verify, passports) pick the right chrome.
export function Shell({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? (
    <AppLayout>{children}</AppLayout>
  ) : (
    <PublicLayout>{children}</PublicLayout>
  );
}
