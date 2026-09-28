import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi, AdminAuditLog } from '../services/adminApi';
import { ShieldCheck, RefreshCw, Eye } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);

  // Inspect Diff Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
        resource: resourceFilter || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalLogs(res.meta.total || res.data.length);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter, resourceFilter]);

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>CREATE</span>;
      case 'UPDATE':
      case 'PATCH':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1' }}>UPDATE</span>;
      case 'DELETE':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fee2e2', color: '#b91c1c' }}>DELETE</span>;
      case 'STATUS_CHANGE':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#b45309' }}>STATUS_CHANGE</span>;
      case 'STOCK_ADJUSTMENT':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f3e8ff', color: '#7e22ce' }}>STOCK_ADJUST</span>;
      case 'REFUND':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#ffedd5', color: '#c2410c' }}>REFUND</span>;
      default:
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>{action}</span>;
    }
  };

  return (
    <>
      <SEO title="Audit Logs | Admin" description="Traceable administrative actions and modifications log." />

      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={26} color="#0f766e" />
            Security & Audit Trail
          </h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Immutable administrative records with diffs, administrator identity, and rationale.
          </p>
        </div>
        <Button variant="secondary" onClick={loadAuditLogs} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          Refresh
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Action:</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="STATUS_CHANGE">STATUS_CHANGE</option>
                <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
                <option value="REFUND">REFUND</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Resource:</label>
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All Resources</option>
                <option value="PRODUCT">PRODUCT</option>
                <option value="ORDER">ORDER</option>
                <option value="USER">USER</option>
                <option value="INVENTORY">INVENTORY</option>
                <option value="COUPON">COUPON</option>
                <option value="REVIEW">REVIEW</option>
                <option value="CATEGORY">CATEGORY</option>
                <option value="BRAND">BRAND</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#64748b' }}>
              Showing {logs.length} of {totalLogs} events
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Querying audit trail from database...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No audit events logged"
              description="Zero administrative actions matched the filter criteria in the database."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Administrator</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Action</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Resource / Target</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Reason / Note</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const logId = log._id;
                    const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : '—';
                    const adminName = log.admin?.firstName ? `${log.admin.firstName} ${log.admin.lastName || ''}`.trim() : (log.admin?.email || log.adminId || 'System');

                    return (
                      <tr key={logId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8125rem' }}>
                          {dateStr}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{adminName}</div>
                          {log.admin?.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.admin.email}</div>}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {getActionBadge(log.action)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{log.resource}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', marginLeft: 'var(--space-2)' }}>
                            #{log.resourceId?.slice(-6) || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: '260px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: log.reason ? '#334155' : '#94a3b8' }}>
                            {log.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <Button size="sm" variant="secondary" onClick={() => setSelectedLog(log)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} />
                            View Diff
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', borderTop: '1px solid #e2e8f0' }}>
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                Page {page} of {totalPages}
              </span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Audit Event Inspection</h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  {selectedLog.action} on {selectedLog.resource} ({selectedLog.resourceId})
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)', backgroundColor: '#f8fafc', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Executed By</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {selectedLog.admin?.email || selectedLog.adminId || 'System'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Timestamp</div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IP Address</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{selectedLog.ipAddress || 'Internal'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reason</div>
                  <div style={{ fontSize: '0.875rem' }}>{selectedLog.reason || 'None specified'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.8125rem', fontWeight: 600, color: '#dc2626' }}>
                    Previous State (Before)
                  </h4>
                  <pre
                    style={{
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      fontSize: '0.75rem',
                      overflowX: 'auto',
                      maxHeight: '300px',
                      color: '#9f1239',
                    }}
                  >
                    {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : '(None)'}
                  </pre>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: '0.8125rem', fontWeight: 600, color: '#16a34a' }}>
                    Modified State (After)
                  </h4>
                  <pre
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3)',
                      fontSize: '0.75rem',
                      overflowX: 'auto',
                      maxHeight: '300px',
                      color: '#166534',
                    }}
                  >
                    {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : '(None)'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
