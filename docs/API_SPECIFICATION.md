# API Specification Documentation

## Base URL
```
Development: http://localhost:8000/api/v1
Production: https://api.projectmanagement.com/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header.

```
Authorization: Bearer <access_token>
```

---

## Endpoints

### Authentication

#### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "hourly_rate": 50.00
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "member",
  "hourly_rate": 50.00,
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "member"
  }
}
```

#### Refresh Token
```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Get Current User
```
GET /auth/me
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "role": "member",
  "hourly_rate": 50.00,
  "is_active": true,
  "created_at": "2026-03-20T10:00:00Z",
  "last_login": "2026-03-20T14:30:00Z"
}
```

#### Update Profile
```
PUT /auth/profile
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "hourly_rate": 60.00
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Smith",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "hourly_rate": 60.00,
  "updated_at": "2026-03-20T15:00:00Z"
}
```

---

### Users

#### List Users
```
GET /users?page=1&limit=10&role=member&search=john
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10, max: 100)
- `role` (string): Filter by role (admin, manager, member)
- `search` (string): Search by name or email
- `is_active` (boolean): Filter by active status

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "member",
      "hourly_rate": 50.00,
      "is_active": true
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

#### Get User
```
GET /users/{user_id}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "role": "member",
  "hourly_rate": 50.00,
  "is_active": true,
  "created_at": "2026-03-20T10:00:00Z",
  "teams": [
    {
      "id": "uuid",
      "name": "Development Team",
      "role": "member"
    }
  ],
  "stats": {
    "assigned_tasks": 5,
    "completed_tasks": 20,
    "total_hours_logged": 150.5
  }
}
```

#### Update User (Admin only)
```
PUT /users/{user_id}
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "role": "manager",
  "hourly_rate": 75.00,
  "is_active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Smith",
  "role": "manager",
  "hourly_rate": 75.00,
  "is_active": true,
  "updated_at": "2026-03-20T15:00:00Z"
}
```

#### Delete User (Admin only)
```
DELETE /users/{user_id}
```

**Response (204):** No content

---

### Teams

