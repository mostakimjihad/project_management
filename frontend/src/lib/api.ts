import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { 
  User, UserPending, UserApproval, UserRoleUpdate,
  Role, RoleBrief, RoleCreate, RoleUpdate, RoleWithUsers,
  Permission, PermissionCreate, PermissionUpdate, PermissionModules,
  UserRoleAssign,
  PaginatedResponse
} from './types';

// Use relative path with proxy configured in vite.config.ts
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Role & Permission API ====================

// Permissions
export const permissionsApi = {
  list: (module?: string) => 
    api.get<Permission[]>('/roles/permissions', { params: { module } }),
  
  listByModule: () => 
    api.get<PermissionModules[]>('/roles/permissions/by-module'),
  
  create: (data: PermissionCreate) => 
    api.post<Permission>('/roles/permissions', data),
  
  update: (id: string, data: PermissionUpdate) => 
    api.put<Permission>(`/roles/permissions/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/roles/permissions/${id}`),
};

// Roles
export const rolesApi = {
  list: (page = 1, limit = 10, includeInactive = false) => 
    api.get<PaginatedResponse<Role>>('/roles', { params: { page, limit, include_inactive: includeInactive } }),
  
  listAll: () => 
    api.get<RoleBrief[]>('/roles/all'),
  
  get: (id: string) => 
    api.get<RoleWithUsers>(`/roles/${id}`),
  
  create: (data: RoleCreate) => 
    api.post<Role>('/roles', data),
  
  update: (id: string, data: RoleUpdate) => 
    api.put<Role>(`/roles/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/roles/${id}`),
  
  // User role assignment
  assignRoles: (userId: string, data: UserRoleAssign) => 
    api.post<User>(`/roles/users/${userId}/assign`, data),
  
  removeRoles: (userId: string, data: UserRoleAssign) => 
    api.post<User>(`/roles/users/${userId}/remove`, data),
  
  updateSystemRole: (userId: string, data: UserRoleUpdate) => 
    api.put<User>(`/roles/users/${userId}/system-role`, data),
  
  // User approval
  getPendingUsers: (page = 1, limit = 10, statusFilter = 'pending') => 
    api.get<PaginatedResponse<UserPending>>('/roles/users/pending', { 
      params: { page, limit, status_filter: statusFilter } 
    }),
  
  approveUser: (userId: string, data: UserApproval) => 
    api.post<User>(`/roles/users/${userId}/approve`, data),
};

export default api;
