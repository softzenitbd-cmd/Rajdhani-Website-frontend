import apiClient from './apiClient';
import { ENDPOINTS } from './endpoints';

// ==========================================
// 1. Department API
// ==========================================

export const getDepartments = async (params = {}) => {
  return await apiClient.get(ENDPOINTS.STAFF_DEPARTMENTS, { params });
};

export const createDepartment = async (departmentData) => {
  return await apiClient.post(ENDPOINTS.STAFF_DEPARTMENTS, departmentData);
};

export const updateDepartment = async (id, departmentData) => {
  return await apiClient.patch(`${ENDPOINTS.STAFF_DEPARTMENTS}${id}/`, departmentData);
};

export const deleteDepartment = async (id) => {
  return await apiClient.delete(`${ENDPOINTS.STAFF_DEPARTMENTS}${id}/`);
};

// ==========================================
// 2. Designation API
// ==========================================

export const getDesignations = async (params = {}) => {
  return await apiClient.get(ENDPOINTS.STAFF_DESIGNATIONS, { params });
};

export const createDesignation = async (designationData) => {
  return await apiClient.post(ENDPOINTS.STAFF_DESIGNATIONS, designationData);
};

export const updateDesignation = async (id, designationData) => {
  return await apiClient.patch(`${ENDPOINTS.STAFF_DESIGNATIONS}${id}/`, designationData);
};

export const deleteDesignation = async (id) => {
  return await apiClient.delete(`${ENDPOINTS.STAFF_DESIGNATIONS}${id}/`);
};

// ==========================================
// 3. Staff API
// ==========================================

/**
 * Get staff list with optional filters
 * - search: <user_name_or_phone>
 * - department: <department_uuid>
 */
export const getStaffList = async (params = {}) => {
  return await apiClient.get(ENDPOINTS.STAFF_LIST, { params });
};

export const createStaff = async (staffData) => {
  return await apiClient.post(ENDPOINTS.STAFF_LIST, staffData);
};

export const updateStaff = async (id, staffData) => {
  return await apiClient.patch(`${ENDPOINTS.STAFF_LIST}${id}/`, staffData);
};

export const deleteStaff = async (id) => {
  return await apiClient.delete(`${ENDPOINTS.STAFF_LIST}${id}/`);
};

// ==========================================
// 4. Staff Attendance API
// ==========================================

export const getStaffAttendance = async (params = {}) => {
  return await apiClient.get(ENDPOINTS.STAFF_ATTENDANCE, { params });
};

export const createStaffAttendance = async (attendanceData) => {
  return await apiClient.post(ENDPOINTS.STAFF_ATTENDANCE, attendanceData);
};

// ==========================================
// 5. Attendance Report API
// ==========================================

/**
 * Get monthly attendance report for all staff
 * @param {Object} params - Required parameters: { month: number, year: number }
 */
export const getStaffAttendanceReport = async (params) => {
  return await apiClient.get(ENDPOINTS.STAFF_ATTENDANCE_REPORT, { params });
};

export default {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getStaffList,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffAttendance,
  createStaffAttendance,
  getStaffAttendanceReport,
};
