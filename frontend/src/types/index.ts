// CertiSecure2 — TypeScript Interfaces

export type UserRole = 'admin' | 'issuer' | 'verifier';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  institution_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Institution {
  id: number;
  name: string;
  code: string;
  domain: string | null;
  description: string | null;
  logo_path: string | null;
  status: 'pending' | 'verified' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface InstitutionDetail extends Institution {
  public_key_id: string | null;
  public_key_fingerprint: string | null;
  certificate_count: number;
}

export interface Certificate {
  id: number;
  certificate_uid: string;
  holder_name: string;
  holder_email: string | null;
  roll_number: string | null;
  course: string;
  certificate_type: string;
  description: string | null;
  issue_date: string;
  expiry_date: string | null;
  grade: string | null;
  status: 'active' | 'revoked';
  data_hash: string;
  institution_id: number;
  pdf_path: string | null;
  qr_path: string | null;
  created_at: string;
}

export interface CertificateDetail extends Certificate {
  institution_name: string | null;
  institution_code: string | null;
  signature: string;
  canonical_data: string;
  key_id: string | null;
  issued_by_name: string | null;
}

export interface CryptoVerification {
  hash_match: boolean;
  signature_valid: boolean;
  original_hash: string;
  current_hash: string;
  algorithm: string;
  hash_algorithm: string;
}

export interface IssuerInfo {
  name: string;
  code: string;
  status: string;
  verified: boolean;
  public_key_fingerprint: string | null;
}

export interface RevocationInfo {
  revoked_at: string;
  reason: string;
  reason_detail: string | null;
  revoked_by?: string | null;
}

export interface VerificationResult {
  status: 'VALID' | 'TAMPERED' | 'REVOKED' | 'NOT_FOUND';
  message: string;
  certificate: {
    certificate_uid: string;
    holder_name: string;
    holder_email: string | null;
    roll_number: string | null;
    course: string;
    certificate_type: string;
    description: string | null;
    issue_date: string;
    expiry_date: string | null;
    grade: string | null;
    status: string;
  } | null;
  crypto: CryptoVerification | null;
  issuer: IssuerInfo | null;
  revocation: RevocationInfo | null;
  verified_at: string;
}

export interface DashboardStats {
  total_certificates: number;
  active_certificates: number;
  revoked_certificates: number;
  total_verifications: number;
  registered_institutions: number;
  tampering_attempts: number;
}

export interface AuditLog {
  id: number;
  actor_id: number | null;
  actor_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  metadata_json: string | null;
  created_at: string;
}
