import { useState } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { LayoutDashboard, Shield, Users, BarChart3, AlertCircle } from 'lucide-react'

interface RegisterProps {
  onSwitchToLogin: () => void
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, fullName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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
        
        <h2>Start your journey with us</h2>
        <p>
          Join thousands of teams who trust ProjectHub to manage their projects, 
          collaborate effectively, and deliver exceptional results.
        </p>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Shield />
            </div>
            <span>Enterprise-grade security</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Users />
            </div>
            <span>Unlimited team members</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <BarChart3 />
            </div>
            <span>Advanced project analytics</span>
          </div>
        </div>
      </div>

      {/* Main Register Form */}
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Create account</h1>
            <p className="auth-card-subtitle">Get started with your free account</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

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
                placeholder="Create a strong password"
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}