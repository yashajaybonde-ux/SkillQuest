import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import './index.css';

// Soft green spotlight that follows the cursor across glass panels
document.addEventListener('pointermove', (e) => {
  const el = e.target.closest?.('.panel');
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ThemeToggle />
          <Toaster position="top-right" toastOptions={{ style: { background: 'rgb(var(--ink-900) / .88)', backdropFilter: 'blur(12px)', color: 'rgb(var(--fg))', border: '1px solid rgb(var(--ink-600))', boxShadow: '0 10px 30px -12px rgba(16,185,129,.4)' } }} />
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
);
