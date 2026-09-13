import { useCallback, useEffect, useState } from 'react';
import { appSettingsService } from '../services/appSettingsService';
import { useToast } from '../context/ToastContext';

/**
 * React binding for the server side key/value settings
 * (/api/erpsetting/general-settings/). Every component that uses this hook
 * re-renders when any setting changes, so the header, print header and theme
 * stay in sync with the Settings screens.
 */
export const useAppSettings = () => {
  const toast = useToast();
  const [settings, setSettings] = useState(() => appSettingsService.getCached() || {});
  const [loading, setLoading] = useState(!appSettingsService.getCached());

  useEffect(() => {
    const sync = () => setSettings({ ...(appSettingsService.getCached() || {}) });
    window.addEventListener(appSettingsService.EVENT, sync);
    appSettingsService.load().finally(() => {
      sync();
      setLoading(false);
    });
    return () => window.removeEventListener(appSettingsService.EVENT, sync);
  }, []);

  const setSetting = useCallback(
    (name, value) =>
      appSettingsService.set(name, value).catch((err) => {
        toast?.error?.(err?.message || 'Failed to save setting');
      }),
    [toast]
  );

  const updateSettings = useCallback(
    (partial) =>
      appSettingsService.update(partial).catch((err) => {
        toast?.error?.(err?.message || 'Failed to save settings');
        throw err;
      }),
    [toast]
  );

  return { settings, setSetting, updateSettings, loading };
};

export default useAppSettings;
