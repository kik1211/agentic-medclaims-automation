import { Response } from 'express';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
  meta?: Record<string, unknown>;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  data: T,
  meta?: Record<string, unknown>
): Response => {
  const requestId =
    res.locals.requestId || (res.req as { requestId?: string })?.requestId || 'unknown';
  const payload: SuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(payload);
};