#### List Teams
```
GET /teams?page=1&limit=10
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Development Team",
      "description": "Main development team",
      "member_count": 8,
      "created_at": "2026-03-20T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

#### Create Team
```
POST /teams
```

**Request Body:**
```json
{
  "name": "Development Team",
  "description": "Main development team"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Development Team",
  "description": "Main development team",
  "created_by": "uuid",
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### Get Team
```
GET /teams/{team_id}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Development Team",
  "description": "Main development team",
  "created_at": "2026-03-20T10:00:00Z",
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "lead",
      "joined_at": "2026-03-20T10:00:00Z"
    }
  ],
  "projects": [
    {
      "id": "uuid",
      "name": "Project Alpha",
      "status": "active"
    }
  ]
}
```

#### Update Team
```
PUT /teams/{team_id}
```

**Request Body:**
```json
{
  "name": "Backend Team",
  "description": "Backend development team"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Backend Team",
  "description": "Backend development team",
  "updated_at": "2026-03-20T15:00:00Z"
}
```

#### Delete Team
```
DELETE /teams/{team_id}
```

**Response (204):** No content

#### Add Team Member
```
POST /teams/{team_id}/members
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "role": "member"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "user_id": "uuid",
  "role": "member",
  "joined_at": "2026-03-20T15:00:00Z"
}
```

#### Remove Team Member
```
DELETE /teams/{team_id}/members/{user_id}
```

**Response (204):** No content

---

### Projects

#### List Projects
```
GET /projects?page=1&limit=10&status=active&priority=high
```

**Query Parameters:**
- `page` (int): Page number
- `limit` (int): Items per page
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `team_id` (uuid): Filter by team
- `search` (string): Search by name
- `overdue` (boolean): Filter overdue projects

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Project Alpha",
      "description": "Main project description",
      "status": "active",
      "priority": "high",
      "progress": 45,
      "budget": 50000.00,
      "spent": 22500.00,
      "start_date": "2026-01-01",
      "end_date": "2026-06-30",
      "team": {
        "id": "uuid",
        "name": "Development Team"
      },
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

#### Create Project
```
POST /projects
```

**Request Body:**
```json
{
  "name": "Project Alpha",
  "description": "Main project description",
  "status": "planning",
  "priority": "high",
  "budget": 50000.00,
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "team_id": "uuid"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Project Alpha",
  "description": "Main project description",
  "status": "planning",
  "priority": "high",
  "progress": 0,
  "budget": 50000.00,
  "spent": 0,
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "team_id": "uuid",
  "created_by": "uuid",
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### Get Project
```
GET /projects/{project_id}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Project Alpha",
  "description": "Main project description",
  "status": "active",
  "priority": "high",
  "progress": 45,
  "budget": 50000.00,
  "spent": 22500.00,
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "team": {
    "id": "uuid",
    "name": "Development Team",
    "members": []
  },
  "stats": {
    "total_tasks": 50,
    "completed_tasks": 22,
    "total_risks": 5,
    "high_risks": 2,
    "budget_utilization": 45
  },
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-03-20T10:00:00Z"
}
```

#### Update Project
```
PUT /projects/{project_id}
```

**Request Body:**
```json
{
  "name": "Project Alpha Updated",
  "status": "active",
  "priority": "critical",
  "progress": 50,
  "budget": 55000.00
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Project Alpha Updated",
  "status": "active",
  "priority": "critical",
  "progress": 50,
  "budget": 55000.00,
  "updated_at": "2026-03-20T15:00:00Z"
}
```

#### Delete Project
```
DELETE /projects/{project_id}
```

**Response (204):** No content

#### Get Project Health
```
GET /projects/{project_id}/health
```

**Response (200):**
```json
{
  "project_id": "uuid",
  "overall_health": "good",
  "scores": {
    "schedule": 75,
    "budget": 85,
    "scope": 90,
    "risk": 70
  },
  "metrics": {
    "days_remaining": 92,
    "tasks_completion_rate": 44,
    "budget_utilization": 45,
    "high_risks_count": 2
  },
  "alerts": [
    {
      "type": "deadline",
      "severity": "warning",
      "message": "3 tasks are overdue"
    }
  ]
}
```

---

### Tasks

#### List Tasks
```
GET /tasks?page=1&limit=10&project_id=uuid&status=in_progress
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `project_id` (uuid): Filter by project
- `milestone_id` (uuid): Filter by milestone
- `assigned_to` (uuid): Filter by assignee
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `overdue` (boolean): Filter overdue tasks
- `search` (string): Search by title

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Implement user authentication",
      "description": "Add JWT authentication",
      "status": "in_progress",
      "priority": "high",
      "estimated_hours": 8.0,
      "actual_hours": 5.5,
      "due_date": "2026-03-25",
      "project": {
        "id": "uuid",
        "name": "Project Alpha"
      },
      "assigned_to": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "created_at": "2026-03-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

#### Create Task
```
POST /tasks
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "milestone_id": "uuid",
  "parent_id": "uuid",
  "title": "Implement user authentication",
  "description": "Add JWT authentication with refresh tokens",
  "status": "todo",
  "priority": "high",
  "estimated_hours": 8.0,
  "assigned_to": "uuid",
  "due_date": "2026-03-25"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Implement user authentication",
  "status": "todo",
  "priority": "high",
  "estimated_hours": 8.0,
  "assigned_to": "uuid",
  "created_by": "uuid",
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### Get Task
```
GET /tasks/{task_id}
```

**Response (200):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "milestone_id": "uuid",
  "parent_id": null,
  "title": "Implement user authentication",
  "description": "Add JWT authentication",
  "status": "in_progress",
  "priority": "high",
  "estimated_hours": 8.0,
  "actual_hours": 5.5,
  "due_date": "2026-03-25",
  "project": {
    "id": "uuid",
    "name": "Project Alpha"
  },
  "assigned_to": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "sub_tasks": [
    {
      "id": "uuid",
      "title": "Create login form",
      "status": "done"
    }
  ],
  "time_entries": [
    {
      "id": "uuid",
      "hours": 3.0,
      "logged_at": "2026-03-19"
    }
  ],
  "created_at": "2026-03-15T10:00:00Z",
  "updated_at": "2026-03-20T10:00:00Z"
}
```

