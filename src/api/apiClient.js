import axios from 'axios';

// 1. Create an Axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout (reports can be heavy)
});

const PUBLIC_AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/token/refresh'];
const isPublicAuthEndpoint = (url = '') => PUBLIC_AUTH_PATHS.some((p) => url.includes(p));

// Clears every auth related key and sends the user to the login page.
export const forceLogout = () => {
  ['token', 'refresh_token', 'custom_permissions', 'role', 'username', 'full_name', 'user_id'].forEach((k) =>
    localStorage.removeItem(k)
  );
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

// 2. Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !isPublicAuthEndpoint(config.url)) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Let the browser set the multipart boundary when FormData is sent
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single in-flight refresh shared by every 401 that arrives at the same time
let refreshPromise = null;
const refreshAccessToken = async () => {
  if (!refreshPromise) {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return Promise.reject(new Error('No refresh token'));
    refreshPromise = axios
      .post(`${apiClient.defaults.baseURL}/api/auth/token/refresh/`, { refresh })
      .then((res) => {
        const { access, refresh: newRefresh } = res.data || {};
        if (!access) throw new Error('No access token in refresh response');
        localStorage.setItem('token', access);
        if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
        return access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Flatten DRF style validation errors ({field: ["msg"]}) into one readable line
const extractErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.error) return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  if (data.message) return data.message;
  if (typeof data === 'object') {
    const parts = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v}`);
    if (parts.length) return parts.join(' | ');
  }
  return fallback;
};

// 3. Add a response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    // Try once to refresh an expired access token, then replay the request
    if (status === 401 && !original._retry && !isPublicAuthEndpoint(original.url)) {
      original._retry = true;
      try {
        const access = await refreshAccessToken();
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${access}` };
        return apiClient(original);
      } catch {
        forceLogout();
      }
    }

    const customError = {
      message: extractErrorMessage(
        error.response?.data,
        error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : error.message || 'Something went wrong'
      ),
      status,
      data: error.response?.data,
      response: error.response,
    };

    return Promise.reject(customError);
  }
);

export default apiClient;
