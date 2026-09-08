import axios from 'axios';

// 1. Create an Axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// 2. Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can attach tokens here before every request
    const token = localStorage.getItem('token'); // Replace with your auth logic
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// 3. Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Process the successful response
    return response.data;
  },
  (error) => {
    // Handle global API errors (e.g., token expiration, 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to login or clear token
      console.error('Unauthorized access - possibly invalid token');
    }
    
    // You can optionally format the error message to return standard errors
    const customError = {
      message: error.response?.data?.message || error.message || 'Something went wrong',
      status: error.response?.status,
    };
    
    return Promise.reject(customError);
  }
);

export default apiClient;
