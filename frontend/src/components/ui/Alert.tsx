import React from 'react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  return (
    <div
      className={`alert alert-${type} ${className}`.trim()}
      role={type === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'inherit', padding: '0 var(--space-1)', cursor: 'pointer' }}
          aria-label="Dismiss alert"
        >
          &#x2715;
        </button>
      )}
    </div>
  );
};
