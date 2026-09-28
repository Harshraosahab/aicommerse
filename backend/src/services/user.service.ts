import { User, IUser, IAddress } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';


class UserService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: { name?: string; phone?: string; profileImage?: string }): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.profileImage !== undefined) user.profileImage = updateData.profileImage;

    await user.save();
    return user;
  }

  /**
   * Get all addresses for user
   */
  async getAddresses(userId: string): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }
    return user.addresses as any;
  }

  /**
   * Add a new address to user profile
   */
  async addAddress(userId: string, addressData: IAddress): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    // If marked default or first address, unset default on other addresses
    if (addressData.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
      addressData.isDefault = true;
    }

    user.addresses.push(addressData as any);
    await user.save();
    return user.addresses as any;
  }

  /**
   * Update an existing address
   */
  async updateAddress(userId: string, addressId: string, addressData: Partial<IAddress>): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
    }

    if (addressData.isDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    if (addressData.street) address.street = addressData.street;
    if (addressData.city) address.city = addressData.city;
    if (addressData.state) address.state = addressData.state;
    if (addressData.postalCode) address.postalCode = addressData.postalCode;
    if (addressData.country) address.country = addressData.country;
    if (addressData.isDefault !== undefined) address.isDefault = addressData.isDefault;

    await user.save();
    return user.addresses as any;
  }

  /**
   * Delete an address
   */
  async deleteAddress(userId: string, addressId: string): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: addressId });

    // If removed address was default and other addresses remain, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return user.addresses as any;
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(userId: string, addressId: string): Promise<IAddress[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
    }

    user.addresses.forEach((addr: any) => {
      addr.isDefault = addr._id?.toString() === addressId;
    });

    await user.save();
    return user.addresses as any;
  }
}

export const userService = new UserService();

