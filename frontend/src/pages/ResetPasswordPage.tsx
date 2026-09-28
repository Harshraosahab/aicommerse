import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing password reset token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(token, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Reset Password" description="Create a new password for your account." noIndex={true} />

      <div className="container" style={{ maxWidth: '440px', marginTop: 'var(--space-8)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
          </CardHeader>
          <CardBody>
            {error && (
              <Alert type="danger" title="Reset Failed">
                {error}
              </Alert>
            )}

            {success ? (
              <Alert type="success" title="Success!">
                Your password has been reset. Redirecting to your profile...
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <Input
                  label="New Password"
                  type="password"
                  id="reset-new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  helperText="Must be at least 8 characters with numbers and letters."
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  id="reset-confirm-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                >
                  Reset Password
                </Button>
              </form>
            )}
          </CardBody>
          <CardFooter style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
            <Link to="/login">← Back to Sign In</Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};
