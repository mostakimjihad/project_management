import { useState } from 'react'
import { useAuth } from './lib/auth/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Teams from './pages/Teams'
import Roles from './pages/Roles'
import UserApproval from './pages/UserApproval'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'

export type Page = 'dashboard' | 'projects' | 'tasks' | 'teams' | 'risks' | 'costs' | 'roles' | 'user-approval'

function AppLayout() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const { logout } = useAuth()

  const navigateTo = (page: Page) => setCurrentPage(page)

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return { title: 'Dashboard', subtitle: 'Welcome back! Here\'s an overview.' }
      case 'projects': return { title: 'Projects', subtitle: 'Manage and track all your projects' }
      case 'tasks': return { title: 'Tasks', subtitle: 'Manage and track all your tasks' }
      case 'teams': return { title: 'Teams', subtitle: 'Manage your teams and members' }
      case 'risks': return { title: 'Risks', subtitle: 'Monitor and mitigate risks' }
      case 'costs': return { title: 'Costs', subtitle: 'Track project expenses' }
      case 'roles': return { title: 'Roles & Permissions', subtitle: 'Manage roles and access control' }
      case 'user-approval': return { title: 'User Approval', subtitle: 'Review pending user registrations' }
      default: return { title: 'Dashboard', subtitle: '' }
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={navigateTo} />
      case 'projects': return <Projects />
      case 'tasks': return <Tasks />
      case 'teams': return <Teams />
      case 'risks': return <div className="card"><div className="card-body"><p className="text-muted">Risk management coming soon...</p></div></div>
      case 'costs': return <div className="card"><div className="card-body"><p className="text-muted">Cost tracking coming soon...</p></div></div>
      case 'roles': return <Roles />
      case 'user-approval': return <UserApproval />
      default: return <Dashboard onNavigate={navigateTo} />
    }
  }

  const pageInfo = getPageTitle()

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={logout} />
      <div className="main-content">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function App() {
  const { token, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(true)

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <span>Loading...</span>
      </div>
    )
  }

  if (!token) {
    return showLogin ? (
      <Login onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <Register onSwitchToLogin={() => setShowLogin(true)} />
    )
  }

  return <AppLayout />
}

export default App