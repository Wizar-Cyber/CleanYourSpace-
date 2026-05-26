export const tokens = {
  colors: {
    navy: {
      dark: '#111E33',
      DEFAULT: '#1B2A4A',
      light: '#243A63',
    },
    gold: {
      dark: '#A07830',
      DEFAULT: '#C9A84C',
      light: '#E0C070',
    },
    semantic: {
      success: '#1E8449',
      successBg: '#E9F7EF',
      error: '#C0392B',
      errorBg: '#FDEDEC',
      warning: '#B7770D',
      warningBg: '#FEF9E7',
      info: '#1A5276',
      infoBg: '#EAF2FF',
    },
    neutral: {
      white: '#FFFFFF',
      offWhite: '#F8F7F4',
      gray100: '#F2F2F2',
      gray300: '#CCCCCC',
      gray500: '#888888',
      gray700: '#444444',
      gray900: '#1A1A1A',
    },
  },
  fonts: {
    display: "'Outfit', sans-serif",
    body: "'Inter', sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    pill: '9999px',
  },
  typography: {
    display: {
      fontSize: '36px',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h1: {
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '22px',
      fontWeight: 700,
    },
    h3: {
      fontSize: '16px',
      fontWeight: 500,
    },
    bodyLarge: {
      fontSize: '13px',
      lineHeight: 1.5,
    },
    body: {
      fontSize: '11px',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '9px',
      fontWeight: 300,
    },
    label: {
      fontSize: '9px',
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
  },
} as const;
