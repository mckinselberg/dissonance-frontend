/**
 * Consent Management System
 * 
 * Manages Terms of Service acceptance, telemetry consent, and data privacy.
 * Implements proper hashing, salting, and audit logging for legal compliance.
 * 
 * dk:business CRITICAL - Do not modify without legal review
 * dk:privacy All consent events logged and hashed
 */

import { getCacheVersion } from './healthCheck';

const TERMS_VERSION = '1.0';
const CONSENT_SALT_KEY = 'consent_salt';

export interface ConsentRecord {
  termsVersion: string;
  accepted: boolean;
  timestamp: number;
  hash: string; // SHA-256 hash of (version + timestamp + salt)
  cacheVersion: string;
  userAgent: string;
}

export interface TelemetryConsent {
  enabled: boolean;
  tier: 1 | 2 | 3; // 1=critical, 2=gameplay, 3=detailed
  timestamp: number;
  hash: string;
}

/**
 * Generate or retrieve session salt
 */
function getConsentSalt(): string {
  let salt = sessionStorage.getItem(CONSENT_SALT_KEY);
  
  if (!salt) {
    // Generate random salt
    salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem(CONSENT_SALT_KEY, salt);
  }
  
  return salt;
}

/**
 * Generate SHA-256 hash
 */
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if terms have been accepted
 */
export function hasAcceptedTerms(): boolean {
  const stored = localStorage.getItem('terms_accepted_v1');
  return stored === 'true';
}

/**
 * Get current terms acceptance record
 */
export function getTermsRecord(): ConsentRecord | null {
  const stored = localStorage.getItem('terms_record');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as ConsentRecord;
  } catch {
    return null;
  }
}

/**
 * Record terms acceptance
 * 
 * dk:business Creates audit trail with hash
 */
export async function acceptTerms(): Promise<ConsentRecord> {
  const timestamp = Date.now();
  const salt = getConsentSalt();
  const cacheVersion = getCacheVersion();
  const userAgent = navigator.userAgent;
  
  // Generate hash: SHA-256(version + timestamp + salt)
  const dataToHash = `${TERMS_VERSION}|${timestamp}|${salt}`;
  const hash = await generateHash(dataToHash);
  
  const record: ConsentRecord = {
    termsVersion: TERMS_VERSION,
    accepted: true,
    timestamp,
    hash,
    cacheVersion,
    userAgent
  };
  
  // Store record
  localStorage.setItem('terms_accepted_v1', 'true');
  localStorage.setItem('terms_record', JSON.stringify(record));
  
  // Audit log to console (developer transparency)
  console.group('📜 Terms of Service Accepted');
  console.log('Version:', TERMS_VERSION);
  console.log('Timestamp:', new Date(timestamp).toISOString());
  console.log('Hash:', hash);
  console.log('Cache Version:', cacheVersion);
  console.groupEnd();
  
  return record;
}

/**
 * Revoke terms acceptance (user wants to stop using game)
 */
export function revokeTerms(): void {
  localStorage.removeItem('terms_accepted_v1');
  localStorage.removeItem('terms_record');
  
  console.warn('📜 Terms of Service revoked. All data will be cleared.');
  
  // Clear all localStorage (user is leaving)
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Get telemetry consent status
 */
export function getTelemetryConsent(): TelemetryConsent | null {
  const stored = localStorage.getItem('telemetry_consent_record');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as TelemetryConsent;
  } catch {
    return null;
  }
}

/**
 * Set telemetry consent
 */
export async function setTelemetryConsent(enabled: boolean, tier: 1 | 2 | 3 = 2): Promise<TelemetryConsent> {
  const timestamp = Date.now();
  const salt = getConsentSalt();
  
  // Generate hash
  const dataToHash = `telemetry|${enabled}|${tier}|${timestamp}|${salt}`;
  const hash = await generateHash(dataToHash);
  
  const record: TelemetryConsent = {
    enabled,
    tier,
    timestamp,
    hash
  };
  
  // Store
  localStorage.setItem('telemetry_consent', enabled ? 'true' : 'false');
  localStorage.setItem('telemetry_consent_record', JSON.stringify(record));
  
  // Audit log
  console.group('📊 Telemetry Consent Updated');
  console.log('Enabled:', enabled);
  console.log('Tier:', tier);
  console.log('Timestamp:', new Date(timestamp).toISOString());
  console.log('Hash:', hash);
  console.groupEnd();
  
  return record;
}

/**
 * Check if telemetry is enabled
 */
export function isTelemetryEnabled(): boolean {
  return localStorage.getItem('telemetry_consent') === 'true';
}

/**
 * Verify consent record integrity
 * 
 * dk:business Use this to detect tampering
 */
export async function verifyConsentRecord(record: ConsentRecord): Promise<boolean> {
  const salt = getConsentSalt();
  const dataToHash = `${record.termsVersion}|${record.timestamp}|${salt}`;
  const expectedHash = await generateHash(dataToHash);
  
  return expectedHash === record.hash;
}

/**
 * Export all consent records (GDPR compliance)
 */
export function exportConsentData(): string {
  const terms = getTermsRecord();
  const telemetry = getTelemetryConsent();
  
  const data = {
    terms,
    telemetry,
    exported: new Date().toISOString(),
    note: 'This data is stored locally in your browser. We do not have server-side copies.'
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Delete all consent data (GDPR right to erasure)
 */
export function deleteAllConsentData(): void {
  console.warn('🗑️ Deleting all consent data. You will need to re-accept terms.');
  
  localStorage.removeItem('terms_accepted_v1');
  localStorage.removeItem('terms_record');
  localStorage.removeItem('telemetry_consent');
  localStorage.removeItem('telemetry_consent_record');
  
  console.log('✅ All consent data deleted.');
}

// dk:debug Expose to window for testing
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).consent = {
    hasAccepted: hasAcceptedTerms,
    accept: acceptTerms,
    revoke: revokeTerms,
    getTelemetry: getTelemetryConsent,
    setTelemetry: setTelemetryConsent,
    verify: verifyConsentRecord,
    export: exportConsentData,
    deleteAll: deleteAllConsentData
  };
}
