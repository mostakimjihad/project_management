import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { FolderKanban, CheckSquare, AlertTriangle, DollarSign, TrendingUp, ArrowUpRight, Clock, Users } from 'lucide-react'
import type { DashboardStats } from '../lib/types'
import api from '../lib/api'

interface DashboardProps {
  onNavigate?: (page: 'dashboard' | 'projects' | 'tasks' | 'teams') => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    api.get<DashboardStats>('/dashboard/stats')
      .then(res => {
        setStats(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch stats')
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's an overview of your projects.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Clock />
            Last 30 days
          </button>
          <button className="btn btn-primary">
            <ArrowUpRight />
            Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-error mb-4">
          <AlertTriangle />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FolderKanban />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Projects</div>
            <div className="stat-value">{stats?.projects?.total || 0}</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              {stats?.projects?.active || 0} active
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckSquare />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tasks Completed</div>
            <div className="stat-value">{stats?.tasks?.completed || 0}</div>
            <div className="stat-change">
              {stats?.tasks?.total || 0} total tasks
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <AlertTriangle />
          </div>
          <div className="stat-content">
            <div className="stat-label">High Risks</div>
            <div className="stat-value">{stats?.risks?.high || 0}</div>
            <div className="stat-change">
              {stats?.risks?.total || 0} total risks
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <DollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">${(stats?.costs?.total_spent || 0).toLocaleString()}</div>
            <div className="stat-change">
              This period
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Clock />
              </div>
              <h4 className="empty-state-title">No recent activity</h4>
              <p className="empty-state-text">Activity will appear here as you use the application.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => onNavigate?.('projects')}
              >
                <FolderKanban />
                <span>Create New Project</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => onNavigate?.('tasks')}
              >
                <CheckSquare />
                <span>Add New Task</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => onNavigate?.('teams')}
              >
                <Users />
                <span>Invite Team Member</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
