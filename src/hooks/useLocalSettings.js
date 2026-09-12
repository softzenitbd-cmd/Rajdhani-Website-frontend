import { useCallback, useEffect, useState } from 'react';

const KEY = 'rajdhane_local_settings';
const EVENT = 'localSettingsChanged';

export const readLocalSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

export const getSetting = (name, fallback) => {
  const s = readLocalSettings();
  return s[name] === undefined ? fallback : s[name];
};

/**
 * Small persisted key/value store for UI preferences that the backend does not
 * provide an endpoint for (invoice toggles, menu size, shortcut pins ...).
 */
export const useLocalSettings = () => {
  const [settings, setSettings] = useState(readLocalSettings);

  useEffect(() => {
    const sync = () => setSettings(readLocalSettings());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setSetting = useCallback((name, value) => {
    const next = { ...readLocalSettings(), [name]: value };
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { settings, setSetting };
};

export default useLocalSettings;
