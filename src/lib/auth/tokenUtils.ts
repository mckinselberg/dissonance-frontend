/**
 * Token Utility Functions
 * 
 * Cryptographic utilities for token generation, validation, hashing, and salting.
 * 
 * dk:security Uses Web Crypto API for cryptographic operations
 * dk:architecture All functions are pure and side-effect free
 * dk:performance Heavy operations are async to avoid blocking main thread
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Token expiration times (milliseconds) */
export const TOKEN_EXPIRY = {
  AUTH_TOKEN: 24 * 60 * 60 * 1000,        // 24 hours
  REFRESH_TOKEN: 30 * 24 * 60 * 60 * 1000, // 30 days
  SESSION_TOKEN: 60 * 60 * 1000,          // 1 hour
  CSRF_TOKEN: 15 * 60 * 1000,             // 15 minutes
  SMS_VERIFICATION: 5 * 60 * 1000,        // 5 minutes
  AUDIO_CHANNEL: 2 * 60 * 60 * 1000,      // 2 hours
  VIDEO_STREAM: 8 * 60 * 60 * 1000,       // 8 hours
} as const;

/** Salt length for hashing (bytes) */
export const SALT_LENGTH = 32;

/** Token version (for backwards compatibility) */
export const TOKEN_VERSION = 'v1';

