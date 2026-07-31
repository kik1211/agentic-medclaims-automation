/**
 * Canonical Domain Model — Hospital
 * Ref: docs/CANONICAL_DATA_MODEL.md Object 3
 */

export interface Hospital {
  id: string;
  name: string;
  registration_number: string;
  address?: string;
  empanelment_ids?: Record<string, string>;
  nabh_accredited?: boolean;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
}
