import { Search, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/auth/AuthContext'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="header-icon-btn">
          <Bell />
          <span className="badge"></span>
        </button>

        <div 
          className="user-menu" 
          onClick={logout}
          style={{ cursor: 'pointer' }}
          title="Click to logout"
        >
          <div className="user-avatar">
            {user?.full_name ? getInitials(user.full_name) : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.full_name || 'User'}</span>
            <span className="user-role">{user?.role || 'Member'}</span>
          </div>
          <LogOut size={16} style={{ marginLeft: 8, color: 'var(--gray-400)' }} />
        </div>
      </div>
    </header>
  )
}