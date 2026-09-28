import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { authApi, IUserAddress } from '../services/authApi';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile update state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Address state
  const [addresses, setAddresses] = useState<IUserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await authApi.getAddresses();
      if (res.success && res.data?.addresses) {
        setAddresses(res.data.addresses);
      }
    } catch (err: any) {
      setAddressError(err.message || 'Failed to load addresses');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      await authApi.updateProfile({ name, phone });
      await refreshUser();
      setProfileMessage('Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Password changed successfully.');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetAddressForm = () => {
    setStreet('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('United States');
    setIsDefault(false);
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !state || !postalCode || !country) {
      setAddressError('All address fields are required.');
      return;
    }

    setAddressLoading(true);
    setAddressError(null);
    try {
      if (editingAddressId) {
        const res = await authApi.updateAddress(editingAddressId, {
          street,
          city,
          state,
          postalCode,
          country,
          isDefault,
        });
        if (res.data?.addresses) setAddresses(res.data.addresses);
      } else {
        const res = await authApi.addAddress({
          street,
          city,
          state,
          postalCode,
          country,
          isDefault,
        });
        if (res.data?.addresses) setAddresses(res.data.addresses);
      }
      resetAddressForm();
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleEditAddress = (addr: IUserAddress) => {
    setStreet(addr.street);
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setIsDefault(addr.isDefault);
    setEditingAddressId(addr._id || null);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this address?')) return;

    setAddressLoading(true);
    try {
      const res = await authApi.deleteAddress(id);
      if (res.data?.addresses) setAddresses(res.data.addresses);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to delete address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setAddressLoading(true);
    try {
      const res = await authApi.setDefaultAddress(id);
      if (res.data?.addresses) setAddresses(res.data.addresses);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to set default address.');
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <>
      <SEO title="User Profile" description="Manage your customer account and addresses." noIndex={true} />

      <div className="container" style={{ maxWidth: '800px', marginTop: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">My Account</h1>
          <p className="page-subtitle">Welcome back, {user?.name} ({user?.email})</p>
        </div>

        {/* Profile Information Card */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardBody>
            {profileMessage && (
              <Alert type="success" title="Updated">
                {profileMessage}
              </Alert>
            )}
            {profileError && (
              <Alert type="danger" title="Error">
                {profileError}
              </Alert>
            )}

            <form onSubmit={handleProfileUpdate}>
              <Input
                label="Full Name"
                type="text"
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                id="profile-email"
                value={user?.email || ''}
                disabled
                helperText="Email address cannot be changed directly."
              />

              <Input
                label="Phone Number"
                type="tel"
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
              />

              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <span className="badge badge-neutral">Role: {user?.role}</span>
                <span className={`badge ${user?.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                  {user?.emailVerified ? 'Email Verified' : 'Email Unverified'}
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={profileLoading}
                style={{ marginTop: 'var(--space-4)' }}
              >
                Save Changes
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Change Password Card */}
        <Card style={{ marginBottom: 'var(--space-6)' }}>
          <CardHeader>
            <CardTitle>Security & Password</CardTitle>
          </CardHeader>
          <CardBody>
            {passwordMessage && (
              <Alert type="success" title="Success">
                {passwordMessage}
              </Alert>
            )}
            {passwordError && (
              <Alert type="danger" title="Error">
                {passwordError}
              </Alert>
            )}

            <form onSubmit={handlePasswordChange}>
              <Input
                label="Current Password"
                type="password"
                id="profile-current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                id="profile-new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                helperText="Must be at least 8 characters with upper, lower, and numbers."
              />

              <Button
                type="submit"
                variant="outline"
                isLoading={passwordLoading}
                style={{ marginTop: 'var(--space-2)' }}
              >
                Update Password
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Address Book Card */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <CardTitle>Saved Addresses</CardTitle>
              {!showAddressForm && (
                <Button variant="primary" size="sm" onClick={() => setShowAddressForm(true)}>
                  + Add Address
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {addressError && (
              <Alert type="danger" title="Address Error">
                {addressError}
              </Alert>
            )}

            {showAddressForm && (
              <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', backgroundColor: 'var(--color-neutral-50)' }}>
                <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>
                  {editingAddressId ? 'Edit Address' : 'New Address'}
                </h3>
                <form onSubmit={handleAddressSubmit}>
                  <Input
                    label="Street Address"
                    type="text"
                    id="addr-street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <Input
                      label="City"
                      type="text"
                      id="addr-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                    <Input
                      label="State / Province"
                      type="text"
                      id="addr-state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <Input
                      label="Postal Code"
                      type="text"
                      id="addr-postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                    <Input
                      label="Country"
                      type="text"
                      id="addr-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', margin: 'var(--space-3) 0', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                    />
                    Set as default delivery address
                  </label>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                    <Button type="submit" variant="primary" isLoading={addressLoading}>
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetAddressForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {addresses.length === 0 && !showAddressForm ? (
              <p style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--font-size-sm)' }}>
                No addresses saved yet. Click &quot;+ Add Address&quot; to create your first delivery address.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    style={{
                      border: addr.isDefault ? '2px solid var(--color-primary-500)' : '1px solid var(--color-neutral-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--color-neutral-0)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {addr.isDefault && (
                        <span className="badge badge-success" style={{ marginBottom: 'var(--space-2)' }}>
                          Default Address
                        </span>
                      )}
                      <p style={{ margin: 'var(--space-1) 0', fontWeight: 500 }}>{addr.street}</p>
                      <p style={{ margin: 'var(--space-1) 0', color: 'var(--color-neutral-600)', fontSize: 'var(--font-size-sm)' }}>
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p style={{ margin: 'var(--space-1) 0', color: 'var(--color-neutral-600)', fontSize: 'var(--font-size-sm)' }}>
                        {addr.country}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-neutral-100)' }}>
                      {!addr.isDefault && addr._id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(addr._id!)}
                          disabled={addressLoading}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAddress(addr)}
                        disabled={addressLoading}
                      >
                        Edit
                      </Button>
                      {addr._id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr._id!)}
                          disabled={addressLoading}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

