import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { supabaseReady } from "./lib/supabase";
import { AppLayout, PublicLayout, Shell } from "./components/Layout";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Quests from "./pages/Quests";
import QuestDetail from "./pages/QuestDetail";
import Badges from "./pages/Badges";
import Certificates from "./pages/Certificates";
import Verify from "./pages/Verify";
import Passport from "./pages/Passport";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import About from "./pages/About";
const Admin = lazy(() => import("./pages/Admin"));

function Private({ children, admin }) {
  const { user, loading, profile } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && profile && profile.role !== "admin")
    return <Navigate to="/dashboard" replace />; // UI convenience only; the API enforces this
  return <AppLayout>{children}</AppLayout>;
}

const NotFound = () => (
  <PublicLayout>
    <div className="py-24 text-center">
      <h1 className="text-5xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-slate-400">That page does not exist.</p>
    </div>
  </PublicLayout>
);

export default function App() {
  if (!supabaseReady) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="panel max-w-lg p-8">
          <h1 className="text-2xl font-extrabold">
            Supabase is not configured
          </h1>
          <p className="mt-3 text-slate-400">
            Copy <code className="text-cyan-300">client/.env.example</code> to{" "}
            <code className="text-cyan-300">client/.env</code>, add your
            Supabase URL and anon key, then restart{" "}
            <code className="text-cyan-300">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route
        path="/dashboard"
        element={
          <Private>
            <Dashboard />
          </Private>
        }
      />
      <Route
        path="/quests"
        element={
          <Private>
            <Quests />
          </Private>
        }
      />
      <Route
        path="/quests/:slug"
        element={
          <Private>
            <QuestDetail />
          </Private>
        }
      />
      <Route
        path="/badges"
        element={
          <Private>
            <Badges />
          </Private>
        }
      />
      <Route
        path="/certificates"
        element={
          <Private>
            <Certificates />
          </Private>
        }
      />
      <Route
        path="/settings"
        element={
          <Private>
            <Settings />
          </Private>
        }
      />
      <Route
        path="/admin"
        element={
          <Private admin>
            <Suspense fallback={<Spinner />}>
              <Admin />
            </Suspense>
          </Private>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <Shell>
            <Leaderboard />
          </Shell>
        }
      />
      <Route
        path="/about"
        element={
          <Shell>
            <About />
          </Shell>
        }
      />
      <Route
        path="/verify"
        element={
          <Shell>
            <Verify />
          </Shell>
        }
      />
      <Route
        path="/verify/:id"
        element={
          <Shell>
            <Verify />
          </Shell>
        }
      />
      <Route
        path="/u/:username"
        element={
          <Shell>
            <Passport />
          </Shell>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
