import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    try {
      await register({ name, email, password, phone: phone || undefined });
      navigate('/profile');
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Create an Account" description="Register for a customer account." noIndex={true} />

      <div className="container" style={{ maxWidth: '440px', marginTop: 'var(--space-8)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
          </CardHeader>
          <CardBody>
            {localError && (
              <Alert type="danger" title="Registration Failed">
                {localError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Full Name"
                type="text"
                id="register-name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />

              <Input
                label="Email Address"
                type="email"
                id="register-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                id="register-phone"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />

              <Input
                label="Password"
                type="password"
                id="register-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                helperText="Must be at least 8 characters with upper, lower, and number."
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                Create Account
              </Button>
            </form>
          </CardBody>
          <CardFooter style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>
            <span>Already have an account? </span>
            <Link to="/login">Sign In</Link>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

