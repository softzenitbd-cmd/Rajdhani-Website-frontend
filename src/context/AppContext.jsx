import React, { createContext, useReducer, useEffect, useContext } from 'react';

const defaultTheme = {
  '--bg-app': '#f4f7fe',
  '--bg-sidebar': '#ffffff',
  '--sidebar-hover': '#f1f5f9',
  '--text-sidebar': '#64748b',
  '--card-border': '#e2e8f0',
  '--card-header-bg': '#f8fafc',
  '--bg-surface': '#ffffff',
  '--text-main': '#2b3674',
  '--input-bg': '#ffffff',
  '--label-color': '#334155',
  '--input-text': '#1e293b',
  '--table-header-bg': '#718096',
  '--table-header-text': '#ffffff',
  '--table-text': '#334155',
  '--table-border': '#e2e8f0',
  '--success': '#10b981',
  '--danger': '#ef4444',
  '--info': '#0ea5e9',
  '--warning': '#f59e0b',
  '--primary': '#3b82f6',
  '--secondary': '#64748b',
  '--dark': '#1e293b'
};

// Initial state loaded from localStorage or fallback to defaults
const loadInitialState = () => {
  const savedState = localStorage.getItem('rajdhane_app_state');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      let theme = parsed.theme || defaultTheme;
      if (theme['--primary'] === 'var(--primary)' || String(theme['--primary']).includes('var(')) {
        theme = defaultTheme;
      }
      return { theme };
    } catch (e) {
      console.error("Failed to parse saved state", e);
    }
  }
  
  return {
    theme: defaultTheme
  };
};

const initialState = loadInitialState();

export const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_THEME':
      return {
        ...state,
        theme: { ...state.theme, ...action.payload }
      };
    case 'RESET_THEME':
      return {
        ...state,
        theme: defaultTheme
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('rajdhane_app_state', JSON.stringify(state));
  }, [state]);

  // Inject CSS variables into :root
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme) {
      Object.keys(state.theme).forEach(key => {
        root.style.setProperty(key, state.theme[key]);
      });
    }
  }, [state.theme]);

  // Helper actions
  const updateTheme = (themeUpdates) => dispatch({ type: 'UPDATE_THEME', payload: themeUpdates });
  const resetTheme = () => dispatch({ type: 'RESET_THEME' });

  return (
    <AppContext.Provider value={{ 
      state, dispatch, 
      updateTheme, resetTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
