import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { Plus, Users, AlertCircle, Trash2, Edit, UserPlus, X, ChevronDown, ChevronRight, Search, Crown, User as UserIcon, Mail } from 'lucide-react'
import type { Team, TeamMember, User, PaginatedResponse } from '../lib/types'
import Modal from '../components/ui/Modal'
import api from '../lib/api'

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const { token } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const [newTeamMembers, setNewTeamMembers] = useState<{ user_id: string; role: string }[]>([])

  const [memberFormData, setMemberFormData] = useState({
    user_id: '',
    role: 'member'
  })

  const [userSearchQuery, setUserSearchQuery] = useState('')

  const fetchTeams = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<Team>>('/teams')
      setTeams(res.data.items || [])
      
      // Fetch members for each team
      for (const team of res.data.items || []) {
        await fetchTeamMembers(team.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const res = await api.get<TeamMember[]>(`/teams/${teamId}/members`)
      setTeamMembers(prev => ({ ...prev, [teamId]: res.data }))
    } catch (err) {
      console.error(`Failed to fetch members for team ${teamId}:`, err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get<PaginatedResponse<User>>('/roles/users/pending?status_filter=all&limit=100')
      // Filter only approved users
      const approvedUsers = (res.data.items || []).filter(u => u.approval_status === 'approved')
      setUsers(approvedUsers)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [token])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post<Team>('/teams', formData)
      const newTeam = res.data
      
      // Add members to the new team
      for (const member of newTeamMembers) {
        await api.post(`/teams/${newTeam.id}/members`, {
          user_id: member.user_id,
          role: member.role
        })
      }
      
      setTeams([...teams, newTeam])
      await fetchTeamMembers(newTeam.id)
      setShowModal(false)
      setFormData({ name: '', description: '' })
      setNewTeamMembers([])
      setSuccess('Team created successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to create team'
      setError(errorMessage)
    }
  }

  const addMemberToNewTeam = () => {
    if (!memberFormData.user_id) return
    const existingIds = new Set(newTeamMembers.map(m => m.user_id))
    if (existingIds.has(memberFormData.user_id)) return
    setNewTeamMembers([...newTeamMembers, { ...memberFormData }])
    setMemberFormData({ user_id: '', role: 'member' })
  }

  const removeMemberFromNewTeam = (userId: string) => {
    setNewTeamMembers(newTeamMembers.filter(m => m.user_id !== userId))
  }

  const getAvailableUsersForNewTeam = () => {
    const selectedIds = new Set(newTeamMembers.map(m => m.user_id))
    return users.filter(u => !selectedIds.has(u.id))
  }

  const getFilteredAvailableUsers = () => {
    const available = getAvailableUsersForNewTeam()
    if (!userSearchQuery.trim()) return available
    const query = userSearchQuery.toLowerCase()
    return available.filter(u => 
      u.full_name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    )
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    setError(null)
    setSuccess(null)
    try {
      await api.post(`/teams/${selectedTeam.id}/members`, memberFormData)
      await fetchTeamMembers(selectedTeam.id)
      setShowMemberModal(false)
      setMemberFormData({ user_id: '', role: 'member' })
      setSuccess('Member added successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to add member'
      setError(errorMessage)
    }
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      await fetchTeamMembers(teamId)
      setSuccess('Member removed successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to remove member'
      setError(errorMessage)
    }
  }

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
      } else {
        newSet.add(teamId)
      }
      return newSet
    })
  }

  const openEditModal = (team: Team) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      description: team.description || ''
    })
    setShowEditModal(true)
  }

  const openMemberModal = (team: Team) => {
    setSelectedTeam(team)
    setMemberFormData({ user_id: '', role: 'member' })
    setShowMemberModal(true)
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.full_name : userId
  }

  const getAvailableUsers = () => {
    if (!selectedTeam) return []
    const currentMemberIds = new Set((teamMembers[selectedTeam.id] || []).map(m => m.user_id))
    return users.filter(u => !currentMemberIds.has(u.id))
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
            <thead><tr><th style={{ width: '40px' }}></th><th>Team</th><th>Members</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredTeams.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}><div className="flex items-center justify-center gap-2 text-muted"><Users size={20} />No teams found</div></td></tr>
              ) : (
                filteredTeams.map((team) => {
                  const isExpanded = expandedTeams.has(team.id)
                  const members = teamMembers[team.id] || []
                  
                  return (
                    <>
                      <tr key={team.id}>
                        <td>
                          <button 
                            onClick={() => toggleTeamExpansion(team.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{team.name}</div>
                          <div className="text-sm text-muted">{team.description || 'No description'}</div>
                        </td>
                        <td>{members.length} members</td>
                        <td>{team.created_at ? new Date(team.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="table-action-btn" onClick={() => openMemberModal(team)} title="Add Member"><UserPlus size={16} /></button>
                            <button className="table-action-btn" onClick={() => openEditModal(team)} title="Edit"><Edit size={16} /></button>
                            <button className="table-action-btn" onClick={() => { setSelectedTeam(team); setShowDeleteModal(true); }} title="Delete" style={{ color: 'var(--red-500)' }}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && members.length > 0 && (
                        <tr key={`${team.id}-members`}>
                          <td colSpan={5} style={{ padding: '0', background: 'var(--gray-50)' }}>
                            <div style={{ padding: '12px 16px 12px 48px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--gray-500)', marginBottom: '8px' }}>TEAM MEMBERS</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {members.map((member) => (
                                  <div 
                                    key={member.id}
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      background: 'white',
                                      border: '1px solid var(--gray-200)',
                                      borderRadius: 'var(--radius)',
                                      padding: '6px 10px',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <div style={{ 
                                      width: '28px', 
                                      height: '28px', 
                                      borderRadius: '50%', 
                                      background: 'var(--primary)',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '11px',
                                      fontWeight: 500
                                    }}>
                                      {getUserName(member.user_id).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 500 }}>{getUserName(member.user_id)}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'capitalize' }}>{member.role}</div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveMember(team.id, member.user_id)}
                                      style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        cursor: 'pointer',
                                        color: 'var(--gray-400)',
                                        padding: '2px',
                                        marginLeft: '4px'
                                      }}
                                      title="Remove member"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Team Modal */}
      <Modal isOpen={showModal} title="Create New Team" onClose={() => { setShowModal(false); setNewTeamMembers([]); setUserSearchQuery(''); }}>
        <form onSubmit={handleCreateTeam}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter team name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the team's purpose" rows={2} />
          </div>
          
          {/* Enhanced Add Members Section */}
          <div className="form-group" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Team Members</label>
              {newTeamMembers.length > 0 && (
                <span style={{ 
                  fontSize: '12px', 
                  color: 'var(--gray-500)',
                  background: 'var(--gray-100)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {newTeamMembers.length} member{newTeamMembers.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            
            {/* Selected Members - Enhanced Cards */}
            {newTeamMembers.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '10px', 
                marginBottom: '16px',
                padding: '12px',
                background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--gray-200)'
              }}>
                {newTeamMembers.map((member) => {
                  const user = users.find(u => u.id === member.user_id)
                  const isLead = member.role === 'lead'
                  return (
                    <div 
                      key={member.user_id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        background: 'white',
                        border: `1px solid ${isLead ? 'var(--accent-blue)' : 'var(--gray-200)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 12px',
                        fontSize: '13px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all var(--transition-fast)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = 'var(--shadow)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                      }}
                    >
                      {/* Avatar with role indicator */}
                      <div style={{ position: 'relative' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: isLead 
                            ? 'linear-gradient(135deg, var(--accent-blue) 0%, var(--primary-500) 100%)'
                            : 'linear-gradient(135deg, var(--gray-400) 0%, var(--gray-500) 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {getUserInitials(user?.full_name || '?')}
                        </div>
                        {isLead && (
                          <div style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: '14px',
                            height: '14px',
                            background: 'var(--warning)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                          }}>
                            <Crown size={8} style={{ color: 'white' }} />
                          </div>
                        )}
                      </div>
                      
                      {/* User info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '13px' }}>{user?.full_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isLead ? (
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 600,
                              color: 'var(--accent-blue)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Team Lead
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: '10px', 
                              color: 'var(--gray-500)',
                              textTransform: 'capitalize'
                            }}>
                              Member
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeMemberFromNewTeam(member.user_id)}
                        style={{ 
                          background: 'var(--gray-100)', 
                          border: 'none', 
                          cursor: 'pointer',
                          color: 'var(--gray-400)',
                          padding: '4px',
                          borderRadius: 'var(--radius-sm)',
                          marginLeft: '4px',
                          transition: 'all var(--transition-fast)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove member"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--danger-light)'
                          e.currentTarget.style.color = 'var(--danger)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--gray-100)'
                          e.currentTarget.style.color = 'var(--gray-400)'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Add New Member - Enhanced UI */}
            <div style={{ 
              background: 'white',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}>
              {/* Search Input */}
              <div style={{ 
                padding: '12px', 
                borderBottom: '1px solid var(--gray-100)',
                background: 'var(--gray-50)'
              }}>
                <div style={{ 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search size={16} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    color: 'var(--gray-400)' 
                  }} />
                  <input 
                    type="text"
                    placeholder="Search users by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      fontSize: '13px',
                      background: 'white',
                      transition: 'all var(--transition-fast)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-blue)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--gray-200)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              {/* User List */}
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                padding: '8px'
              }}>
                {getFilteredAvailableUsers().length === 0 ? (
                  <div style={{ 
                    padding: '24px', 
                    textAlign: 'center', 
                    color: 'var(--gray-400)',
                    fontSize: '13px'
                  }}>
                    <UserIcon size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div>{userSearchQuery ? 'No users match your search' : 'No available users'}</div>
                  </div>
                ) : (
                  getFilteredAvailableUsers().slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setMemberFormData({ ...memberFormData, user_id: user.id })
                        setUserSearchQuery('')
                      }}
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        background: memberFormData.user_id === user.id ? 'var(--info-light)' : 'transparent',
                        border: memberFormData.user_id === user.id ? '1px solid var(--accent-blue)' : '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (memberFormData.user_id !== user.id) {
                          e.currentTarget.style.background = 'var(--gray-50)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (memberFormData.user_id !== user.id) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {getUserInitials(user.full_name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 500, 
                          color: 'var(--gray-800)',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {user.full_name}
                        </div>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px', 
                          color: 'var(--gray-500)'
                        }}>
                          <Mail size={12} />
                          <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {user.email}
                          </span>
                        </div>
                      </div>
                      {memberFormData.user_id === user.id && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: 'var(--accent-blue)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {getFilteredAvailableUsers().length > 5 && (
                  <div style={{ 
                    padding: '8px 12px', 
                    fontSize: '12px', 
                    color: 'var(--gray-500)',
                    textAlign: 'center',
                    borderTop: '1px solid var(--gray-100)',
                    marginTop: '4px'
                  }}>
                    +{getFilteredAvailableUsers().length - 5} more users. Type to search...
                  </div>
                )}
              </div>
              
              {/* Role Selection and Add Button */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                padding: '12px',
                borderTop: '1px solid var(--gray-100)',
                background: 'var(--gray-50)'
              }}>
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Role:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setMemberFormData({ ...memberFormData, role: 'member' })}
                      style={{ 
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: memberFormData.role === 'member' ? 'var(--accent-blue)' : 'var(--gray-300)',
                        borderRadius: 'var(--radius)',
                        background: memberFormData.role === 'member' ? 'var(--accent-blue)' : 'white',
                        color: memberFormData.role === 'member' ? 'white' : 'var(--gray-600)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <UserIcon size={12} />
                      Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberFormData({ ...memberFormData, role: 'lead' })}
                      style={{ 
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: memberFormData.role === 'lead' ? 'var(--warning)' : 'var(--gray-300)',
                        borderRadius: 'var(--radius)',
                        background: memberFormData.role === 'lead' ? 'var(--warning)' : 'white',
                        color: memberFormData.role === 'lead' ? 'white' : 'var(--gray-600)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Crown size={12} />
                      Team Lead
                    </button>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={addMemberToNewTeam}
                  disabled={!memberFormData.user_id}
                  style={{ 
                    padding: '8px 16px',
                    opacity: memberFormData.user_id ? 1 : 0.5
                  }}
                >
                  <Plus size={16} />
                  Add Member
                </button>
              </div>
            </div>
            
            {/* Helper text */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px', 
              color: 'var(--gray-500)', 
              marginTop: '8px',
              padding: '8px 12px',
              background: 'var(--info-light)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--accent-blue)'
            }}>
              <Users size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
              <span>Search and select team members. Assign <strong>Team Lead</strong> role to members who will manage this team.</span>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-6" style={{ paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setNewTeamMembers([]); setUserSearchQuery(''); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              Create Team
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
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

      {/* Delete Team Modal */}
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

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} title={`Add Member to ${selectedTeam?.name}`} onClose={() => { setShowMemberModal(false); setSelectedTeam(null); }}>
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select 
              className="form-input" 
              value={memberFormData.user_id} 
              onChange={(e) => setMemberFormData({ ...memberFormData, user_id: e.target.value })}
              required
            >
              <option value="">Choose a user...</option>
              {getAvailableUsers().map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
            {getAvailableUsers().length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>
                No available users to add. All users are already in this team.
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select 
              className="form-input" 
              value={memberFormData.role} 
              onChange={(e) => setMemberFormData({ ...memberFormData, role: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="lead">Team Lead</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="btn btn-secondary" onClick={() => { setShowMemberModal(false); setSelectedTeam(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={getAvailableUsers().length === 0}>Add Member</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}