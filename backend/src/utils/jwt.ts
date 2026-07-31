import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { AuthUserPayload } from '../types/express.d.js';

export interface TokenPayload extends AuthUserPayload {
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AuthUserPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      hospitalId: decoded.hospitalId,
      role: decoded.role,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
};
