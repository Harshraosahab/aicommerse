import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../config/env.js';
import { IUser } from '../models/user.model.js';


export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(user: IUser): string {
  const payload: JwtPayload = {
    id: (user._id as any).toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function setAuthCookie(res: Response, token: string): void {
  const cookieOptions = {
    expires: new Date(Date.now() + env.JWT_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
}

export function clearAuthCookie(res: Response): void {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  });
}
