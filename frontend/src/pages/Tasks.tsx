import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { Plus, Filter, CheckSquare, AlertCircle, Trash2, Edit, LayoutGrid, List } from 'lucide-react'
import type { Task, Project, PaginatedResponse } from '../lib/types'
import Modal from '../components/ui/Modal'
import KanbanBoard, { KanbanItem, KanbanColumn } from '../components/ui/KanbanBoard'
import api from '../lib/api'

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    estimated_hours: 0,
    due_date: '',
    project_id: ''
  })

  // Task status columns for Kanban
  const taskColumns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', color: 'var(--gray-500)' },
    { id: 'in-progress', title: 'In Progress', color: 'var(--blue-500)' },
    { id: 'review', title: 'Review', color: 'var(--yellow-500)' },
    { id: 'done', title: 'Done', color: 'var(--green-500)' }
  ]

  const fetchProjects = async () => {
    if (!token) return
    try {
      const res = await api.get<PaginatedResponse<Project>>('/projects?limit=100')
      setProjects(res.data.items || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const fetchTasks = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<Task>>('/tasks?limit=100')
      setTasks(res.data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchTasks()
  }, [token])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!formData.project_id) {
      setError('Please select a project')
      return
    }
    
    try {
      const res = await api.post<Task>('/tasks', {
        ...formData,
        estimated_hours: formData.estimated_hours || null,
        due_date: formData.due_date || null
      })
      setTasks([...tasks, res.data])
      setShowModal(false)
      setFormData({ title: '', description: '', status: 'todo', priority: 'medium', estimated_hours: 0, due_date: '', project_id: '' })
      setSuccess('Task created successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create task'
      setError(errorMessage)
    }
  }

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put<Task>(`/tasks/${selectedTask.id}`, {
        ...formData,
        project_id: formData.project_id || selectedTask.project_id
      })
      setTasks(tasks.map(t => t.id === res.data.id ? res.data : t))
      setShowEditModal(false)
      setSelectedTask(null)
      setSuccess('Task updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update task'
      setError(errorMessage)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/tasks/${selectedTask.id}`)
      setTasks(tasks.filter(t => t.id !== selectedTask.id))
      setShowDeleteModal(false)
      setSelectedTask(null)
      setSuccess('Task deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete task'
      setError(errorMessage)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await api.put<Task>(`/tasks/${taskId}`, { status: newStatus as Task['status'] })
      setTasks(tasks.map(t => t.id === res.data.id ? res.data : t))
      setSuccess('Task status updated!')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update status'
      setError(errorMessage)
    }
  }

  const openEditModal = (task: Task | KanbanItem) => {
    const taskData = task as Task
    setSelectedTask(taskData)
    setFormData({
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status as 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled',
      priority: taskData.priority as 'low' | 'medium' | 'high' | 'critical',
      estimated_hours: taskData.estimated_hours || 0,
      due_date: taskData.due_date?.split('T')[0] || '',
      project_id: taskData.project_id || ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (task: Task | KanbanItem) => {
    setSelectedTask(task as Task)
    setShowDeleteModal(true)
  }

  const handleAddTask = (status: string) => {
    setFormData(prev => ({ ...prev, status: status as typeof prev.status }))
    setShowModal(true)
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { 
      todo: 'badge-gray', 
      'in-progress': 'badge-blue', 
      review: 'badge-yellow', 
      done: 'badge-green',
      cancelled: 'badge-red'
    }
    return styles[status] || 'badge-gray'
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red' }
    return styles[priority] || 'badge-gray'
  }

  // Convert tasks to Kanban items
  const kanbanItems: KanbanItem[] = tasks
    .filter(t => t.status !== 'cancelled')
    .map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      project_id: task.project_id
    }))

  if (loading) return <div className="loading"><div className="loading-spinner"></div><span>Loading tasks...</span></div>

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track all your tasks</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid />
              Kanban
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List />
              Table
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus />New Task
          </button>
        </div>
      </div>

      {error && <div className="auth-error mb-4"><AlertCircle />{error}</div>}
      {success && <div className="auth-success mb-4" style={{ background: 'var(--green-50)', color: 'var(--green-600)', padding: '12px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px' }}>{success}</div>}

      {viewMode === 'kanban' ? (
        <KanbanBoard
          columns={taskColumns}
          items={kanbanItems.filter(item => filteredTasks.some(t => t.id === item.id))}
          onStatusChange={handleStatusChange}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onAdd={handleAddTask}
          renderExtraContent={(item) => (
            <div className="kanban-project-badge" style={{ marginBottom: '8px' }}>
              <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                {getProjectName(item.project_id as string)}
              </span>
            </div>
          )}
        />
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="flex gap-2">
              <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '8px 12px', width: '240px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '13px' }} />
              <button className="btn btn-secondary btn-sm"><Filter />Filter</button>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Hours</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}><div className="flex items-center justify-center gap-2 text-muted"><CheckSquare size={20} />No tasks found. Create a project first, then add tasks.</div></td></tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td><div style={{ fontWeight: 500 }}>{task.title}</div><div className="text-sm text-muted">{task.description || 'No description'}</div></td>
                      <td><span className="badge badge-blue">{getProjectName(task.project_id)}</span></td>
                      <td><span className={`badge ${getStatusBadge(task.status)}`}>{task.status}</span></td>
                      <td><span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span></td>
                      <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                      <td>{task.estimated_hours || 0}h</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="table-action-btn" onClick={() => openEditModal(task)} title="Edit"><Edit size={16} /></button>
                          <button className="table-action-btn" onClick={() => { setSelectedTask(task); setShowDeleteModal(true); }} title="Delete" style={{ color: 'var(--red-500)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} title="Create New Task" onClose={() => setShowModal(false)}>
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select 
              className="form-select" 
              value={formData.project_id} 
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })} 
              required
            >
              <option value="">Select a project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {projects.length === 0 && (
              <p className="text-sm text-muted mt-1">No projects available. Create a project first.</p>
            )}
          </div>
          <div className="form-group"><label className="form-label">Task Title *</label><input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Task description" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}><option value="todo">Todo</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option></select></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Estimated Hours</label><input type="number" className="form-input" value={formData.estimated_hours} onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })} /></div>
            <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={projects.length === 0}>Create Task</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} title="Edit Task" onClose={() => { setShowEditModal(false); setSelectedTask(null); }}>
        <form onSubmit={handleEditTask}>
          <div className="form-group"><label className="form-label">Task Title *</label><input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Task description" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}><option value="todo">Todo</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="done">Done</option><option value="cancelled">Cancelled</option></select></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Estimated Hours</label><input type="number" className="form-input" value={formData.estimated_hours} onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })} /></div>
            <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedTask(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Task</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} title="Delete Task" onClose={() => { setShowDeleteModal(false); setSelectedTask(null); }}>
        <div className="text-center">
          <AlertCircle size={48} style={{ color: 'var(--red-500)', margin: '0 auto 16px' }} />
          <p style={{ marginBottom: '24px' }}>Are you sure you want to delete "<strong>{selectedTask?.title}</strong>"? This action cannot be undone.</p>
          <div className="flex gap-2 justify-center">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedTask(null); }}>Cancel</button>
            <button type="button" className="btn" style={{ background: 'var(--red-500)', color: 'white' }} onClick={handleDeleteTask}>Delete Task</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}