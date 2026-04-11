import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  safelist: [
    // Column series colors (dynamically referenced in JS config objects)
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-primary-500',
    'bg-blue-50', 'bg-emerald-50', 'bg-violet-50', 'bg-orange-50',
    'text-blue-700', 'text-emerald-700', 'text-violet-700', 'text-orange-700',
    'border-blue-200', 'border-emerald-200', 'border-violet-200', 'border-orange-200',
    'dark:bg-blue-950/30', 'dark:bg-emerald-950/30', 'dark:bg-violet-950/30', 'dark:bg-orange-950/30',
    'dark:text-blue-300', 'dark:text-emerald-300', 'dark:text-violet-300', 'dark:text-orange-300',
    'dark:border-blue-800', 'dark:border-emerald-800', 'dark:border-violet-800', 'dark:border-orange-800',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        accent: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '75ch',
          },
        },
      },
    },
  },
  plugins: [
    typography,
  ],
};
