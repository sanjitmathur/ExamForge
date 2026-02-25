import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';

    const applyTheme = () => {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      setTheme(next);
    };

    // View Transitions API: the browser screenshots the old state and crossfades
    // to the new one — guaranteed smooth regardless of CSS variable changes.
    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(applyTheme);
    } else {
      // Fallback for browsers without View Transitions
      const root = document.documentElement;
      root.classList.add('theme-transitioning');
      void root.offsetHeight;
      applyTheme();
      setTimeout(() => root.classList.remove('theme-transitioning'), 700);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
