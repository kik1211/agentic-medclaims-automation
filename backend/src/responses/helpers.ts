import { Response } from 'express';
import { sendSuccess } from './success.js';
import { sendError } from './error.js';

export const ok = <T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>
): Response => sendSuccess(res, 200, data, meta);

export const created = <T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>
): Response => sendSuccess(res, 201, data, meta);

export const accepted = <T>(
  res: Response,
  data?: T,
  meta?: Record<string, unknown>
): Response => sendSuccess(res, 202, data ?? ({} as T), meta);

export const noContent = (res: Response): Response => {
  return res.status(204).send();
};

export const badRequest = (
  res: Response,
  message = 'Bad request',
  details?: Record<string, unknown>
): Response => sendError(res, 400, 'BAD_REQUEST', message, details);

export const unauthorized = (
  res: Response,
  message = 'Unauthorized access',
  details?: Record<string, unknown>
): Response => sendError(res, 401, 'UNAUTHORIZED', message, details);

export const forbidden = (
  res: Response,
  message = 'Access forbidden',
  details?: Record<string, unknown>
): Response => sendError(res, 403, 'FORBIDDEN', message, details);

export const notFound = (
  res: Response,
  message = 'Resource not found',
  details?: Record<string, unknown>
): Response => sendError(res, 404, 'NOT_FOUND', message, details);

export const conflict = (
  res: Response,
  message = 'Resource conflict',
  details?: Record<string, unknown>
): Response => sendError(res, 409, 'CONFLICT', message, details);

export const validationError = (
  res: Response,
  message = 'Validation failed',
  details?: Record<string, unknown>
): Response => sendError(res, 422, 'VALIDATION_ERROR', message, details);

export const internalError = (
  res: Response,
  message = 'Internal server error',
  details?: Record<string, unknown>
): Response => sendError(res, 500, 'INTERNAL_SERVER_ERROR', message, details);
