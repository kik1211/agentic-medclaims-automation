import { env } from '../config/env.js';

export interface LogContext {
  requestId?: string;
  route?: string;
  method?: string;
  [key: string]: unknown;
}

const formatMeta = (context?: LogContext): string => {
  if (!context) return '';
  const parts: string[] = [];
  if (context.requestId) parts.push(`reqId=${context.requestId}`);
  if (context.method && context.route) {
    parts.push(`${context.method} ${context.route}`);
  } else if (context.method) {
    parts.push(context.method);
  } else if (context.route) {
    parts.push(context.route);
  }
  return parts.length > 0 ? ` [${parts.join(' ')}]` : '';
};

export const logger = {
  info: (msg: string, context?: LogContext, ...args: unknown[]) => {
    console.log(`[INFO] [${new Date().toISOString()}]${formatMeta(context)} ${msg}`, ...args);
  },
  warn: (msg: string, context?: LogContext, ...args: unknown[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}]${formatMeta(context)} ${msg}`, ...args);
  },
  error: (msg: string, context?: LogContext, ...args: unknown[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}]${formatMeta(context)} ${msg}`, ...args);
  },
  debug: (msg: string, context?: LogContext, ...args: unknown[]) => {
    if (env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] [${new Date().toISOString()}]${formatMeta(context)} ${msg}`, ...args);
    }
  },
};
