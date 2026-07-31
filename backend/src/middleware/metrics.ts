import { Request, Response, NextFunction } from 'express';

interface TelemetryState {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  totalLatencyMs: number;
  statusCodes: Record<number, number>;
  startedAt: string;
}

const state: TelemetryState = {
  totalRequests: 0,
  successfulRequests: 0,
  errorRequests: 0,
  totalLatencyMs: 0,
  statusCodes: {},
  startedAt: new Date().toISOString(),
};

export const metricsCollector = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - startTime;
    state.totalRequests += 1;
    state.totalLatencyMs += latency;

    const code = res.statusCode;
    state.statusCodes[code] = (state.statusCodes[code] || 0) + 1;

    if (code >= 400) {
      state.errorRequests += 1;
    } else {
      state.successfulRequests += 1;
    }
  });

  next();
};

export const getMetricsHandler = (_req: Request, res: Response): void => {
  const memory = process.memoryUsage();
  const avgLatencyMs = state.totalRequests > 0 ? Math.round(state.totalLatencyMs / state.totalRequests) : 0;

  res.status(200).json({
    status: 'UP',
    uptimeSeconds: Math.floor(process.uptime()),
    telemetry: {
      totalRequests: state.totalRequests,
      successfulRequests: state.successfulRequests,
      errorRequests: state.errorRequests,
      averageLatencyMs: avgLatencyMs,
      statusCodes: state.statusCodes,
      startedAt: state.startedAt,
    },
    systemMemory: {
      rssBytes: memory.rss,
      heapTotalBytes: memory.heapTotal,
      heapUsedBytes: memory.heapUsed,
      externalBytes: memory.external,
    },
  });
};
