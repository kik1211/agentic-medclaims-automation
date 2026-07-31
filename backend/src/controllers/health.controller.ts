import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service.js';
import { dbAbstraction } from '../config/postgres.js';
import { checkRedisHealth } from '../config/redis.js';
import { ok } from '../responses/index.js';

export class HealthController {
  public getHealth = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = healthService.getHealthStatus();
      ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  public getReady = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dbHealth = await dbAbstraction.checkHealth();
      const redisHealth = await checkRedisHealth();

      const isReady = dbHealth.status === 'UP' && redisHealth.status === 'UP';

      res.status(isReady ? 200 : 503).json({
        success: isReady,
        status: isReady ? 'READY' : 'NOT_READY',
        database: dbHealth,
        redis: redisHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };
}

export const healthController = new HealthController();
