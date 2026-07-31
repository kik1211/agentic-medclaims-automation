import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError.js';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication context missing'));
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
      return;
    }

    next();
  };
};
