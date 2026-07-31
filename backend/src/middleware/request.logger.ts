import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - startTime;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      endpoint: req.originalUrl,
      status: res.statusCode,
      latencyMs: latency,
      ip: req.ip || req.socket.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      logger.warn(`HTTP Request Failed: ${JSON.stringify(logData)}`);
    } else {
      logger.info(`HTTP Request: ${JSON.stringify(logData)}`);
    }
  });

  next();
};
