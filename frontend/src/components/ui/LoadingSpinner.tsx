import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
}) => {
  const sizeStyles: Record<string, { width: string; height: string; borderWidth: string }> = {
    sm: { width: '1rem', height: '1rem', borderWidth: '2px' },
    md: { width: '1.75rem', height: '1.75rem', borderWidth: '2px' },
    lg: { width: '2.5rem', height: '2.5rem', borderWidth: '3px' },
  };

  return (
    <div
      role="status"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
    >
      <span className="spinner" style={sizeStyles[size]} aria-hidden="true" />
      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  );
};
