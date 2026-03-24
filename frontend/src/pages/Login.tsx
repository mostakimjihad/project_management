import { useState } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { LayoutDashboard, Shield, Users, BarChart3, AlertCircle } from 'lucide-react'

interface LoginProps {
  onSwitchToRegister: () => void
}

export default function Login({ onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Sidebar */}
      <div className="auth-sidebar">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <LayoutDashboard />
          </div>
          <span className="auth-brand-name">ProjectHub</span>
        </div>
        
        <h2>Manage your projects with precision</h2>
        <p>
          Streamline your workflow, track progress, and deliver projects on time 
          with our comprehensive project management solution.
        </p>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Shield />
            </div>
            <span>Secure role-based access control</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Users />
            </div>
            <span>Team collaboration tools</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <BarChart3 />
            </div>
            <span>Real-time analytics & reporting</span>
          </div>
        </div>
      </div>

      {/* Main Login Form */}
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-subtitle">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}