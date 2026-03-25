import { useState, useEffect } from 'react';
import { Check, X, Mail, Briefcase, Building2, Clock, User, Filter } from 'lucide-react';
import { rolesApi } from '../lib/api';
import Modal from '../components/ui/Modal';
import type { UserPending, UserApproval, UserRole } from '../lib/types';

export default function UserApproval() {
  const [pendingUsers, setPendingUsers] = useState<UserPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPending | null>(null);
  
  // Form state
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingUsers();
  }, [statusFilter]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await rolesApi.getPendingUsers(1, 50, statusFilter);
      setPendingUsers(response.data.items);
    } catch (err) {
      setError('Failed to load pending users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (user: UserPending) => {
    setSelectedUser(user);
    setSelectedRole('member');
    setIsApproveModalOpen(true);
  };

  const openRejectModal = (user: UserPending) => {
    setSelectedUser(user);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    try {
      const approvalData: UserApproval = {
        approve: true,
        role: selectedRole,
      };
      await rolesApi.approveUser(selectedUser.id, approvalData);
      setSuccess(`User "${selectedUser.full_name}" has been approved successfully.`);
      setIsApproveModalOpen(false);
      fetchPendingUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve user');
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    try {
      const approvalData: UserApproval = {
        approve: false,
        rejection_reason: rejectionReason,
      };
      await rolesApi.approveUser(selectedUser.id, approvalData);
      setSuccess(`User "${selectedUser.full_name}" has been rejected.`);
      setIsRejectModalOpen(false);
      fetchPendingUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow">Pending</span>;
      case 'approved':
        return <span className="badge badge-green">Approved</span>;
      case 'rejected':
        return <span className="badge badge-red">Rejected</span>;
      default:
        return null;
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Full system access';
      case 'manager': return 'Manage projects and teams';
      case 'member': return 'Basic team access';
      default: return '';
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>Loading pending users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">User Approval</h1>
          <p className="page-subtitle">Review and approve pending user registrations</p>
        </div>
        <div className="page-actions">
          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'pending' | 'all')}
              className="form-select"
              style={{ paddingLeft: '32px', minWidth: '150px' }}
            >
              <option value="pending">Pending Only</option>
              <option value="all">All Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="card" style={{ background: 'var(--danger-light)', border: 'none' }}>
          <div className="card-body" style={{ color: 'var(--danger)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={16} />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="card" style={{ background: 'var(--success-light)', border: 'none' }}>
          <div className="card-body" style={{ color: 'var(--success)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            {success}
          </div>
        </div>
      )}

      {/* User List */}
      {pendingUsers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <User size={32} />
            </div>
            <h3 className="empty-state-title">No pending users</h3>
            <p className="empty-state-text">
              {statusFilter === 'pending' 
                ? 'All user registrations have been processed.'
                : 'No users found matching the current filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div 
                          className="stat-icon blue"
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            fontSize: '14px'
                          }}
                        >
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
                            {user.job_title && (
                              <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Briefcase size={12} />
                                {user.job_title}
                              </span>
                            )}
                            {user.department && (
                              <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building2 size={12} />
                                {user.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} style={{ color: 'var(--gray-400)' }} />
                        {user.email}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(user.approval_status)}
                    </td>
                    <td>
                      {user.approval_status === 'pending' ? (
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => openApproveModal(user)}
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => openRejectModal(user)}
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve User">
        <div>
          {selectedUser && (
            <div style={{ 
              background: 'var(--gray-50)', 
              padding: '16px', 
              borderRadius: 'var(--radius)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  className="stat-icon blue"
                  style={{ width: '44px', height: '44px', fontSize: '16px' }}
                >
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{selectedUser.full_name}</div>
                  <div className="text-sm text-muted">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Assign Role</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['member', 'manager', 'admin'] as UserRole[]).map((role) => (
                <label 
                  key={role} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px',
                    border: `2px solid ${selectedRole === role ? 'var(--accent-blue)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: selectedRole === role ? 'var(--info-light)' : 'var(--white)'
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      accentColor: 'var(--accent-blue)'
                    }}
                  />
                  <div style={{ marginLeft: '12px' }}>
                    <span className="font-medium" style={{ textTransform: 'capitalize' }}>{role}</span>
                    <span className="text-xs text-muted" style={{ marginLeft: '8px' }}>
                      ({getRoleDescription(role)})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '0 -24px', padding: '16px 24px' }}>
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="btn btn-primary"
              style={{ background: 'var(--success)' }}
            >
              <Check size={16} />
              Approve User
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject User">
        <div>
          {selectedUser && (
            <div style={{ 
              background: 'var(--gray-50)', 
              padding: '16px', 
              borderRadius: 'var(--radius)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  className="stat-icon blue"
                  style={{ width: '44px', height: '44px', fontSize: '16px' }}
                >
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{selectedUser.full_name}</div>
                  <div className="text-sm text-muted">{selectedUser.email}</div>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="form-textarea"
              rows={4}
              placeholder="Please provide a reason for rejecting this user registration..."
              required
            />
            <div className="text-xs text-muted mt-1">
              This reason will be shown to the user when they try to log in.
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '0 -24px', padding: '16px 24px' }}>
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="btn btn-danger"
            >
              <X size={16} />
              Reject User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}