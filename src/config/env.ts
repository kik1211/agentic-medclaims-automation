/// <reference types="vite/client" />

/**
 * Centralized Environment Configuration Access
 *
 * Provides typed, safe access to environment variables.
 * Does not expose secret keys client-side.
 */

export interface EnvConfig {
  geminiApiKey: string;
  appUrl: string;
  isDev: boolean;
  isProd: boolean;
}

export const env: EnvConfig = {
  geminiApiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '',
  appUrl: (typeof process !== 'undefined' && process.env?.APP_URL) || 'http://localhost:3000',
  isDev:
    typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.DEV) : true,
  isProd:
    typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.PROD) : false,
};
