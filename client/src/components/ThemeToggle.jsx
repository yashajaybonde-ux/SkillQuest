import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

// Floating glass button, bottom-right on every page.
export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="panel fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center !rounded-full text-fg hover:scale-110 active:scale-95"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? 'moon' : 'sun'} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 90, opacity: 0, scale: 0.5 }} transition={{ duration: 0.25 }}>
          {dark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-violet-700" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
