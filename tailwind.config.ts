import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'float':          'float 5s ease-in-out infinite',
        'float-slow':     'float 8s ease-in-out infinite',
        'glow-pulse':     'glow-pulse 2s ease-in-out infinite',
        'ring-expand':    'ring-expand 1.5s ease-out infinite',
        'shimmer':        'shimmer 1.8s ease infinite',
        'slide-up':       'slide-up-fade 0.5s ease forwards',
        'scale-in':       'scale-in-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'fade-in':        'fade-in 0.6s ease forwards',
        'orb-1':          'orb-drift-1 18s ease-in-out infinite',
        'orb-2':          'orb-drift-2 22s ease-in-out infinite',
        'orb-3':          'orb-drift-3 15s ease-in-out infinite',
        'scan':           'scan-line 3s ease-in-out infinite',
        'film-flicker':   'film-flicker 8s steps(1) infinite',
        'progress-shine': 'progress-shine 2s linear infinite',
        'spin-slow':      'spin 3s linear infinite',
      },
      backgroundSize: {
        '300%': '300% 100%',
        '200%': '200% 100%',
      },
    },
  },
  plugins: [],
};

export default config;
