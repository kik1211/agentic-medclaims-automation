import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from '../services/auth.service.js';
import { ok, created } from '../responses/index.js';
import { RegisterUserRequest, LoginUserRequest } from '../schemas/auth.schema.js';
import { UnauthorizedError } from '../errors/AppError.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  public register = async (
    req: Request<Record<string, never>, Record<string, never>, RegisterUserRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      created(res, result);
    } catch (err) {
      next(err);
    }
  };

  public login = async (
    req: Request<Record<string, never>, Record<string, never>, LoginUserRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context missing');
      }
      const userProfile = await this.service.getCurrentUser(req.user.userId);
      ok(res, userProfile);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
