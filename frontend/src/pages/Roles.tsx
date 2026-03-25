import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shield, Key, Check } from 'lucide-react';
import { rolesApi, permissionsApi } from '../lib/api';
import Modal from '../components/ui/Modal';
import type { Role, RoleCreate, RoleUpdate, Permission, PermissionModules } from '../lib/types';

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  // Form state
  const [formData, setFormData] = useState<RoleCreate>({
    name: '',
    display_name: '',
    description: '',
    permission_ids: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        rolesApi.list(1, 100),
        permissionsApi.listByModule(),
      ]);
      setRoles(rolesRes.data.items);
      setPermissionsByModule(permissionsRes.data);
    } catch (err) {
      setError('Failed to load roles and permissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rolesApi.create(formData);
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    if (!selectedRole) return;
    e.preventDefault();
    try {
      const updateData: RoleUpdate = {
        display_name: formData.display_name,
        description: formData.description,
        permission_ids: formData.permission_ids,
      };
      await rolesApi.update(selectedRole.id, updateData);
      setIsEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await rolesApi.delete(roleId);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete role');
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permission_ids: role.permissions.map(p => p.id),
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permission_ids: [],
    });
    setSelectedRole(null);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: (prev.permission_ids || []).includes(permissionId)
        ? (prev.permission_ids || []).filter(id => id !== permissionId)
        : [...(prev.permission_ids || []), permissionId],
    }));
  };

  const toggleAllPermissions = (modulePermissions: Permission[], select: boolean) => {
    const moduleIds = modulePermissions.map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permission_ids: select
        ? [...new Set([...(prev.permission_ids || []), ...moduleIds])]
        : (prev.permission_ids || []).filter(id => !moduleIds.includes(id)),
    }));
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'create': return 'badge-green';
      case 'read': return 'badge-blue';
      case 'update': return 'badge-yellow';
      case 'delete': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>Loading roles and permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-subtitle">Manage roles and their permissions for access control</p>
        </div>
        <div className="page-actions">
          <button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Create Role
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: 'var(--danger-light)', border: 'none' }}>
          <div className="card-body" style={{ color: 'var(--danger)', padding: '16px 20px' }}>
            {error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('roles')}
          className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
        >
          <Shield size={14} style={{ marginRight: '6px' }} />
          Roles
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`tab ${activeTab === 'permissions' ? 'active' : ''}`}
        >
          <Key size={14} style={{ marginRight: '6px' }} />
          Permissions
        </button>
      </div>

      {activeTab === 'roles' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="stat-icon blue" style={{ width: '36px', height: '36px' }}>
                          <Shield size={16} />
                        </div>
                        <div>
                          <div className="font-medium">{role.display_name}</div>
                          <div className="text-xs text-muted">{role.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-muted" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        maxWidth: '250px'
                      }}>
                        {role.description || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {role.permissions.length} permissions
                      </span>
                    </td>
                    <td>
                      {role.is_system ? (
                        <span className="badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-500)' }}>
                          System
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          Custom
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="table-action-btn" 
                          onClick={() => openEditModal(role)}
                          title="Edit role"
                        >
                          <Pencil size={16} />
                        </button>
                        {!role.is_system && (
                          <button 
                            className="table-action-btn" 
                            onClick={() => handleDeleteRole(role.id)}
                            title="Delete role"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="text-muted">No roles found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          {permissionsByModule.map((module) => (
            <div key={module.module} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="stat-icon blue" style={{ width: '32px', height: '32px' }}>
                    <Key size={14} />
                  </div>
                  <h3 className="card-title" style={{ textTransform: 'capitalize' }}>
                    {module.module}
                  </h3>
                </div>
                <span className="badge badge-gray">
                  {module.permissions.length} permissions
                </span>
              </div>
              <div className="card-body">
                <div className="grid-3">
                  {module.permissions.map((permission) => (
                    <div 
                      key={permission.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'var(--gray-50)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--gray-200)'
                      }}
                    >
                      <div>
                        <div className="font-medium" style={{ fontSize: '13px' }}>
                          {permission.display_name}
                        </div>
                        <div className="text-xs text-muted">
                          {permission.name}
                        </div>
                      </div>
                      <span className={`badge ${getActionBadgeClass(permission.action)}`}>
                        {permission.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Role">
        <form onSubmit={handleCreateRole}>
          <div className="form-group">
            <label className="form-label">Role Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="form-input"
              placeholder="e.g., project_manager"
              required
            />
            <div className="text-xs text-muted mt-1">Use lowercase letters and underscores</div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="form-input"
              placeholder="e.g., Project Manager"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="Describe the purpose of this role..."
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Permissions</label>
            <div style={{ 
              maxHeight: '240px', 
              overflowY: 'auto', 
              border: '1px solid var(--gray-200)', 
              borderRadius: 'var(--radius)',
              padding: '12px'
            }}>
              {permissionsByModule.map((module) => (
                <div key={module.module} style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--gray-100)'
                  }}>
                    <span className="font-medium text-sm" style={{ textTransform: 'capitalize' }}>
                      {module.module}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(module.permissions, true)}
                        className="text-xs"
                        style={{ color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(module.permissions, false)}
                        className="text-xs text-muted"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {module.permissions.map((permission) => (
                      <label 
                        key={permission.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        className="hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permission_ids?.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          style={{ 
                            width: '14px', 
                            height: '14px',
                            accentColor: 'var(--accent-blue)'
                          }}
                        />
                        <span className="text-sm">{permission.display_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '0 -24px', padding: '16px 24px' }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              Create Role
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Role">
        <form onSubmit={handleUpdateRole}>
          <div className="form-group">
            <label className="form-label">Role Name</label>
            <input
              type="text"
              value={formData.name}
              disabled
              className="form-input"
              style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }}
            />
            {selectedRole?.is_system && (
              <div className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                This is a system role - only permissions can be modified
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="form-input"
              disabled={selectedRole?.is_system}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
              disabled={selectedRole?.is_system}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Permissions</label>
            <div style={{ 
              maxHeight: '240px', 
              overflowY: 'auto', 
              border: '1px solid var(--gray-200)', 
              borderRadius: 'var(--radius)',
              padding: '12px'
            }}>
              {permissionsByModule.map((module) => (
                <div key={module.module} style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--gray-100)'
                  }}>
                    <span className="font-medium text-sm" style={{ textTransform: 'capitalize' }}>
                      {module.module}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(module.permissions, true)}
                        className="text-xs"
                        style={{ color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(module.permissions, false)}
                        className="text-xs text-muted"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {module.permissions.map((permission) => (
                      <label 
                        key={permission.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.permission_ids?.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          style={{ 
                            width: '14px', 
                            height: '14px',
                            accentColor: 'var(--accent-blue)'
                          }}
                        />
                        <span className="text-sm">{permission.display_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '0 -24px', padding: '16px 24px' }}>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              Update Role
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}