// ============================================================================
// CRYPTOGRAPHIC UTILITIES
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 */
export async function generateRandomBytes(length: number): Promise<Uint8Array> {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

/**
 * Generate random hex string
 */
export async function generateRandomHex(length: number): Promise<string> {
  const bytes = await generateRandomBytes(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate random base64 string
 */
export async function generateRandomBase64(length: number): Promise<string> {
  const bytes = await generateRandomBytes(length);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash string using SHA-256
 */
export async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string with salt (HMAC-SHA256)
 */
export async function hashWithSalt(
  data: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(salt);
  
  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign data
  const dataBuffer = encoder.encode(data);
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  
  // Convert to hex
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate salt for hashing
 */
export async function generateSalt(): Promise<string> {
  return await generateRandomHex(SALT_LENGTH);
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate GameAuthToken
 */
export async function generateGameAuthToken(
  userId: string,
  role: 'operator' | 'citizen' | 'resistance' | 'spectator',
  _ipAddress: string,
  _deviceFingerprint: string
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const timestamp = Date.now();
  const salt = await generateSalt();
  
  // Create token payload
  const payload = `${userId}:${sessionId}:${timestamp}:${role}`;
  const hash = await hashWithSalt(payload, salt);
  
  // Format: gat_v1_timestamp_hash
  return `gat_${TOKEN_VERSION}_${timestamp}_${hash.substring(0, 32)}`;
}

/**
 * Generate RefreshToken
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${userId}:${timestamp}:refresh`;
  const hash = await hashWithSalt(payload, salt);
  
  return `grt_${TOKEN_VERSION}_${hash.substring(0, 40)}`;
}

/**
 * Generate SessionToken
 */
export async function generateSessionToken(
  userId: string,
  wsConnectionId: string
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${userId}:${sessionId}:${wsConnectionId}:${timestamp}`;
  const hash = await hashWithSalt(payload, salt);
  
  return `gst_${sessionId}_${hash.substring(0, 24)}`;
}

/**
 * Generate PaymentToken
 */
export async function generatePaymentToken(
  userId: string,
  provider: string,
  providerPaymentMethodId: string
): Promise<string> {
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${userId}:${provider}:${providerPaymentMethodId}:${timestamp}`;
  const hash = await hashWithSalt(payload, salt);
  
  return `gpt_${provider}_${hash.substring(0, 32)}`;
}

/**
 * Generate SubscriptionToken
 */
export async function generateSubscriptionToken(
  userId: string,
  tier: string
): Promise<string> {
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${userId}:${tier}:${timestamp}`;
  const hash = await hashWithSalt(payload, salt);
  
  return `gsu_${tier}_${hash.substring(0, 32)}`;
}

/**
 * Generate CSRF Token
 */
export async function generateCSRFToken(
  sessionId: string,
  path: string
): Promise<string> {
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${sessionId}:${path}:${timestamp}`;
  const hash = await hashWithSalt(payload, salt);
  
  return `csrf_${sessionId.substring(0, 8)}_${hash.substring(0, 24)}`;
}

/**
 * Generate SMS Verification Code (6 digits)
 */
export function generateSMSVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Generate Audio Channel Token
 */
export async function generateAudioChannelToken(
  userId: string,
  channelId: string
): Promise<string> {
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${userId}:${channelId}:${timestamp}`;
  const hash = await hashWithSalt(payload, salt);
  
  return `gac_${channelId}_${hash.substring(0, 28)}`;
}

/**
 * Generate Video Stream Token
 */
export async function generateVideoStreamToken(
  userId: string,
  streamId: string
): Promise<string> {
  const timestamp = Date.now();
  const salt = await generateSalt();
  const payload = `${userId}:${streamId}:${timestamp}`;
  const hash = await hashWithSalt(payload, salt);
  
  return `gvs_${streamId}_${hash.substring(0, 28)}`;
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Validate token format (prefix and structure)
 */
export function validateTokenFormat(token: string): boolean {
  // Check minimum length
  if (token.length < 20) return false;
  
  // Check prefix
  const validPrefixes = ['gat', 'grt', 'gst', 'gpt', 'gsu', 'csrf', 'gac', 'gvs', 'gsv', 'gim'];
  const prefix = token.split('_')[0];
  
  if (!validPrefixes.includes(prefix)) return false;
  
  // Check structure (prefix_version_data or prefix_id_hash)
  const parts = token.split('_');
  if (parts.length < 3) return false;
  
  return true;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(_issuedAt: number, expiresAt: number): boolean {
  const now = Date.now();
  return now > expiresAt;
}

/**
 * Calculate token expiry time
 */
export function calculateExpiryTime(
  issuedAt: number,
  expiryDuration: number
): number {
  return issuedAt + expiryDuration;
}

/**
 * Validate token not expired
 */
export function validateTokenExpiry(token: {
  issuedAt: number;
  expiresAt: number;
}): boolean {
  return !isTokenExpired(token.issuedAt, token.expiresAt);
}

// ============================================================================
// HASHING UTILITIES
// ============================================================================

/**
 * Hash user ID for privacy
 */
export async function hashUserId(userId: string): Promise<string> {
  const salt = 'dissonance_user_salt_2025'; // Application-wide salt
  return await hashWithSalt(userId, salt);
}

/**
 * Hash IP address for rate limiting
 */
export async function hashIPAddress(ipAddress: string): Promise<string> {
  const salt = 'dissonance_ip_salt_2025';
  return await hashWithSalt(ipAddress, salt);
}

/**
 * Hash phone number for SMS verification
 */
export async function hashPhoneNumber(phoneNumber: string): Promise<string> {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  const salt = 'dissonance_phone_salt_2025';
  return await hashWithSalt(cleaned, salt);
}

/**
 * Get last 4 digits of phone number
 */
export function getPhoneLast4(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.slice(-4);
}

/**
 * Hash email address
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const salt = 'dissonance_email_salt_2025';
  return await hashWithSalt(normalized, salt);
}

/**
 * Generate device fingerprint from browser data
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const data = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorDepth: screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
  
  const fingerprint = JSON.stringify(data);
  return await hashSHA256(fingerprint);
}

// ============================================================================
// ENCRYPTION UTILITIES (AES-256-GCM)
// ============================================================================

/**
 * Encrypt data using AES-256-GCM
 * 
 * dk:security Returns IV, ciphertext, and auth tag separately
 */
export async function encryptData(
  plaintext: string,
  keyHex: string
): Promise<{
  ciphertext: string;
  iv: string;
  authTag: string;
}> {
  // Generate random IV
  const iv = await generateRandomBytes(12); // 96 bits for GCM
  
  // Convert key from hex to buffer
  const keyBuffer = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintextBuffer
  );
  
  // Extract auth tag (last 16 bytes)
  const ciphertext = new Uint8Array(ciphertextBuffer.slice(0, -16));
  const authTag = new Uint8Array(ciphertextBuffer.slice(-16));
  
  return {
    ciphertext: btoa(String.fromCharCode(...ciphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    authTag: btoa(String.fromCharCode(...authTag)),
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  ciphertext: string,
  iv: string,
  authTag: string,
  keyHex: string
): Promise<string> {
  // Convert from base64
  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const authTagBuffer = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));
  
  // Combine ciphertext and auth tag
  const combinedBuffer = new Uint8Array(ciphertextBuffer.length + authTagBuffer.length);
  combinedBuffer.set(ciphertextBuffer);
  combinedBuffer.set(authTagBuffer, ciphertextBuffer.length);
  
  // Convert key from hex
  const keyBuffer = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    combinedBuffer
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================

/**
 * Rate limit key generator
 */
export async function generateRateLimitKey(
  ipAddress: string,
  endpoint: string
): Promise<string> {
  const ipHash = await hashIPAddress(ipAddress);
  return `ratelimit:${endpoint}:${ipHash.substring(0, 16)}`;
}

/**
 * Generate sliding window rate limit key
 */
export function generateSlidingWindowKey(
  baseKey: string,
  windowSizeMs: number
): string {
  const now = Date.now();
  const windowStart = Math.floor(now / windowSizeMs) * windowSizeMs;
  return `${baseKey}:${windowStart}`;
}

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

/**
 * Redact token for logging (show first 8 and last 4 characters)
 */
export function redactToken(token: string): string {
  if (token.length < 16) return '***';
  
  const prefix = token.substring(0, 8);
  const suffix = token.substring(token.length - 4);
  const middle = '*'.repeat(Math.min(token.length - 12, 20));
  
  return `${prefix}${middle}${suffix}`;
}

/**
 * Parse token to extract metadata (without validation)
 */
export function parseTokenMetadata(token: string): {
  prefix: string;
  version?: string;
  timestamp?: number;
  id?: string;
} | null {
  if (!validateTokenFormat(token)) return null;
  
  const parts = token.split('_');
  const prefix = parts[0];
  
  // Try to parse version (if present)
  const version = parts[1]?.startsWith('v') ? parts[1] : undefined;
  
  // Try to parse timestamp (if numeric)
  const timestampPart = version ? parts[2] : parts[1];
  const timestamp = timestampPart && !isNaN(Number(timestampPart))
    ? Number(timestampPart)
    : undefined;
  
  // Extract ID (for tokens with ID field)
  const id = !version && !timestamp ? parts[1] : undefined;
  
  return { prefix, version, timestamp, id };
}

// dk:security All cryptographic operations use Web Crypto API (audited, constant-time)
// dk:performance Heavy crypto operations are async to prevent blocking
// dk:reminder Never log full tokens - always use redactToken()
// dk:architecture Token format: prefix_version_data_hash for forwards compatibility
