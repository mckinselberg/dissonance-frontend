import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * Theme system for SignalNet
 * dk:design Synod aesthetic: Dark surveillance state palette
 */

export type ThemeMode = 'dark' | 'light' | 'synod';

export interface Theme {
  mode: ThemeMode;
  colors: {
    // Primary palette
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    
    // Semantic colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Borders
    border: string;
    borderHover: string;
    
    // Synod-specific (surveillance aesthetic)
    surveillance: string;
    resistance: string;
    neutral: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    primary: '#3b82f6',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    text: '#f5f5f5',
    textSecondary: '#a3a3a3',
    textMuted: '#525252',
    
    border: '#404040',
    borderHover: '#525252',
    
    surveillance: '#ef4444',
    resistance: '#10b981',
    neutral: '#a3a3a3',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  },
};

const synodTheme: Theme = {
  ...darkTheme,
  mode: 'synod',
  colors: {
    ...darkTheme.colors,
    // Synod scale colors (oppressive palette)
    background: '#050505',
    surface: '#0f0f0f',
    primary: '#dc2626', // Red (regime)
    secondary: '#7c2d12', // Dark red
    accent: '#991b1b',
    
    surveillance: '#dc2626',
    resistance: '#14532d', // Dark green (hidden)
    neutral: '#52525b',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultMode = 'dark' 
}) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Load from localStorage
    const stored = localStorage.getItem('signalnet:theme');
    return (stored as ThemeMode) || defaultMode;
  });

  const theme = mode === 'synod' ? synodTheme : darkTheme;

  useEffect(() => {
    // Persist to localStorage
    localStorage.setItem('signalnet:theme', mode);
    
    // Apply theme class to document
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => {
      if (prev === 'dark') return 'synod';
      return 'dark';
    });
  };

  const value = {
    theme,
    setTheme: setMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 * @example
 * const { theme, setTheme, toggleTheme } = useTheme();
 * <div style={{ backgroundColor: theme.colors.background }}>...</div>
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export theme objects for direct use (without context)
export { darkTheme, synodTheme };
