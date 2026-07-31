/**
 * Application Route Constants
 * Centralizes all route path strings across the frontend.
 */

export const ROUTES = {
  HOME: '/',
  OVERVIEW: '/overview',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRE_AUTH: '/claims/pre-auth',
  PROCESSING: '/claims/processing',
  DISCHARGE: '/claims/discharge',
  FINAL_CLAIMS: '/claims/final',
  PIPELINE: '/pipeline',
  DENIAL: '/denial',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  CLAIM_DETAIL: '/claims/detail',
  CLAIM_DETAIL_ID: (id: string) => `/claims/${id}`,
  MISSING_DATA: '/claims/missing-data',
  APPROVAL_CONFIRMATION: '/claims/approval',
  MANUAL_REVIEW: '/claims/manual-review',
  ERROR_ANALYSIS: '/claims/error-analysis',
  ADD_INSURER: '/settings/add-insurer',
} as const;
