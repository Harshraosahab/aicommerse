import { apiClient } from './apiClient';

export interface IUserAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role:
    | 'USER'
    | 'ADMIN'
    | 'SUPER_ADMIN'
    | 'PRODUCT_MANAGER'
    | 'ORDER_MANAGER'
    | 'SUPPORT_MANAGER'
    | 'MARKETING_MANAGER'
    | 'MODERATOR';
  profileImage?: string;
  addresses: IUserAddress[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: IUserProfile;
    token: string;
  };
}

export interface MessageResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export interface AddressesResponse {
  success: boolean;
  data: {
    addresses: IUserAddress[];
    message?: string;
  };
}

export const authApi = {
  // Auth actions
  register: (data: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', data),
  login: (data: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', data),
  logout: () => apiClient.post<MessageResponse>('/auth/logout'),
  getMe: () => apiClient.get<{ success: boolean; data: { user: IUserProfile } }>('/auth/me'),
  forgotPassword: (email: string) => apiClient.post<MessageResponse>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post<AuthResponse>(`/auth/reset-password/${token}`, { password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<MessageResponse>('/auth/change-password', { currentPassword, newPassword }),
  verifyEmail: (token: string) => apiClient.get<MessageResponse>(`/auth/verify-email/${token}`),

  // Profile & Address actions
  getProfile: () => apiClient.get<{ success: boolean; data: { user: IUserProfile } }>('/users/me'),
  updateProfile: (data: { name?: string; phone?: string; profileImage?: string }) =>
    apiClient.put<{ success: boolean; data: { user: IUserProfile; message: string } }>('/users/me', data),
  getAddresses: () => apiClient.get<AddressesResponse>('/users/me/addresses'),
  addAddress: (data: Omit<IUserAddress, '_id'>) => apiClient.post<AddressesResponse>('/users/me/addresses', data),
  updateAddress: (id: string, data: Partial<IUserAddress>) =>
    apiClient.put<AddressesResponse>(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => apiClient.delete<AddressesResponse>(`/users/me/addresses/${id}`),
  setDefaultAddress: (id: string) => apiClient.patch<AddressesResponse>(`/users/me/addresses/${id}/default`),
};
