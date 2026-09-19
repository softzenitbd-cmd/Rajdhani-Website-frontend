import React, { createContext, useReducer, useEffect, useContext, useCallback } from 'react';
import { appSettingsService } from '../services/appSettingsService';

export const defaultTheme = {
  '--main-font': "'Inter', sans-serif",
  '--main-font-size': '13px',
  '--sidebar-font-size': '14px',
  '--sidebar-submenu-font-size': '13px',
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

// Only keep known CSS variables with real colour values
const sanitiseTheme = (theme) => {
  const out = { ...defaultTheme };
  if (!theme || typeof theme !== 'object') return out;
  Object.keys(defaultTheme).forEach((k) => {
    const v = theme[k];
    if (typeof v === 'string' && v && !v.includes('var(')) out[k] = v;
  });
  return out;
};

export const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: sanitiseTheme(action.payload) };
    case 'UPDATE_THEME':
      return { ...state, theme: { ...state.theme, ...action.payload } };
    case 'RESET_THEME':
      return { ...state, theme: defaultTheme };
    default:
      return state;
  }
};

/**
 * Theme colours are saved on the server under the `theme` key of the general
 * settings (/api/erpsetting/general-settings/) so every device shows the same look.
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, { theme: defaultTheme });

  // Load the theme from the server (only when logged in) and follow later changes
  useEffect(() => {
    const sync = () => {
      const theme = appSettingsService.get('theme');
      if (theme) dispatch({ type: 'SET_THEME', payload: theme });
    };
    window.addEventListener(appSettingsService.EVENT, sync);
    if (localStorage.getItem('token')) appSettingsService.load().then(sync);
    return () => window.removeEventListener(appSettingsService.EVENT, sync);
  }, []);

  // Inject CSS variables into :root
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme) {
      Object.keys(state.theme).forEach(key => {
        root.style.setProperty(key, state.theme[key]);
      });

      // Compute font scaling based on --main-font-size
      let baseSize = 13;
      let targetSize = 13;
      const sizeStr = state.theme['--main-font-size'] || '13px';
      const match = sizeStr.match(/(\d+)px/);
      if (match) {
        targetSize = parseInt(match[1], 10);
      }
      const scale = targetSize / baseSize;

      // Generate scaled sizes for standard pixel values
      [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40].forEach(size => {
        const newSize = Math.round(size * scale);
        root.style.setProperty(`--fs-${size}`, `${newSize}px`);
      });
    }
  }, [state.theme]);

  // Helper actions – the server copy is updated together with the local state
  const updateTheme = useCallback((themeUpdates) => {
    dispatch({ type: 'UPDATE_THEME', payload: themeUpdates });
    const next = sanitiseTheme({ ...(appSettingsService.get('theme') || state.theme), ...themeUpdates });
    return appSettingsService.set('theme', next);
  }, [state.theme]);

  const resetTheme = useCallback(() => {
    dispatch({ type: 'RESET_THEME' });
    return appSettingsService.set('theme', defaultTheme);
  }, []);

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
