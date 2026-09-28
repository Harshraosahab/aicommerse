import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi, AdminUser } from '../services/adminApi';
import { useAuth } from '../context/AuthContext';
import { Search, UserCheck, UserX, Shield, Eye } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // User Detail Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState<{ user: AdminUser; orderSummary: any } | null>(null);

  // Role Edit Modal State
  const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('USER');
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleToggleStatus = async (u: AdminUser) => {
    const action = u.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} account for ${u.name}?`)) return;

    try {
      await adminApi.updateUserStatus(u._id, !u.isActive);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const openUserDetail = async (id: string) => {
    try {
      const res = await adminApi.getUserById(id);
      if (res.success && res.data) {
        setSelectedUserDetail(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to retrieve user details');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleUser) return;

    try {
      setIsUpdatingRole(true);
      await adminApi.updateUserRole(editingRoleUser._id, selectedRole);
      setEditingRoleUser(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const isSuperAdmin = currentAdmin?.role === 'SUPER_ADMIN' || currentAdmin?.role === 'ADMIN';

  return (
    <>
      <SEO title="User Management | Admin" description="Customer and administrative account administration." />

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Customer & Staff Account Management</h1>
        <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
          Review registered customer accounts, manage security statuses, and configure administrative RBAC permissions.
        </p>
      </div>

      {/* Toolbar */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-4)',
                  paddingLeft: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Roles</option>
              <option value="USER">Customer (USER)</option>
              <option value="ADMIN">Administrator (ADMIN)</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
              <option value="PRODUCT_MANAGER">Product Manager</option>
              <option value="ORDER_MANAGER">Order Manager</option>
              <option value="SUPPORT_MANAGER">Support Manager</option>
              <option value="MARKETING_MANAGER">Marketing Manager</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading users...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No registered user records match your search criteria."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>User</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Registered</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                        {u.name}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#475569' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span className={`badge ${u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'badge-primary' : 'badge-neutral'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {u.isActive ? (
                          <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <UserCheck size={14} /> Active
                          </span>
                        ) : (
                          <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <UserX size={14} /> Deactivated
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#64748b' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                          <button
                            onClick={() => openUserDetail(u._id)}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                            title="View Profile & Orders"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setEditingRoleUser(u);
                                setSelectedRole(u.role);
                              }}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                              title="Assign Role"
                            >
                              <Shield size={13} />
                              <span>Role</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleStatus(u)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: u.isActive ? '1px solid #fee2e2' : '1px solid #dcfce7',
                              backgroundColor: '#fff',
                              color: u.isActive ? '#dc2626' : '#16a34a',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            {u.isActive ? 'Block' : 'Unblock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-2)' }}>
              <h3 style={{ margin: 0 }}>Customer Profile</h3>
              <button onClick={() => setSelectedUserDetail(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
              <div><strong>Name:</strong> {selectedUserDetail.user.name}</div>
              <div><strong>Email:</strong> {selectedUserDetail.user.email}</div>
              <div><strong>Role:</strong> {selectedUserDetail.user.role}</div>
              <div><strong>Status:</strong> {selectedUserDetail.user.isActive ? 'Active' : 'Deactivated'}</div>
              <div><strong>Email Verified:</strong> {selectedUserDetail.user.emailVerified ? 'Yes' : 'No'}</div>
              <div><strong>Member Since:</strong> {new Date(selectedUserDetail.user.createdAt).toLocaleDateString()}</div>

              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>Purchase Activity:</div>
                <div>Total Completed Orders: <strong>{selectedUserDetail.orderSummary.totalOrders}</strong></div>
                <div>Lifetime Spend: <strong>{formatCurrency(selectedUserDetail.orderSummary.totalSpent)}</strong></div>
                <div>Last Order: {selectedUserDetail.orderSummary.lastOrderDate ? new Date(selectedUserDetail.orderSummary.lastOrderDate).toLocaleDateString() : 'None'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button variant="secondary" onClick={() => setSelectedUserDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {editingRoleUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '420px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>Assign Administrative Role</h3>
            <p style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: '#64748b' }}>
              Configure privileges for {editingRoleUser.name} ({editingRoleUser.email}).
            </p>

            <form onSubmit={handleRoleSubmit}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '6px' }}>
                  Select Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: '#fff' }}
                >
                  <option value="USER">Customer (USER)</option>
                  <option value="ADMIN">Full Administrator (ADMIN)</option>
                  <option value="SUPER_ADMIN">Super Administrator (SUPER_ADMIN)</option>
                  <option value="PRODUCT_MANAGER">Product Manager</option>
                  <option value="ORDER_MANAGER">Order Manager</option>
                  <option value="SUPPORT_MANAGER">Support Manager</option>
                  <option value="MARKETING_MANAGER">Marketing Manager</option>
                  <option value="MODERATOR">Content Moderator</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button variant="secondary" type="button" onClick={() => setEditingRoleUser(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isUpdatingRole}>
                  {isUpdatingRole ? 'Updating...' : 'Save Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
