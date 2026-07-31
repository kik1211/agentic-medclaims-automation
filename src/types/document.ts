/**
 * Canonical Domain Model — Document, OCR Result, and Speech Transcript
 * Ref: docs/CANONICAL_DATA_MODEL.md Object 5, 6, 7
 */

export enum DocumentType {
  CLINICAL_NOTES = 'CLINICAL_NOTES',
  INSURANCE_CARD = 'INSURANCE_CARD',
  COST_SHEET = 'COST_SHEET',
  DIAGNOSIS_REPORT = 'DIAGNOSIS_REPORT',
  PRESCRIPTION = 'PRESCRIPTION',
  OPERATION_NOTES = 'OPERATION_NOTES',
  ANAESTHESIA_REPORT = 'ANAESTHESIA_REPORT',
  POST_OP_SUMMARY = 'POST_OP_SUMMARY',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  FINAL_BILL = 'FINAL_BILL',
  LAB_REPORT = 'LAB_REPORT',
  IMPLANT_INVOICE = 'IMPLANT_INVOICE',
  TRANSCRIPT = 'TRANSCRIPT',
  OTHER = 'OTHER',
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export interface Document {
  id: string;
  claim_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  file_hash_sha256: string;
  uploaded_at: string;
  uploaded_by: string;
  document_type?: DocumentType;
  processing_status?: ProcessingStatus;
}

export enum TextQuality {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  UNREADABLE = 'UNREADABLE',
}

export interface OCRPageResult {
  pageNumber: number;
  confidence: number;
  isBlank: boolean;
  hasHandwriting: boolean;
  text?: string;
}

export interface OCRResult {
  extracted_text: string;
  page_count: number;
  text_quality: TextQuality;
  ocr_completed_at: string;
  average_confidence?: number;
  blank_page_count?: number;
  language_detected?: string;
  structured_fields?: Record<string, unknown>;
  page_results?: OCRPageResult[];
}

export interface SpeakerSegment {
  speaker: 'DOCTOR' | 'PATIENT' | 'UNKNOWN';
  startTime: number;
  endTime: number;
  text: string;
}

export interface SpeechTranscript {
  raw_transcript: string;
  detected_language: string;
  transcript_confidence: number;
  duration_seconds: number;
  word_count: number;
  whisper_model: string;
  speaker_segments?: SpeakerSegment[];
  clinical_keywords?: string[];
}