#### Update Task
```
PUT /tasks/{task_id}
```

**Request Body:**
```json
{
  "title": "Implement OAuth authentication",
  "status": "in_progress",
  "priority": "urgent",
  "actual_hours": 6.0,
  "assigned_to": "uuid"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Implement OAuth authentication",
  "status": "in_progress",
  "priority": "urgent",
  "actual_hours": 6.0,
  "updated_at": "2026-03-20T15:00:00Z"
}
```

#### Delete Task
```
DELETE /tasks/{task_id}
```

**Response (204):** No content

#### Add Task Comment
```
POST /tasks/{task_id}/comments
```

**Request Body:**
```json
{
  "content": "This is almost complete, just need to add tests."
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "task_id": "uuid",
  "user_id": "uuid",
  "content": "This is almost complete, just need to add tests.",
  "created_at": "2026-03-20T15:00:00Z"
}
```

#### Get Task Comments
```
GET /tasks/{task_id}/comments
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "content": "This is almost complete.",
      "user": {
        "id": "uuid",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      },
      "created_at": "2026-03-20T15:00:00Z"
    }
  ],
  "total": 5
}
```

---

### Time Tracking

#### List Time Entries
```
GET /time-entries?page=1&limit=10&user_id=uuid&task_id=uuid
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `user_id` (uuid): Filter by user
- `task_id` (uuid): Filter by task
- `project_id` (uuid): Filter by project
- `start_date` (date): From date
- `end_date` (date): To date

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "task": {
        "id": "uuid",
        "title": "Implement authentication"
      },
      "user": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "description": "Working on JWT implementation",
      "hours": 3.5,
      "hourly_rate": 50.00,
      "billable": true,
      "logged_at": "2026-03-20",
      "created_at": "2026-03-20T18:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### Create Time Entry
```
POST /time-entries
```

**Request Body:**
```json
{
  "task_id": "uuid",
  "description": "Working on JWT implementation",
  "hours": 3.5,
  "billable": true,
  "logged_at": "2026-03-20"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "task_id": "uuid",
  "user_id": "uuid",
  "description": "Working on JWT implementation",
  "hours": 3.5,
  "hourly_rate": 50.00,
  "billable": true,
  "logged_at": "2026-03-20",
  "created_at": "2026-03-20T18:00:00Z"
}
```

#### Update Time Entry
```
PUT /time-entries/{entry_id}
```

**Request Body:**
```json
{
  "hours": 4.0,
  "description": "Updated description"
}
```

#### Delete Time Entry
```
DELETE /time-entries/{entry_id}
```

**Response (204):** No content

---

### Costs

#### List Costs
```
GET /costs?page=1&limit=10&project_id=uuid
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `project_id` (uuid): Filter by project
- `category` (string): Filter by category
- `approved` (boolean): Filter by approval status
- `start_date`, `end_date`: Date range

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "project": {
        "id": "uuid",
        "name": "Project Alpha"
      },
      "category": "software",
      "description": "Cloud hosting - March",
      "amount": 500.00,
      "currency": "USD",
      "incurred_date": "2026-03-01",
      "approved": true,
      "approved_by": {
        "id": "uuid",
        "full_name": "Manager Name"
      },
      "created_at": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 10
}
```

#### Create Cost Entry
```
POST /costs
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "category": "software",
  "description": "Cloud hosting - March",
  "amount": 500.00,
  "currency": "USD",
  "incurred_date": "2026-03-01"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "category": "software",
  "description": "Cloud hosting - March",
  "amount": 500.00,
  "currency": "USD",
  "incurred_date": "2026-03-01",
  "approved": false,
  "created_by": "uuid",
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### Approve Cost
```
POST /costs/{cost_id}/approve
```

