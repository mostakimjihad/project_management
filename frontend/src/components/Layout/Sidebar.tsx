import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  DollarSign,
  LogOut
} from 'lucide-react'

type PageType = 'dashboard' | 'projects' | 'tasks' | 'teams' | 'risks' | 'costs'

interface SidebarProps {
  currentPage: PageType
  onNavigate: (page: PageType) => void
  onLogout: () => void
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const navItems: { id: PageType; label: string; icon: React.ComponentType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
    { id: 'costs', label: 'Costs', icon: DollarSign },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <LayoutDashboard />
        </div>
        <span className="sidebar-title">ProjectHub</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" onClick={onLogout}>
          <LogOut />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  )
}