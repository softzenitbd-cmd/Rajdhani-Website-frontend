import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Key/value application settings kept on the server
 * (GET / PUT / PATCH  /api/erpsetting/general-settings/).
 *
 * Holds everything that used to live in localStorage: General Settings toggles,
 * menu size, theme colours, print-header mode/card/banner and header shortcuts.
 *
 * Accepted response shapes: `{...}` flat, `{ data: {...} }` or `{ settings: {...} }`.
 * The same shape that was received is sent back on save.
 */
const LOCAL_KEY = 'rg_general_settings';

const readLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeLocalStorage = (data) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {}
};

const EVENT = 'appSettingsChanged';

let cache = null; // last known settings object
let wrapKey = null; // 'data' | 'settings' | null → how the backend wraps the object
let inflight = null;
let failed = false; // stop hammering the server when the endpoint is missing

const unwrap = (res) => {
  if (res && typeof res === 'object' && !Array.isArray(res)) {
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      wrapKey = 'data';
      return res.data;
    }
    if (res.settings && typeof res.settings === 'object') {
      wrapKey = 'settings';
      return res.settings;
    }
    // DRF list endpoints: take the first (single-row) object
    if (Array.isArray(res.results)) return unwrap(res.results[0] || {});
    const { id, created_at, updated_at, ...rest } = res;
    return rest;
  }
  if (Array.isArray(res)) return unwrap(res[0] || {});
  return {};
};

const wrap = (obj) => (wrapKey ? { [wrapKey]: obj } : obj);

const notify = () => window.dispatchEvent(new Event(EVENT));

export const appSettingsService = {
  EVENT,

  /** Settings currently in memory (may be null before the first load). */
  getCached: () => cache || readLocalStorage(),

  /** Load from the server once; subsequent calls return the cached copy. */
  load: async (force = false) => {
    if (cache && !force) return cache;
    if (inflight) return inflight;
    inflight = apiClient
      .get(ENDPOINTS.SETTING_GENERAL_SETTINGS)
      .then((res) => {
        cache = { ...readLocalStorage(), ...unwrap(res) };
        writeLocalStorage(cache);
        failed = false;
        notify();
        return cache;
      })
      .catch((err) => {
        failed = true;
        cache = cache || readLocalStorage();
        console.warn('General settings API unavailable, using local settings:', err?.message);
        notify();
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },

  /** Read one key (from cache). */
  get: (key, fallback) => {
    const current = cache || readLocalStorage();
    const v = current?.[key];
    return v === undefined || v === null ? fallback : v;
  },

  /** Merge a partial object into the settings and persist it. */
  update: async (partial) => {
    const next = { ...(cache || readLocalStorage()), ...partial };
    cache = next;
    writeLocalStorage(next);
    notify();

    try {
      const res = await apiClient.patch(ENDPOINTS.SETTING_GENERAL_SETTINGS, wrap(partial));
      cache = { ...next, ...unwrap(res) };
      writeLocalStorage(cache);
      failed = false;
    } catch (err) {
      if (err?.status === 405 || err?.response?.status === 405) {
        try {
          const res = await apiClient.put(ENDPOINTS.SETTING_GENERAL_SETTINGS, wrap(next));
          cache = { ...next, ...unwrap(res) };
          writeLocalStorage(cache);
          failed = false;
        } catch (putErr) {
          failed = true;
          console.warn('General settings PUT update unavailable:', putErr?.message);
        }
      } else {
        failed = true;
        console.warn('General settings API update unavailable, saved locally:', err?.message);
      }
    }
    notify();
    return cache;
  },

  set: (key, value) => appSettingsService.update({ [key]: value }),

  /** Forget everything (used on logout). */
  reset: () => {
    cache = null;
    wrapKey = null;
    failed = false;
  },
};

export default appSettingsService;
