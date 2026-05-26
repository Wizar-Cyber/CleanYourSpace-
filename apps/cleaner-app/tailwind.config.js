/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      'mobile': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          dark: '#111E33',
          DEFAULT: '#1B2A4A',
          light: '#243A63',
          lighter: '#2E4A7A',
        },
        gold: {
          dark: '#A07830',
          DEFAULT: '#C9A84C',
          light: '#E0C070',
          lighter: '#F0DBA0',
        },
        success: {
          DEFAULT: '#1E8449',
          bg: '#E9F7EF',
        },
        error: {
          DEFAULT: '#C0392B',
          bg: '#FDEDEC',
        },
        warning: {
          DEFAULT: '#B7770D',
          bg: '#FEF9E7',
        },
        info: {
          DEFAULT: '#1A5276',
          bg: '#EAF2FF',
        },
        offwhite: '#f8fafc',
        surface: '#FFFFFF',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card': '0 1px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'elevated': '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'modal': '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'pill': '9999px',
      },
    },
  },
  plugins: [],
};
