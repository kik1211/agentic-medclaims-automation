import { Response } from 'express';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetails;
  timestamp: string;
  requestId: string;
}

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response => {
  const requestId =
    res.locals.requestId || (res.req as { requestId?: string })?.requestId || 'unknown';
  const payload: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
  return res.status(statusCode).json(payload);
};
