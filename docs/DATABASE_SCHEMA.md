# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   users     │────<│  team_members   │>────│   teams     │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│ time_entries│────<│     tasks       │>────│  projects   │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                   │                       │
       │                   │                       │
       ▼                   ▼                       ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   costs     │     │  task_comments  │     │  milestones │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   budgets   │     │     risks       │     │activity_logs│
└─────────────┘     └─────────────────┘     └─────────────┘
```

---

## Table Definitions

### 1. users
Stores user account information and authentication data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| full_name | VARCHAR(255) | NOT NULL | Full name |
| avatar_url | VARCHAR(500) | NULLABLE | Profile picture URL |
| role | ENUM | NOT NULL, DEFAULT 'member' | admin, manager, member |
| hourly_rate | DECIMAL(10,2) | NULLABLE | User's hourly rate |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| last_login | TIMESTAMP | NULLABLE | Last login timestamp |

### 2. teams
Stores team information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Team name |
| description | TEXT | NULLABLE | Team description |
| created_by | UUID | FK -> users.id | Team creator |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 3. team_members
Junction table for users and teams.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| team_id | UUID | FK -> teams.id | Team reference |
| user_id | UUID | FK -> users.id | User reference |
| role | ENUM | NOT NULL | lead, member |
| joined_at | TIMESTAMP | NOT NULL | Join timestamp |

### 4. projects
Stores project information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULLABLE | Project description |
| status | ENUM | NOT NULL | planning, active, on_hold, completed, cancelled |
| priority | ENUM | NOT NULL | low, medium, high, critical |
| budget | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Total budget |
| spent | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Amount spent |
| start_date | DATE | NOT NULL | Start date |
| end_date | DATE | NULLABLE | Planned end date |
| actual_end_date | DATE | NULLABLE | Actual completion date |
| progress | INTEGER | NOT NULL, DEFAULT 0 | Progress percentage (0-100) |
| team_id | UUID | FK -> teams.id | Assigned team |
| created_by | UUID | FK -> users.id | Project creator |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 5. milestones
Stores project milestones.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | FK -> projects.id | Project reference |
| name | VARCHAR(255) | NOT NULL | Milestone name |
| description | TEXT | NULLABLE | Milestone description |
| due_date | DATE | NOT NULL | Due date |
| completed_at | TIMESTAMP | NULLABLE | Completion timestamp |
| status | ENUM | NOT NULL | pending, in_progress, completed, overdue |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 6. tasks
Stores task information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | FK -> projects.id | Project reference |
| milestone_id | UUID | FK -> milestones.id, NULLABLE | Milestone reference |
| parent_id | UUID | FK -> tasks.id, NULLABLE | Parent task (sub-tasks) |
| title | VARCHAR(500) | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description |
| status | ENUM | NOT NULL | todo, in_progress, review, done, cancelled |
| priority | ENUM | NOT NULL | low, medium, high, urgent |
| estimated_hours | DECIMAL(6,2) | NULLABLE | Estimated hours |
| actual_hours | DECIMAL(6,2) | NULLABLE | Actual hours spent |
| assigned_to | UUID | FK -> users.id, NULLABLE | Assigned user |
| due_date | DATE | NULLABLE | Due date |
| completed_at | TIMESTAMP | NULLABLE | Completion timestamp |
| created_by | UUID | FK -> users.id | Task creator |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 7. task_comments
Stores comments on tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| task_id | UUID | FK -> tasks.id | Task reference |
| user_id | UUID | FK -> users.id | Comment author |
| content | TEXT | NOT NULL | Comment content |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 8. time_entries
Stores time tracking records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| task_id | UUID | FK -> tasks.id | Task reference |
| user_id | UUID | FK -> users.id | User reference |
| description | TEXT | NULLABLE | Entry description |
| hours | DECIMAL(6,2) | NOT NULL | Hours logged |
| hourly_rate | DECIMAL(10,2) | NOT NULL | Rate at time of entry |
| billable | BOOLEAN | NOT NULL, DEFAULT true | Is billable |
| logged_at | DATE | NOT NULL | Date of work |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

### 9. costs
Stores cost and expense records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | FK -> projects.id | Project reference |
| category | ENUM | NOT NULL | labor, software, hardware, infrastructure, other |
| description | TEXT | NOT NULL | Cost description |
| amount | DECIMAL(15,2) | NOT NULL | Cost amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code |
| incurred_date | DATE | NOT NULL | Date cost incurred |
| approved | BOOLEAN | NOT NULL, DEFAULT false | Approval status |
| approved_by | UUID | FK -> users.id, NULLABLE | Approver |
| approved_at | TIMESTAMP | NULLABLE | Approval timestamp |
| created_by | UUID | FK -> users.id | Entry creator |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 10. budgets
Stores budget allocations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | FK -> projects.id | Project reference |
| category | ENUM | NOT NULL | labor, software, hardware, infrastructure, other |
| allocated | DECIMAL(15,2) | NOT NULL | Allocated amount |
| spent | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Spent amount |
| notes | TEXT | NULLABLE | Budget notes |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 11. risks
Stores risk assessments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| project_id | UUID | FK -> projects.id | Project reference |
| title | VARCHAR(500) | NOT NULL | Risk title |
| description | TEXT | NOT NULL | Risk description |
| category | ENUM | NOT NULL | technical, resource, schedule, budget, external |
| probability | ENUM | NOT NULL | low, medium, high, very_high |
| impact | ENUM | NOT NULL | low, medium, high, critical |
| risk_score | INTEGER | NOT NULL | Calculated score (1-16) |
| status | ENUM | NOT NULL | identified, analyzing, mitigating, resolved, accepted |
| mitigation_plan | TEXT | NULLABLE | Mitigation strategy |
| owner_id | UUID | FK -> users.id, NULLABLE | Risk owner |
| identified_date | DATE | NOT NULL | Date identified |
| target_resolution_date | DATE | NULLABLE | Target resolution |
| resolved_date | DATE | NULLABLE | Resolution date |
| created_by | UUID | FK -> users.id | Entry creator |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### 12. notifications
Stores user notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FK -> users.id | Recipient |
| type | ENUM | NOT NULL | task_assigned, deadline_approaching, risk_alert, mention, status_change |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| data | JSONB | NULLABLE | Additional data |
| read | BOOLEAN | NOT NULL, DEFAULT false | Read status |
| read_at | TIMESTAMP | NULLABLE | Read timestamp |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

### 13. activity_logs
Stores system activity for auditing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| user_id | UUID | FK -> users.id, NULLABLE | Actor |
| action | VARCHAR(100) | NOT NULL | Action type |
| entity_type | VARCHAR(100) | NOT NULL | Entity type |
| entity_id | UUID | NOT NULL | Entity ID |
| old_values | JSONB | NULLABLE | Previous values |
| new_values | JSONB | NULLABLE | New values |
| ip_address | VARCHAR(45) | NULLABLE | Client IP |
| user_agent | TEXT | NULLABLE | Client user agent |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

---

## Indexes

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Projects
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_team_id ON projects(team_id);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

-- Tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Time Entries
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_logged_at ON time_entries(logged_at);

-- Costs
CREATE INDEX idx_costs_project_id ON costs(project_id);
CREATE INDEX idx_costs_category ON costs(category);
CREATE INDEX idx_costs_incurred_date ON costs(incurred_date);

-- Risks
CREATE INDEX idx_risks_project_id ON risks(project_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_score ON risks(risk_score);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Activity Logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

---

## Risk Score Calculation

The risk score is calculated using a matrix approach:

### Probability Values
| Level | Value |
|-------|-------|
| Low | 1 |
| Medium | 2 |
| High | 3 |
| Very High | 4 |

### Impact Values
| Level | Value |
|-------|-------|
| Low | 1 |
| Medium | 2 |
| High | 3 |
| Critical | 4 |

### Risk Score Matrix
| | Low Impact | Medium Impact | High Impact | Critical Impact |
|---|---|---|---|---|
| **Very High Probability** | 4 (Medium) | 8 (High) | 12 (High) | 16 (Critical) |
| **High Probability** | 3 (Low) | 6 (Medium) | 9 (High) | 12 (High) |
| **Medium Probability** | 2 (Low) | 4 (Medium) | 6 (Medium) | 8 (High) |
| **Low Probability** | 1 (Low) | 2 (Low) | 3 (Low) | 4 (Medium) |

### Risk Categories
- **Low (1-3)**: Monitor and accept
- **Medium (4-6)**: Develop mitigation plan
- **High (8-12)**: Active mitigation required
- **Critical (16)**: Immediate action required, escalate to leadership

---

## Views

### Project Health View
```sql
CREATE VIEW project_health AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.progress,
    p.budget,
    p.spent,
    (p.spent / NULLIF(p.budget, 0) * 100) as budget_utilization,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT r.id) as total_risks,
    COUNT(DISTINCT CASE WHEN r.risk_score >= 8 THEN r.id END) as high_risks,
    CASE 
        WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN true
        ELSE false
    END as is_overdue
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
LEFT JOIN risks r ON r.project_id = p.id
GROUP BY p.id;
```

### User Workload View
```sql
CREATE VIEW user_workload AS
SELECT 
    u.id,
    u.full_name,
    COUNT(DISTINCT t.id) as assigned_tasks,
    SUM(t.estimated_hours) as total_estimated_hours,
    SUM(te.hours) as total_logged_hours,
    COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled') THEN t.id END) as overdue_tasks
FROM users u
LEFT JOIN tasks t ON t.assigned_to = u.id
LEFT JOIN time_entries te ON te.task_id = t.id
WHERE u.is_active = true
GROUP BY u.id;
```

---

*Last Updated: March 20, 2026*