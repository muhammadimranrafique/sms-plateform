import type { Config } from 'tailwindcss';

/** Shared Tailwind theme tokens consumed by apps/web. */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        navy: { 50: '#EFF3F8', 700: '#1A3C5E', 800: '#142F4A', 900: '#0D2035' },
        amber: { 400: '#F4A623', 500: '#E09615' },
        slate: { 50: '#F8FAFC', 100: '#F1F5F9' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};

export default preset;
