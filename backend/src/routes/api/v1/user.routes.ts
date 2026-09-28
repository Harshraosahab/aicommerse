import { Router } from 'express';
import { userController } from '../../../controllers/user.controller.js';
import { UserPreferencesController } from '../../../controllers/userPreferences.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/me', (req, res, next) => userController.getProfile(req, res, next));
router.put('/me', (req, res, next) => userController.updateProfile(req, res, next));

// Notification Preferences routes
router.get('/me/notification-preferences', UserPreferencesController.getPreferences);
router.put('/me/notification-preferences', UserPreferencesController.updatePreferences);

// Address routes
router.get('/me/addresses', (req, res, next) => userController.getAddresses(req, res, next));
router.post('/me/addresses', (req, res, next) => userController.addAddress(req, res, next));
router.put('/me/addresses/:id', (req, res, next) => userController.updateAddress(req, res, next));
router.delete('/me/addresses/:id', (req, res, next) => userController.deleteAddress(req, res, next));
router.patch('/me/addresses/:id/default', (req, res, next) => userController.setDefaultAddress(req, res, next));

export default router;
