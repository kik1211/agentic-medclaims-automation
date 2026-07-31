/**
 * Canonical Domain Model — Patient
 * Ref: docs/CANONICAL_DATA_MODEL.md Object 2
 */

export enum PatientGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface Patient {
  patient_name: string;
  policy_number: string;
  patient_dob?: string;
  patient_age?: number;
  patient_gender?: PatientGender;
  patient_id?: string;
  policy_holder_name?: string;
  contact_number?: string;
}
