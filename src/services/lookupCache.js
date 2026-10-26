import { crmService } from './crmService';
import { productService } from './productService';
import { toList } from '../utils/apiHelpers';

/**
 * Short-lived cache for the big "lookup" lists (clients, suppliers, products).
 *
 * Reports and statements only need these to resolve a name/phone/address for a
 * row, but each page was re-downloading up to 5000 clients on every visit,
 * which is what made Client Statement and the sales reports slow to open.
 * One shared copy is kept for TTL milliseconds and reused by every page.
 *
 * Writes elsewhere in the app broadcast INVALIDATE_EVENT, so a newly created
 * client or product shows up immediately instead of after the TTL.
 */
const TTL = 2 * 60 * 1000;

export const INVALIDATE_EVENT = 'rg:lookup-invalidate';

/** key -> { at, value } | { inflight } */
const store = new Map();

const cached = (key, loader) => {
  const hit = store.get(key);

  // A request is already on its way — share it instead of starting another.
  if (hit?.inflight) return hit.inflight;
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.value);

  const inflight = loader()
    .then((value) => {
      store.set(key, { at: Date.now(), value });
      return value;
    })
    .catch((err) => {
      store.delete(key);
      throw err;
    });

  store.set(key, { inflight });
  return inflight;
};

export const lookupCache = {
  /** All clients, as a plain array. */
  getClients: () =>
    cached('clients', () =>
      crmService.getClients({ page_size: 1000 }).then(toList).catch(() => [])
    ),

  /** All suppliers, as a plain array. */
  getSuppliers: () =>
    cached('suppliers', () =>
      crmService.getSuppliers({ page_size: 1000 }).then(toList).catch(() => [])
    ),

  /** All products, as a plain array. */
  getProducts: () =>
    cached('products', () =>
      productService.getProducts({ page_size: 500 }).then(toList).catch(() => [])
    ),

  /** Drop one key, or everything when called without arguments. */
  invalidate: (key) => {
    if (key) store.delete(key);
    else store.clear();
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener(INVALIDATE_EVENT, (e) => lookupCache.invalidate(e?.detail));
}

/** Fired by the services after a create/update so the cache does not go stale. */
export const invalidateLookup = (key) => {
  lookupCache.invalidate(key);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INVALIDATE_EVENT, { detail: key }));
  }
};

/** Index a lookup list by every id spelling a row might use. */
export const indexById = (list = []) => {
  const map = new Map();
  list.forEach((row) => {
    if (row?.id) map.set(String(row.id), row);
    if (row?.uuid) map.set(String(row.uuid), row);
  });
  return map;
};

export default lookupCache;
