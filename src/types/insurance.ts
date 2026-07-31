/**
 * Canonical Domain Model — Insurance Scheme Configuration
 * Ref: docs/CANONICAL_DATA_MODEL.md Object 4
 */

export enum ConnectionType {
  API = 'API',
  RPA = 'RPA',
  MANUAL = 'MANUAL',
}

export interface InsuranceScheme {
  id: string;
  hospital_id: string;
  insurer_code: string;
  insurer_name: string;
  connection_type: ConnectionType;
  api_key?: string;
  api_endpoint?: string;
  portal_url?: string;
  portal_username?: string;
  portal_password?: string;
  hospital_id_at_insurer?: string;
  tpa_name?: string;
  state_scheme?: string;
  last_tested_at?: string;
  is_active?: boolean;
}
