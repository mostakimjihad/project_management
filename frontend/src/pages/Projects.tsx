import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { Plus, Filter, FolderKanban, AlertCircle, Trash2, Edit, LayoutGrid, List, DollarSign } from 'lucide-react'
import type { Project, PaginatedResponse } from '../lib/types'
import Modal from '../components/ui/Modal'
import KanbanBoard, { KanbanItem, KanbanColumn } from '../components/ui/KanbanBoard'
import api from '../lib/api'

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    budget: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })

  // Project status columns for Kanban (phases)
  const projectColumns: KanbanColumn[] = [
    { id: 'planning', title: 'Planning', color: 'var(--blue-500)' },
    { id: 'active', title: 'Active', color: 'var(--green-500)' },
    { id: 'on-hold', title: 'On Hold', color: 'var(--yellow-500)' },
    { id: 'completed', title: 'Completed', color: 'var(--gray-500)' }
  ]

  const fetchProjects = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<Project>>('/projects')
      setProjects(res.data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [token])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post<Project>('/projects', {
        ...formData,
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        end_date: formData.end_date || null
      })
      setProjects([...projects, res.data])
      setShowModal(false)
      setFormData({ name: '', description: '', status: 'planning', priority: 'medium', budget: 0, start_date: new Date().toISOString().split('T')[0], end_date: '' })
      setSuccess('Project created successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create project'
      setError(errorMessage)
    }
  }

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put<Project>(`/projects/${selectedProject.id}`, formData)
      setProjects(projects.map(p => p.id === res.data.id ? res.data : p))
      setShowEditModal(false)
      setSelectedProject(null)
      setSuccess('Project updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update project'
      setError(errorMessage)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/projects/${selectedProject.id}`)
      setProjects(projects.filter(p => p.id !== selectedProject.id))
      setShowDeleteModal(false)
      setSelectedProject(null)
      setSuccess('Project deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete project'
      setError(errorMessage)
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const res = await api.put<Project>(`/projects/${projectId}`, { status: newStatus as Project['status'] })
      setProjects(projects.map(p => p.id === res.data.id ? res.data : p))
      setSuccess('Project status updated!')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update status'
      setError(errorMessage)
    }
  }

  const openEditModal = (project: Project | KanbanItem) => {
    const projectData = project as Project
    setSelectedProject(projectData)
    setFormData({
      name: projectData.name,
      description: projectData.description || '',
      status: projectData.status as 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled',
      priority: projectData.priority as 'low' | 'medium' | 'high' | 'critical',
      budget: projectData.budget,
      start_date: projectData.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      end_date: projectData.end_date?.split('T')[0] || ''
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (project: Project | KanbanItem) => {
    setSelectedProject(project as Project)
    setShowDeleteModal(true)
  }

  const handleAddProject = (status: string) => {
    setFormData(prev => ({ ...prev, status: status as typeof prev.status }))
    setShowModal(true)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'badge-blue', active: 'badge-green', 'on-hold': 'badge-yellow',
      completed: 'badge-gray', cancelled: 'badge-red'
    }
    return styles[status] || 'badge-gray'
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red'
    }
    return styles[priority] || 'badge-gray'
  }

  // Convert projects to Kanban items
  const kanbanItems: KanbanItem[] = projects
    .filter(p => p.status !== 'cancelled')
    .map(project => ({
      id: project.id,
      title: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      due_date: project.end_date,
      budget: project.budget,
      progress: project.progress,
      start_date: project.start_date
    }))

  if (loading) return <div className="loading"><div className="loading-spinner"></div><span>Loading projects...</span></div>

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredKanbanItems = kanbanItems.filter(item => 
    filteredProjects.some(p => p.id === item.id)
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track all your projects</p>
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
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus />New Project</button>
        </div>
      </div>

      {error && <div className="auth-error mb-4"><AlertCircle />{error}</div>}
      {success && <div className="auth-success mb-4" style={{ background: 'var(--green-50)', color: 'var(--green-600)', padding: '12px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px' }}>{success}</div>}

      {viewMode === 'kanban' ? (
        <KanbanBoard
          columns={projectColumns}
          items={filteredKanbanItems}
          onStatusChange={handleStatusChange}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onAdd={handleAddProject}
          renderExtraContent={(item) => (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--gray-500)', marginBottom: '4px' }}>
                <DollarSign size={12} />
                <span>${(item.budget as number)?.toLocaleString() || 0}</span>
              </div>
              <div className="progress" style={{ height: '4px' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${(item.progress as number) || 0}%`,
                    background: (item.progress as number) >= 100 ? 'var(--success)' : undefined
                  }}
                />
              </div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '2px' }}>
                {(item.progress as number) || 0}% complete
              </div>
            </div>
          )}
        />
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="flex gap-2">
              <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '8px 12px', width: '240px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '13px' }} />
              <button className="btn btn-secondary btn-sm"><Filter />Filter</button>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead><tr><th>Project</th><th>Status</th><th>Priority</th><th>Budget</th><th>Progress</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}><div className="flex items-center justify-center gap-2 text-muted"><FolderKanban size={20} />No projects found</div></td></tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{project.name}</div>
                        <div className="text-sm text-muted truncate" style={{ maxWidth: '200px' }}>{project.description || 'No description'}</div>
                      </td>
                      <td><span className={`badge ${getStatusBadge(project.status)}`}>{project.status}</span></td>
                      <td><span className={`badge ${getPriorityBadge(project.priority)}`}>{project.priority}</span></td>
                      <td>${project.budget?.toLocaleString() || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress" style={{ width: '100px' }}><div className="progress-bar" style={{ width: `${project.progress || 0}%` }}></div></div>
                          <span className="text-sm">{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="table-action-btn" onClick={() => openEditModal(project)} title="Edit"><Edit size={16} /></button>
                          <button className="table-action-btn" onClick={() => { setSelectedProject(project); setShowDeleteModal(true); }} title="Delete" style={{ color: 'var(--red-500)' }}><Trash2 size={16} /></button>
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

      {/* Create Modal */}
      <Modal isOpen={showModal} title="Create New Project" onClose={() => setShowModal(false)}>
        <form onSubmit={handleCreateProject}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter project name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Project description" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Budget ($)</label>
            <input type="number" className="form-input" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })} placeholder="0" />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} title="Edit Project" onClose={() => { setShowEditModal(false); setSelectedProject(null); }}>
        <form onSubmit={handleEditProject}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter project name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Project description" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Budget ($)</label>
            <input type="number" className="form-input" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })} placeholder="0" />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedProject(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Project</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} title="Delete Project" onClose={() => { setShowDeleteModal(false); setSelectedProject(null); }}>
        <div className="text-center">
          <AlertCircle size={48} style={{ color: 'var(--red-500)', margin: '0 auto 16px' }} />
          <p style={{ marginBottom: '24px' }}>Are you sure you want to delete "<strong>{selectedProject?.name}</strong>"? This action cannot be undone.</p>
          <div className="flex gap-2 justify-center">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedProject(null); }}>Cancel</button>
            <button type="button" className="btn" style={{ background: 'var(--red-500)', color: 'white' }} onClick={handleDeleteProject}>Delete Project</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}