// User types
export type UserRole = 'admin' | 'manager' | 'member';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  hourly_rate?: number;
  job_title?: string;
  department?: string;
  phone?: string;
  approval_status: ApprovalStatus;
  approved_at?: string;
  rejection_reason?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  custom_roles?: Role[];
}

export interface UserPending {
  id: string;
  email: string;
  full_name: string;
  job_title?: string;
  department?: string;
  created_at: string;
  approval_status: ApprovalStatus;
}

export interface UserApproval {
  approve: boolean;
  role?: UserRole;
  rejection_reason?: string;
}

export interface UserRoleUpdate {
  role: UserRole;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  module: string;
  action: string;
  is_active: boolean;
  created_at: string;
}

export interface PermissionCreate {
  name: string;
  display_name: string;
  description?: string;
  module: string;
  action: string;
}

export interface PermissionUpdate {
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

// Role types
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface RoleBrief {
  id: string;
  name: string;
  display_name: string;
}

export interface RoleCreate {
  name: string;
  display_name: string;
  description?: string;
  permission_ids?: string[];
}

export interface RoleUpdate {
  display_name?: string;
  description?: string;
  is_active?: boolean;
  permission_ids?: string[];
}

export interface RoleWithUsers extends Role {
  user_count: number;
}

export interface UserRoleAssign {
  role_ids: string[];
}

export interface PermissionModules {
  module: string;
  permissions: Permission[];
}

// Project types
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  spent: number;
  start_date: string;
  end_date?: string;
  actual_end_date?: string;
  progress: number;
  team_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number;
  start_date: string;
  end_date?: string;
  team_id?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number;
  start_date?: string;
  end_date?: string;
  progress?: number;
  team_id?: string;
}

// Task types
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  project_id: string;
  milestone_id?: string;
  parent_id?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimated_hours?: number;
  due_date?: string;
  project_id: string;
  milestone_id?: string;
  assigned_to?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  milestone_id?: string;
  assigned_to?: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface TeamCreate {
  name: string;
  description?: string;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface TeamMemberCreate {
  user_id: string;
  role?: string;
}

// Risk types
export type RiskStatus = 'open' | 'mitigated' | 'closed';
export type RiskLikelihood = 'low' | 'medium' | 'high';
export type RiskImpact = 'low' | 'medium' | 'high' | 'critical';

export interface Risk {
  id: string;
  title: string;
  description?: string;
  status: RiskStatus;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  risk_score: number;
  mitigation_plan?: string;
  project_id: string;
  owner_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Cost types
export interface Cost {
  id: string;
  description: string;
  amount: number;
  category: string;
  cost_date: string;
  project_id: string;
  created_by: string;
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  project_id: string;
  start_date: string;
  end_date?: string;
}

// Time Entry types
export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  hours: number;
  description?: string;
  entry_date: string;
  created_at: string;
}

// Dashboard types
export interface DashboardStats {
  projects: {
    total: number;
    active: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
  };
  risks: {
    total: number;
    high: number;
  };
  costs: {
    total_spent: number;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Auth types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthError {
  detail: string;
}