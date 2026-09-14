import { useState, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import i18n from '../i18n';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const request = useCallback(async (method, url, data = null, customConfig = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient({
        method,
        url,
        data,
        ...customConfig
      });
      return response;
    } catch (err) {
      console.error(`API Error [${method} ${url}]:`, err);
      if (err.response && err.response.data) {
        console.error('API Error Response Data:', err.response.data);
      }
      // apiClient already flattens DRF errors and shortens HTML error pages
      const errorMessage = (err.message || i18n.t('An unexpected error occurred')).slice(0, 300);

      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const get = useCallback((url, config) => request('GET', url, null, config), [request]);
  
  const post = useCallback(async (url, data, successMessage, config) => {
    const res = await request('POST', url, data, config);
    if (successMessage) toast.success(successMessage);
    return res;
  }, [request, toast]);
  
  const put = useCallback(async (url, data, successMessage, config) => {
    const res = await request('PUT', url, data, config);
    if (successMessage) toast.success(successMessage);
    return res;
  }, [request, toast]);
  
  const del = useCallback(async (url, successMessage, config) => {
    const res = await request('DELETE', url, null, config);
    if (successMessage) toast.success(successMessage);
    return res;
  }, [request, toast]);

  const patch = useCallback(async (url, data, successMessage, config) => {
    const res = await request('PATCH', url, data, config);
    if (successMessage) toast.success(successMessage);
    return res;
  }, [request, toast]);

  return { get, post, put, patch, del, loading, error };
};
