/**
 * localStorage backed CRUD service with the same interface as the API services
 * ({ list, create, update, remove }). Used for master data screens the backend
 * does not expose an endpoint for yet (payment methods, sub-categories, shortcuts).
 * Swap the service for a real API one when the endpoint becomes available.
 */
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const createLocalService = (storageKey, seed = []) => {
  const read = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    const seeded = seed.map((s) => ({ id: uid(), created_at: new Date().toISOString(), ...s }));
    localStorage.setItem(storageKey, JSON.stringify(seeded));
    return seeded;
  };
  const write = (rows) => localStorage.setItem(storageKey, JSON.stringify(rows));

  return {
    isLocal: true,
    list: async (params = {}) => {
      const rows = read();
      if (params.search) {
        const q = String(params.search).toLowerCase();
        return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
      }
      return rows;
    },
    create: async (data) => {
      const rows = read();
      const row = { id: uid(), created_at: new Date().toISOString(), ...data };
      rows.unshift(row);
      write(rows);
      return row;
    },
    update: async (id, data) => {
      const rows = read().map((r) => (r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r));
      write(rows);
      return rows.find((r) => r.id === id);
    },
    remove: async (id) => {
      write(read().filter((r) => r.id !== id));
      return true;
    },
  };
};

export default createLocalService;
