import { settingService } from './settingService';
import { getBaseURL } from '../api/apiClient';

/**
 * In-memory copy of the company information (/api/erpsetting/company-info/)
 * shared by the header, <PrintHeader/> and the print utilities so every screen
 * shows the same data without re-fetching and nothing is kept in localStorage.
 */
const EVENT = 'companyInfoUpdated';

let cache = null;
let inflight = null;

const normalise = (res) => {
  const data = res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : res;
  if (Array.isArray(data)) return data[0] || {};
  if (Array.isArray(data?.results)) return data.results[0] || {};
  return data && typeof data === 'object' ? data : {};
};

const notify = () => window.dispatchEvent(new Event(EVENT));

export const companyStore = {
  EVENT,

  getCached: () => cache || {},

  load: async (force = false) => {
    if (cache && !force) return cache;
    if (inflight) return inflight;
    inflight = settingService
      .getCompanyInfo()
      .then((res) => {
        cache = normalise(res);
        notify();
        return cache;
      })
      .catch((err) => {
        console.warn('Company info unavailable:', err?.message);
        cache = cache || {};
        notify();
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },

  /** Persist (JSON or FormData) and refresh the cache with the server's answer. */
  save: async (data, isFormData = false) => {
    const res = await settingService.updateCompanyInfo(data, isFormData);
    const saved = normalise(res);
    cache = { ...(cache || {}), ...(isFormData ? {} : data), ...saved };
    notify();
    return cache;
  },

  /** Update the cache without a request (used after uploads that return the row). */
  setCached: (data) => {
    cache = { ...(cache || {}), ...(data || {}) };
    notify();
  },

  reset: () => {
    cache = null;
  },
};

/** Banner image URL stored on the company row (several field names tolerated). */
export const companyHeaderImage = (info = companyStore.getCached()) => {
  if (!info) return '';
  const img = info.memo_header_image || info.header_image || info.logo || '';
  if (!img) return '';
  if (/^(https?:|\/\/|blob:|data:)/.test(img)) return img;

  // The backend returns a server-relative path such as "/media/header/logo.png".
  // It has to be resolved against the API origin — not the app's own origin —
  // which is exactly what apiClient already works out. In development that is
  // '' so the path stays relative and Vite proxies /media to the backend
  // (see vite.config.js); in production it is VITE_API_BASE_URL.
  const host = getBaseURL().replace(/\/+$/, '');
  return `${host}/${img.replace(/^\/+/, '')}`;
};

export default companyStore;