**Response (200):**
```json
{
  "id": "uuid",
  "approved": true,
  "approved_by": "uuid",
  "approved_at": "2026-03-20T15:00:00Z"
}
```

#### Get Cost Analysis
```
GET /costs/analysis/{project_id}
```

**Response (200):**
```json
{
  "project_id": "uuid",
  "budget": 50000.00,
  "total_spent": 22500.00,
  "remaining_budget": 27500.00,
  "budget_utilization": 45,
  "by_category": [
    {
      "category": "labor",
      "budget": 30000.00,
      "spent": 15000.00,
      "percentage": 50
    },
    {
      "category": "software",
      "budget": 10000.00,
      "spent": 4500.00,
      "percentage": 45
    }
  ],
  "monthly_trend": [
    {
      "month": "2026-01",
      "spent": 5000.00
    },
    {
      "month": "2026-02",
      "spent": 8500.00
    }
  ],
  "projected_total": 52000.00,
  "projected_overrun": 2000.00
}
```

---

### Risks

#### List Risks
```
GET /risks?page=1&limit=10&project_id=uuid
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `project_id` (uuid): Filter by project
- `status` (string): Filter by status
- `category` (string): Filter by category
- `min_score` (int): Minimum risk score

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Key developer may leave",
      "description": "Risk of losing critical knowledge",
      "category": "resource",
      "probability": "medium",
      "impact": "high",
      "risk_score": 6,
      "status": "mitigating",
      "mitigation_plan": "Cross-training team members",
      "project": {
        "id": "uuid",
        "name": "Project Alpha"
      },
      "owner": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "identified_date": "2026-02-15",
      "created_at": "2026-02-15T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

#### Create Risk
```
POST /risks
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "title": "Key developer may leave",
  "description": "Risk of losing critical knowledge if key developer leaves",
  "category": "resource",
  "probability": "medium",
  "impact": "high",
  "status": "identified",
  "mitigation_plan": "Cross-training team members",
  "owner_id": "uuid",
  "identified_date": "2026-03-20",
  "target_resolution_date": "2026-04-30"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Key developer may leave",
  "category": "resource",
  "probability": "medium",
  "impact": "high",
  "risk_score": 6,
  "status": "identified",
  "created_by": "uuid",
  "created_at": "2026-03-20T10:00:00Z"
}
```

#### Update Risk
```
PUT /risks/{risk_id}
```

**Request Body:**
```json
{
  "status": "mitigating",
  "mitigation_plan": "Updated mitigation strategy",
  "probability": "low"
}
```

#### Delete Risk
```
DELETE /risks/{risk_id}
```

**Response (204):** No content

#### Get Risk Analysis
```
GET /risks/analysis/{project_id}
```

**Response (200):**
```json
{
  "project_id": "uuid",
  "summary": {
    "total_risks": 10,
    "by_severity": {
      "critical": 1,
      "high": 3,
      "medium": 4,
      "low": 2
    },
    "by_status": {
      "identified": 3,
      "analyzing": 2,
      "mitigating": 3,
      "resolved": 1,
      "accepted": 1
    }
  },
  "risk_matrix": {
    "very_high": { "low": 0, "medium": 0, "high": 1, "critical": 1 },
    "high": { "low": 1, "medium": 1, "high": 1, "critical": 0 },
    "medium": { "low": 1, "medium": 2, "high": 0, "critical": 0 },
    "low": { "low": 2, "medium": 0, "high": 0, "critical": 0 }
  },
  "top_risks": [
    {
      "id": "uuid",
      "title": "Server infrastructure failure",
      "risk_score": 12,
      "category": "technical"
    }
  ],
  "recommendations": [
    "Immediate attention required for 1 critical risk",
    "3 high-priority risks need mitigation plans"
  ]
}
```

---

### Milestones

#### List Milestones
```
GET /milestones?project_id=uuid
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "name": "MVP Release",
      "description": "Minimum viable product",
      "due_date": "2026-04-30",
      "status": "in_progress",
      "completed_at": null,
      "tasks_count": 15,
      "tasks_completed": 8,
      "created_at": "2026-03-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

