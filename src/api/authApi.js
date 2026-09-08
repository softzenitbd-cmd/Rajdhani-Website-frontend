import apiClient from './apiClient';
import { ENDPOINTS } from './endpoints';

// ==========================================
// User Authentication & Profile API
// ==========================================

/**
 * Register a new user
 * Note: Requires Bearer Token of superadmin or admin
 * @param {Object|FormData} userData - User registration data
 * @returns {Promise<Object>}
 */
export const registerUser = async (userData) => {
  // If formData is passed (for image upload), headers are handled correctly by Axios or can be specified
  return await apiClient.post(ENDPOINTS.AUTH_REGISTER, userData);
};

/**
 * Login user to get JWT tokens
 * @param {Object} credentials - { username, password }
 * @returns {Promise<Object>} Access and refresh tokens with user details
 */
export const loginUser = async (credentials) => {
  return await apiClient.post(ENDPOINTS.AUTH_LOGIN, credentials);
};

/**
 * Refresh JWT access token
 * @param {Object} data - { refresh: "refresh_token_here" }
 * @returns {Promise<Object>} New access and refresh tokens
 */
export const refreshToken = async (data) => {
  return await apiClient.post(ENDPOINTS.AUTH_TOKEN_REFRESH, data);
};

/**
 * Change password for the currently logged-in user
 * @param {Object} data - { old_password, new_password }
 * @returns {Promise<Object>}
 */
export const changePassword = async (data) => {
  return await apiClient.post(ENDPOINTS.AUTH_CHANGE_PASSWORD, data);
};

/**
 * Admin: Change password of any specific user
 * Note: Requires superadmin role
 * @param {string} userId - UUID of the target user
 * @param {Object} data - { new_password }
 * @returns {Promise<Object>}
 */
export const adminChangeUserPassword = async (userId, data) => {
  return await apiClient.post(`${ENDPOINTS.AUTH_ADMIN_CHANGE_PASSWORD}${userId}/`, data);
};

/**
 * Get current logged-in user's profile
 * @returns {Promise<Object>}
 */
export const getUserProfile = async () => {
  return await apiClient.get(ENDPOINTS.AUTH_PROFILE);
};

/**
 * Update current logged-in user's profile
 * @param {Object} profileData - Data to update (e.g., full_name, present_address)
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (profileData) => {
  return await apiClient.patch(ENDPOINTS.AUTH_PROFILE, profileData);
};

// ==========================================
// User Management API (Admin/Superadmin)
// ==========================================

/**
 * Get list of all users
 * Note: Only for superadmin or admin
 * @returns {Promise<Array>}
 */
export const getUserList = async () => {
  return await apiClient.get(ENDPOINTS.AUTH_USERS);
};

/**
 * Get details of a specific user
 * @param {string} id - UUID of the user
 * @returns {Promise<Object>}
 */
export const getUserDetails = async (id) => {
  return await apiClient.get(`${ENDPOINTS.AUTH_USERS}${id}/`);
};

/**
 * Update a specific user's details
 * @param {string} id - UUID of the user
 * @param {Object} userData - Data to update
 * @returns {Promise<Object>}
 */
export const updateUser = async (id, userData) => {
  return await apiClient.patch(`${ENDPOINTS.AUTH_USERS}${id}/`, userData);
};

/**
 * Delete a specific user
 * @param {string} id - UUID of the user
 * @returns {Promise<Object>}
 */
export const deleteUser = async (id) => {
  return await apiClient.delete(`${ENDPOINTS.AUTH_USERS}${id}/`);
};

/**
 * Update user permissions
 * Note: Only for superadmin role
 * @param {string} id - UUID of the user
 * @param {Object} permissionsData - { custom_permissions: { ... } }
 * @returns {Promise<Object>}
 */
export const updateUserPermissions = async (id, permissionsData) => {
  return await apiClient.patch(`${ENDPOINTS.AUTH_USERS}${id}/permissions/`, permissionsData);
};

export default {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  adminChangeUserPassword,
  getUserProfile,
  updateUserProfile,
  getUserList,
  getUserDetails,
  updateUser,
  deleteUser,
  updateUserPermissions
};
