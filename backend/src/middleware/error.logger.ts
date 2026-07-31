import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { AppError } from '../errors/AppError.js';

export const errorLogger = (err: Error, req: Request, _res: Response, next: NextFunction): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  const errorLogData = {
    requestId: req.requestId,
    method: req.method,
    endpoint: req.originalUrl,
    statusCode,
    isOperational,
    errorName: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    timestamp: new Date().toISOString(),
  };

  logger.error(`Unhandled Operational/System Error: ${JSON.stringify(errorLogData)}`);

  next(err);
};
