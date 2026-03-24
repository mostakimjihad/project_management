import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { Plus, Users, AlertCircle, Trash2, Edit } from 'lucide-react'
import type { Team, PaginatedResponse } from '../lib/types'
import Modal from '../components/ui/Modal'
import api from '../lib/api'

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const fetchTeams = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<Team>>('/teams')
      setTeams(res.data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [token])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post<Team>('/teams', formData)
      setTeams([...teams, res.data])
      setShowModal(false)
      setFormData({ name: '', description: '' })
      setSuccess('Team created successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create team'
      setError(errorMessage)
    }
  }

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    setError(null)
    setSuccess(null)
    try {
      const res = await api.put<Team>(`/teams/${selectedTeam.id}`, formData)
      setTeams(teams.map(t => t.id === res.data.id ? res.data : t))
      setShowEditModal(false)
      setSelectedTeam(null)
      setSuccess('Team updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to update team'
      setError(errorMessage)
    }
  }

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return
    setError(null)
    setSuccess(null)
    try {
      await api.delete(`/teams/${selectedTeam.id}`)
      setTeams(teams.filter(t => t.id !== selectedTeam.id))
      setShowDeleteModal(false)
      setSelectedTeam(null)
      setSuccess('Team deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete team'
      setError(errorMessage)
    }
  }

  const openEditModal = (team: Team) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      description: team.description || ''
    })
    setShowEditModal(true)
  }

  if (loading) return <div className="loading"><div className="loading-spinner"></div><span>Loading teams...</span></div>

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">Manage your teams and members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus />New Team</button>
      </div>

      {error && <div className="auth-error mb-4"><AlertCircle />{error}</div>}
      {success && <div className="auth-success mb-4" style={{ background: 'var(--green-50)', color: 'var(--green-600)', padding: '12px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px' }}>{success}</div>}

      <div className="card">
        <div className="card-header">
          <input type="text" placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '8px 12px', width: '240px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '13px' }} />
        </div>

        <div className="table-container">
          <table className="table">
            <thead><tr><th>Team</th><th>Members</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredTeams.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}><div className="flex items-center justify-center gap-2 text-muted"><Users size={20} />No teams found</div></td></tr>
              ) : (
                filteredTeams.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{team.name}</div>
                      <div className="text-sm text-muted">{team.description || 'No description'}</div>
                    </td>
                    <td>{team.member_count || 0} members</td>
                    <td>{team.created_at ? new Date(team.created_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="table-action-btn" onClick={() => openEditModal(team)} title="Edit"><Edit size={16} /></button>
                        <button className="table-action-btn" onClick={() => { setSelectedTeam(team); setShowDeleteModal(true); }} title="Delete" style={{ color: 'var(--red-500)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} title="Create New Team" onClose={() => setShowModal(false)}>
        <form onSubmit={handleCreateTeam}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter team name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Team description" />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Team</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} title="Edit Team" onClose={() => { setShowEditModal(false); setSelectedTeam(null); }}>
        <form onSubmit={handleEditTeam}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter team name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Team description" />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedTeam(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Team</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} title="Delete Team" onClose={() => { setShowDeleteModal(false); setSelectedTeam(null); }}>
        <div className="text-center">
          <AlertCircle size={48} style={{ color: 'var(--red-500)', margin: '0 auto 16px' }} />
          <p style={{ marginBottom: '24px' }}>Are you sure you want to delete "<strong>{selectedTeam?.name}</strong>"? This action cannot be undone.</p>
          <div className="flex gap-2 justify-center">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedTeam(null); }}>Cancel</button>
            <button type="button" className="btn" style={{ background: 'var(--red-500)', color: 'white' }} onClick={handleDeleteTeam}>Delete Team</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}