import { useEffect, useState } from 'react';

const KEY = 'sq-theme';

// Light is the default. The choice is remembered in the browser.
export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch { /* private mode */ }
  }, [dark]);
  const toggle = () => {
    const root = document.documentElement;
    root.classList.add('theme-switching'); // short cross-fade
    setDark((d) => !d);
    setTimeout(() => root.classList.remove('theme-switching'), 500);
  };
  return { dark, toggle };
}
