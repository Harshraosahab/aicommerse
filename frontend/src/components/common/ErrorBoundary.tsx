import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to frontend telemetry or console in dev
    console.error('ErrorBoundary caught an unhandled rendering exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              padding: 'var(--space-8)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
              Application Render Error
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
              An unexpected client-side error occurred while displaying this page. Our resilience layer safely intercepted the exception.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: 'var(--color-surface)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: 'var(--font-size-xs)',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: 'var(--space-6)',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <Button variant="primary" onClick={this.handleReset}>
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
