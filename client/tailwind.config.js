/** @type {import('tailwindcss').Config} */
// Green glass theme with light and dark modes. Colours come from CSS variables
// (defined in src/index.css) so the whole app can switch themes by toggling the "dark" class.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fg: v('fg'),
        ink: { 950: v('ink-950'), 900: v('ink-900'), 800: v('ink-800'), 700: v('ink-700'), 600: v('ink-600'), 500: v('ink-500') },
        slate: { 100: v('slate-100'), 200: v('slate-200'), 300: v('slate-300'), 400: v('slate-400'), 500: v('slate-500'), 600: v('slate-600') },
        violet: { 200: v('violet-200'), 300: v('violet-300'), 400: v('violet-400'), 500: v('violet-500'), 600: v('violet-600'), 700: v('violet-700') },
        blue: { 300: v('blue-300'), 400: v('blue-400'), 500: v('blue-500'), 600: v('blue-600') },
        cyan: { 300: v('cyan-300'), 400: v('cyan-400'), 500: v('cyan-500') },
        emerald: { 300: v('emerald-300'), 400: v('emerald-400') },
        amber: { 300: v('amber-300'), 400: v('amber-400') },
        red: { 300: v('red-300'), 400: v('red-400') },
        sky: { 300: v('sky-300'), 400: v('sky-400') },
        fuchsia: { 300: v('fuchsia-300'), 400: v('fuchsia-400') },
        orange: { 300: v('orange-300') },
      },
      fontFamily: { display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'], sans: ['"Hanken Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'], mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] },
      boxShadow: { glow: '0 0 0 1px rgba(16,185,129,.4), 0 16px 48px -16px rgba(16,185,129,.45)' },
    },
  },
  plugins: [],
};
