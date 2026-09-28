import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    try {
      await login({ email, password });
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Sign In" description="Sign in to your customer account." noIndex={true} />

      <div className="container" style={{ maxWidth: '440px', marginTop: 'var(--space-8)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardBody>
            {localError && (
              <Alert type="danger" title="Sign In Failed">
                {localError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Email Address"
                type="email"
                id="login-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                id="login-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
                <Link to="/forgot-password" style={{ fontSize: 'var(--font-size-sm)' }}>
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                Sign In
              </Button>
            </form>
          </CardBody>
          <CardFooter style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
            <span>Don&apos;t have an account? </span>
            <Link to="/register">Create an account</Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

