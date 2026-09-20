import type { Config } from 'tailwindcss';

/** Lê o token como canais RGB para que as opacidades do Tailwind (bg-accent/10) funcionem. */
const token = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        raised: token('raised'),
        ink: token('ink'),
        soft: token('ink-soft'),
        line: token('line'),
        accent: token('accent'),
        alert: token('alert'),
        warn: token('warn'),
        fixo: token('c-fixo'),
        variavel: token('c-variavel'),
        fatura: token('c-fatura'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 0 var(--line), 0 6px 20px -18px rgba(12, 32, 28, 0.9)',
      },
    },
  },
  plugins: [],
};

export default config;
