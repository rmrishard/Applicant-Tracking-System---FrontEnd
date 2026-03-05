import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d9488', // Teal 600
      light: '#5eead4', // Teal 300
      dark: '#0f766e', // Teal 700
      lighter: '#ccfbf1', // Teal 100
    },
    secondary: {
      main: '#6366f1', // Indigo 500
      light: '#818cf8', // Indigo 400
      dark: '#4f46e5', // Indigo 600
      lighter: '#e0e7ff', // Indigo 100
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
      lighter: '#e0f2fe',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      lighter: '#d1fae5',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      lighter: '#fef3c7',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      lighter: '#fee2e2',
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
