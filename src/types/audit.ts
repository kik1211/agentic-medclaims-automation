/**
 * Canonical Domain Model — Audit Events & Notifications
 * Ref: docs/CANONICAL_DATA_MODEL.md Object 13, 14
 */

export interface AuditEvent {
  id: string;
  module_id: string;
  event_type: string;
  timestamp: string;
  claim_id?: string | null;
  user_id?: string | null;
  from_state?: string | null;
  to_state?: string | null;
  details?: Record<string, unknown> | null;
  request_id?: string | null;
}

export enum NotificationType {
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  REMINDER = 'REMINDER',
}

export enum NotificationPriority {
  URGENT = 'URGENT',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export interface Notification {
  id: string;
  claim_id: string;
  notification_type: NotificationType;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  user_id?: string | null;
  read_at?: string | null;
  action_url?: string | null;
}
