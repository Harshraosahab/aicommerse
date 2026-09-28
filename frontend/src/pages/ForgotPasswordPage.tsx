import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { authApi } from '../services/authApi';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Forgot Password" description="Request a link to reset your account password." noIndex={true} />

      <div className="container" style={{ maxWidth: '440px', marginTop: 'var(--space-8)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
          </CardHeader>
          <CardBody>
            {error && (
              <Alert type="danger" title="Error">
                {error}
              </Alert>
            )}

            {submitted ? (
              <Alert type="success" title="Check your inbox">
                If an account with that email exists, we have sent instructions to reset your password.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                  Enter the email address associated with your account, and we will send you a link to reset your password.
                </p>

                <Input
                  label="Email Address"
                  type="email"
                  id="forgot-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                >
                  Send Reset Link
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
