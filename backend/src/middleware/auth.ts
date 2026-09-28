import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/user.model.js';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { AdminPermission, hasPermission, isAdministrativeRole } from '../utils/permissions.js';



// Extend Express Request to hold the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Middleware to authenticate requests via HTTP-only cookie or Bearer header
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to gain access.', 401, 'UNAUTHORIZED'));
    }

    // 3. Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN'));
    }

    // 4. Check if user still exists in database and is active
    const currentUser = await User.findById(decoded.id).select('+password');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    if (!currentUser.isActive) {
      return next(new AppError('This user account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED'));
    }

    // 5. Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to optionally authenticate requests: attaches req.user if a valid token is present,
 * but allows guest users through seamlessly.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyToken(token);
      const currentUser = await User.findById(decoded.id);
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    } catch {
      // On invalid or expired token, proceed as guest without failing
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to restrict access to specified roles
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN')
      );
    }
    next();
  };
}

/**
 * Middleware to ensure the authenticated user has an administrative role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || !isAdministrativeRole(req.user.role)) {
    return next(
      new AppError('Administrative access required. Access denied.', 403, 'FORBIDDEN')
    );
  }
  next();
}

/**
 * Middleware to restrict access based on granular admin permissions
 */
export function authorizePermission(...permissions: AdminPermission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !isAdministrativeRole(req.user.role)) {
      return next(
        new AppError('Administrative access required. Access denied.', 403, 'FORBIDDEN')
      );
    }

    const permitted = permissions.some((perm) => hasPermission(req.user!.role, perm));
    if (!permitted) {
      return next(
        new AppError('You do not have the required administrative permission for this action.', 403, 'INSUFFICIENT_PERMISSIONS')
      );
    }

    next();
  };
}

