import { createTheme } from '@mui/material/styles';

// Create a sleek dark theme for the dashboard
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9333ea', // Purple
      light: '#a855f7',
      dark: '#7e22ce',
      contrastText: '#fff',
    },
    secondary: {
      main: '#3b82f6', // Blue
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#fff',
    },
    background: {
      default: '#0f0f23', // Very dark blue-black
      paper: '#1a1a2e', // Dark blue-gray
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none', // Don't uppercase buttons
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.2)',
    '0px 4px 8px rgba(0,0,0,0.2)',
    '0px 8px 16px rgba(0,0,0,0.2)',
    '0px 12px 24px rgba(0,0,0,0.3)',
    '0px 16px 32px rgba(0,0,0,0.3)',
    '0px 20px 40px rgba(0,0,0,0.3)',
    '0px 24px 48px rgba(0,0,0,0.4)',
    '0px 28px 56px rgba(0,0,0,0.4)',
    '0px 32px 64px rgba(0,0,0,0.4)',
    ...Array(15).fill('0px 32px 64px rgba(0,0,0,0.4)'),
  ] as any,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a2e',
          border: '1px solid rgba(147, 51, 234, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 24px rgba(147, 51, 234, 0.3)',
            borderColor: 'rgba(147, 51, 234, 0.4)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1a1a2e',
        },
      },
    },
  },
});