#### Create Milestone
```
POST /milestones
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "name": "MVP Release",
  "description": "Minimum viable product release",
  "due_date": "2026-04-30"
}
```

#### Update Milestone
```
PUT /milestones/{milestone_id}
```

#### Delete Milestone
```
DELETE /milestones/{milestone_id}
```

---

### Reports

#### Project Report
```
GET /reports/project/{project_id}
```

**Response (200):**
```json
{
  "project": {
    "id": "uuid",
    "name": "Project Alpha",
    "status": "active"
  },
  "summary": {
    "progress": 45,
    "budget_used": 45,
    "days_remaining": 92,
    "on_track": true
  },
  "tasks": {
    "total": 50,
    "completed": 22,
    "in_progress": 15,
    "overdue": 3
  },
  "costs": {
    "budget": 50000.00,
    "spent": 22500.00,
    "projected": 52000.00
  },
  "risks": {
    "total": 10,
    "high_priority": 4,
    "mitigation_in_progress": 3
  },
  "team_performance": [
    {
      "user": "John Doe",
      "tasks_completed": 8,
      "hours_logged": 45.5
    }
  ]
}
```

#### Cost Report
```
GET /reports/cost/{project_id}
```

**Response (200):**
```json
{
  "project_id": "uuid",
  "report_period": {
    "start": "2026-01-01",
    "end": "2026-03-20"
  },
  "budget_summary": {
    "total_budget": 50000.00,
    "total_spent": 22500.00,
    "remaining": 27500.00,
    "utilization_percentage": 45
  },
  "cost_breakdown": {
    "labor": {
      "budget": 30000.00,
      "spent": 15000.00,
      "hours": 300
    },
    "software": {
      "budget": 10000.00,
      "spent": 4500.00
    }
  },
  "trend": [],
  "forecasts": {
    "estimated_total": 52000.00,
    "potential_overrun": 2000.00
  }
}
```

#### Risk Report
```
GET /reports/risk/{project_id}
```

#### Deadline Report
```
GET /reports/deadline/{project_id}
```

**Response (200):**
```json
{
  "project_id": "uuid",
  "deadline": "2026-06-30",
  "days_remaining": 92,
  "on_track": true,
  "completion_percentage": 45,
  "milestone_status": [
    {
      "name": "Phase 1",
      "due_date": "2026-03-31",
      "status": "on_track",
      "progress": 80
    }
  ],
  "velocity": {
    "tasks_per_week": 5,
    "hours_per_week": 40
  },
  "prediction": {
    "estimated_completion": "2026-06-15",
    "confidence": 85,
    "risk_factors": [
      "3 overdue tasks",
      "2 high-priority risks"
    ]
  }
}
```

---

### Notifications

#### List Notifications
```
GET /notifications?page=1&limit=20&unread_only=true
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "You have been assigned to 'Implement authentication'",
      "data": {
        "task_id": "uuid"
      },
      "read": false,
      "created_at": "2026-03-20T15:00:00Z"
    }
  ],
  "unread_count": 5,
  "total": 50
}
```

#### Mark as Read
```
PUT /notifications/{notification_id}/read
```

#### Mark All as Read
```
PUT /notifications/read-all
```

---

### Dashboard

#### Get Dashboard Data
```
GET /dashboard
```

**Response (200):**
```json
{
  "overview": {
    "total_projects": 5,
    "active_projects": 3,
    "total_tasks": 150,
    "overdue_tasks": 8,
    "total_risks": 15,
    "high_risks": 3
  },
  "my_tasks": {
    "assigned": 10,
    "in_progress": 5,
    "completed_this_week": 8,
    "overdue": 2
  },
  "project_summaries": [
    {
      "id": "uuid",
      "name": "Project Alpha",
      "progress": 45,
      "status": "active",
      "days_remaining": 92
    }
  ],
  "recent_activity": [],
  "upcoming_deadlines": [],
  "risk_alerts": []
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Rate Limiting
- **Standard endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647780000
```

---

*Last Updated: March 20, 2026*