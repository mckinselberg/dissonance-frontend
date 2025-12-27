/**
 * Authentication & Authorization Types
 * 
 * Comprehensive type definitions for game authentication, session management,
 * payment processing, security tokens, and multi-channel communication.
 * 
 * dk:security All tokens are hashed/salted using industry-standard algorithms
 * dk:business Payment integrations support Stripe, PayPal, crypto wallets
 * dk:privacy Location data anonymized for telemetry (city-level, not GPS)
 */

// ============================================================================
// SESSION & AUTHENTICATION TOKENS
// ============================================================================

/**
 * GameAuthToken - Primary authentication token for game sessions
 * 
 * Format: `gat_<version>_<timestamp>_<hash>`
 * Example: `gat_v1_1703174400_a3f9c8b2e7d1...`
 * 
 * dk:security SHA-256 hashed with HMAC salt
 * dk:architecture Token rotates every 24 hours or on suspicious activity
 */
export interface GameAuthToken {
  /** Token identifier (gat_v1_...) */
  token: string;
  
  /** User ID (hashed) */
  userId: string;
  
  /** Session ID (UUID) */
  sessionId: string;
  
  /** Token creation timestamp (Unix epoch) */
  issuedAt: number;
  
  /** Token expiration timestamp (Unix epoch) */
  expiresAt: number;
  
  /** Current game role (operator/citizen/resistance) */
  role: 'operator' | 'citizen' | 'resistance' | 'spectator';
  
  /** Refresh token for silent renewal */
  refreshToken: string;
  
  /** IP address hash (for rate limiting) */
  ipHash: string;
  
  /** Device fingerprint (browser/OS hash) */
  deviceFingerprint: string;
}

/**
 * RefreshToken - Used to obtain new GameAuthToken without re-login
 * 
 * Format: `grt_<version>_<hash>`
 * Expires: 30 days (sliding window)
 * 
 * dk:security Stored in HttpOnly cookie, never exposed to JavaScript
 */
export interface RefreshToken {
  token: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  lastUsedAt: number;
  
  /** Number of times this refresh token has been used */
  useCount: number;
  
  /** Maximum allowed uses (prevents token reuse attacks) */
  maxUses: number;
}

/**
 * SessionToken - Short-lived token for WebSocket connections
 * 
 * Format: `gst_<sessionId>_<hash>`
 * Expires: 1 hour (renewed via heartbeat)
 * 
 * dk:architecture Separate from auth token to enable multi-device sessions
 */
export interface SessionToken {
  token: string;
  sessionId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  
  /** WebSocket connection ID */
  wsConnectionId: string;
  
  /** Last heartbeat timestamp */
  lastHeartbeat: number;
}

// ============================================================================
// PAYMENT & SUBSCRIPTION TOKENS
// ============================================================================

/**
 * PaymentToken - Tokenized payment method (credit card, crypto wallet)
 * 
 * Format: `gpt_<provider>_<hash>`
 * Example: `gpt_stripe_tok_1A2B3C...`
 * 
 * dk:security Never stores raw card data - uses provider tokens
 * dk:business Supports Stripe, PayPal, Coinbase Commerce, Metamask
 */
export interface PaymentToken {
  token: string;
  userId: string;
  
  /** Payment provider (stripe/paypal/coinbase/metamask) */
  provider: 'stripe' | 'paypal' | 'coinbase' | 'metamask';
  
  /** Provider's customer ID */
  providerCustomerId: string;
  
  /** Provider's payment method ID */
  providerPaymentMethodId: string;
  
  /** Last 4 digits (for display, not security) */
  last4: string;
  
  /** Card brand or wallet type */
  brand: string;
  
  /** Expiration date (MM/YY) */
  expiryDate: string;
  
  /** Billing address hash */
  billingAddressHash: string;
  
  /** Is this the default payment method? */
  isDefault: boolean;
  
  /** Payment method status */
  status: 'active' | 'expired' | 'failed' | 'pending_verification';
  
  createdAt: number;
  updatedAt: number;
}

/**
 * SubscriptionToken - Active subscription to premium features
 * 
 * Format: `gsu_<tier>_<hash>`
 * 
 * dk:business Tiers: free, natural ($4.99/mo), premium ($9.99/mo), enterprise ($49/mo)
 */
export interface SubscriptionToken {
  token: string;
  userId: string;
  
  /** Subscription tier */
  tier: 'free' | 'natural' | 'premium' | 'enterprise';
  
  /** Subscription status */
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  
  /** Current billing period start */
  currentPeriodStart: number;
  
  /** Current billing period end */
  currentPeriodEnd: number;
  
  /** Trial end date (if applicable) */
  trialEnd?: number;
  
  /** Cancel at period end? */
  cancelAtPeriodEnd: boolean;
  
  /** Subscription features */
  features: {
    naturalMode: boolean;           // Schumann resonance lock (Natural tier+)
    unlimitedSessions: boolean;     // Remove session time limits (Premium+)
    customAudioEngine: boolean;     // Full audio customization (Premium+)
    pluginAccess: boolean;          // Access to game mode plugins (Premium+)
    prioritySupport: boolean;       // Email support (Enterprise)
    whiteLabel: boolean;            // Remove branding (Enterprise)
    apiAccess: boolean;             // REST API access (Enterprise)
  };
  
  /** Payment token used for billing */
  paymentTokenId: string;
  
  createdAt: number;
  updatedAt: number;
  canceledAt?: number;
}

// ============================================================================
// SECURITY & CRYPTOGRAPHY
// ============================================================================

/**
 * EncryptedDataPacket - Encrypted payload for sensitive data
 * 
 * dk:security AES-256-GCM encryption with unique IV per message
 * dk:architecture Used for transmitting payment data, location, personal info
 */
export interface EncryptedDataPacket {
  /** Encrypted data (base64) */
  ciphertext: string;
  
  /** Initialization vector (base64) */
  iv: string;
  
  /** Authentication tag (base64) */
  authTag: string;
  
  /** Encryption algorithm version */
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  
  /** Key ID (references key in key management service) */
  keyId: string;
  
  /** Timestamp of encryption */
  encryptedAt: number;
}

/**
 * SignedMessage - Cryptographically signed message for integrity verification
 * 
 * dk:security HMAC-SHA256 or Ed25519 signature
 */
export interface SignedMessage {
  /** Message payload (JSON string) */
  payload: string;
  
  /** Signature (hex or base64) */
  signature: string;
  
  /** Signature algorithm */
  algorithm: 'hmac-sha256' | 'ed25519';
  
  /** Public key ID (for Ed25519) */
  publicKeyId?: string;
  
  /** Timestamp of signing */
  signedAt: number;
}

/**
 * CSRFToken - Cross-Site Request Forgery protection token
 * 
 * Format: `csrf_<sessionId>_<hash>`
 * 
 * dk:security One-time use, rotates on every state-changing request
 */
export interface CSRFToken {
  token: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  
  /** Has this token been used? */
  used: boolean;
  
  /** Request path this token is valid for */
  path: string;
}

// ============================================================================
// LOCATION & GEOSPATIAL
// ============================================================================

/**
 * AnonymizedLocation - City-level location data (NOT GPS coordinates)
 * 
 * dk:privacy No precise GPS - only city/region for telemetry and matchmaking
 * dk:architecture Used for geographic audio phasing in network heartbeat
 */
export interface AnonymizedLocation {
  /** City name */
  city: string;
  
  /** Region/State */
  region: string;
  
  /** Country (ISO 3166-1 alpha-2) */
  countryCode: string;
  
  /** Timezone (IANA) */
  timezone: string;
  
  /** Approximate latitude (rounded to 1 decimal place) */
  approximateLatitude: number;
  
  /** Approximate longitude (rounded to 1 decimal place) */
  approximateLongitude: number;
  
  /** IP geolocation confidence (0-100) */
  confidence: number;
  
  /** ASN (Autonomous System Number) for ISP identification */
  asn: number;
  
  /** ISP name */
  isp: string;
}

/**
 * GeographicDistance - Distance between two players (for audio phasing)
 * 
 * dk:music Distance affects network heartbeat polyrhythm timing
 * dk:vision Players 5000km apart have 50ms base latency = musical syncopation
 */
export interface GeographicDistance {
  /** Player 1 hashed user ID */
  player1Id: string;
  
  /** Player 2 hashed user ID */
  player2Id: string;
  
  /** Distance in kilometers (city-to-city) */
  distanceKm: number;
  
  /** Estimated network latency (ms) based on distance */
  estimatedLatencyMs: number;
  
  /** Actual measured latency (ms) from ping */
  measuredLatencyMs?: number;
  
  /** Time difference in hours */
  timezoneOffsetHours: number;
}

// ============================================================================
// AUDIO & VIDEO COMMUNICATION
// ============================================================================

/**
 * AudioChannelToken - Token for WebRTC audio communication
 * 
 * Format: `gac_<channelId>_<hash>`
 * 
 * dk:architecture Enables voice chat between resistance members
 * dk:music Applies bioacoustic frequency manipulation to voice chat
 */
export interface AudioChannelToken {
  token: string;
  channelId: string;
  userId: string;
  
  /** WebRTC signaling server URL */
  signalingServer: string;
  
  /** STUN server URLs */
  stunServers: string[];
  
  /** TURN server credentials (for NAT traversal) */
  turnServers: Array<{
    urls: string[];
    username: string;
    credential: string;
  }>;
  
  /** Audio codec preference */
  preferredCodec: 'opus' | 'pcm' | 'g722';
  
  /** Enable bioacoustic frequency manipulation? */
  enableBioacousticManipulation: boolean;
  
  /** Channel permissions */
  permissions: {
    canSpeak: boolean;
    canListen: boolean;
    canModerate: boolean;
  };
  
  issuedAt: number;
  expiresAt: number;
}

/**
 * VideoStreamToken - Token for surveillance camera feeds
 * 
 * Format: `gvs_<streamId>_<hash>`
 * 
 * dk:narrative Operators watch live video feeds from surveillance cameras
 */
export interface VideoStreamToken {
  token: string;
  streamId: string;
  userId: string;
  
  /** Stream source URL (HLS/WebRTC) */
  streamUrl: string;
  
  /** Stream quality */
  quality: 'low' | 'medium' | 'high' | 'adaptive';
  
  /** Camera location hash */
  cameraLocationHash: string;
  
  /** Camera type */
  cameraType: 'fixed' | 'ptz' | 'bodycam' | 'drone';
  
  /** Can control PTZ (pan/tilt/zoom)? */
  canControlCamera: boolean;
  
  issuedAt: number;
  expiresAt: number;
}

// ============================================================================
// SMS & MESSAGING
// ============================================================================

/**
 * SMSVerificationToken - SMS verification for 2FA and phone confirmation
 * 
 * Format: `gsv_<phoneHash>_<code>`
 * 
 * dk:security 6-digit code, expires in 5 minutes
 * dk:business Twilio integration for SMS delivery
 */
export interface SMSVerificationToken {
  token: string;
  
  /** Phone number hash (never store raw phone) */
  phoneHash: string;
  
  /** Last 4 digits of phone (for display) */
  phoneLast4: string;
  
  /** 6-digit verification code */
  verificationCode: string;
  
  /** Number of verification attempts */
  attempts: number;
  
  /** Maximum attempts before lockout */
  maxAttempts: number;
  
  /** SMS provider (twilio/aws-sns/vonage) */
  provider: 'twilio' | 'aws-sns' | 'vonage';
  
  /** SMS delivery status */
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  
  /** Purpose of verification */
  purpose: '2fa' | 'phone_confirmation' | 'password_reset';
  
  issuedAt: number;
  expiresAt: number;
  verifiedAt?: number;
}

/**
 * InGameMessageToken - Token for in-game messaging (resistance coordination)
 * 
 * Format: `gim_<conversationId>_<hash>`
 * 
 * dk:narrative Resistance members send encrypted messages
 * dk:security End-to-end encrypted using Signal Protocol
 */
export interface InGameMessageToken {
  token: string;
  conversationId: string;
  userId: string;
  
  /** Participants (hashed user IDs) */
  participants: string[];
  
  /** Message encryption key ID */
  encryptionKeyId: string;
  
  /** Can send messages? */
  canSend: boolean;
  
  /** Can read messages? */
  canRead: boolean;
  
  /** Message retention period (hours) */
  retentionHours: number;
  
  issuedAt: number;
  expiresAt: number;
}

// ============================================================================
// DATABASE SCHEMA REFERENCES
// ============================================================================

/**
 * TokenizedReference - Generic tokenized reference to database records
 * 
 * dk:architecture Tokens never expose internal database IDs
 * dk:security One-way hash prevents enumeration attacks
 */
export interface TokenizedReference<T extends string = string> {
  /** Public token */
  token: string;
  
  /** Entity type (user/session/payment/subscription) */
  entityType: T;
  
  /** Internal database ID (hashed) */
  internalIdHash: string;
  
  /** Namespace (multi-tenant support) */
  namespace: string;
  
  createdAt: number;
}

// ============================================================================
// AUDIT & SECURITY LOGGING
// ============================================================================

/**
 * SecurityEvent - Logged security events for audit trail
 * 
 * dk:security Immutable audit log for compliance
 * dk:business Required for SOC 2, GDPR, PCI-DSS compliance
 */
export interface SecurityEvent {
  /** Event ID (UUID) */
  eventId: string;
  
  /** Event type */
  eventType: 
    | 'auth_success'
    | 'auth_failure'
    | 'token_refresh'
    | 'token_revoke'
    | 'payment_success'
    | 'payment_failure'
    | 'subscription_created'
    | 'subscription_canceled'
    | 'account_created'
    | 'account_deleted'
    | 'password_changed'
    | 'email_changed'
    | 'suspicious_activity'
    | 'rate_limit_exceeded'
    | 'api_access';
  
  /** User ID (hashed) */
  userId?: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** IP address hash */
  ipHash: string;
  
  /** User agent hash */
  userAgentHash: string;
  
  /** Event metadata (JSON) */
  metadata: Record<string, unknown>;
  
  /** Risk score (0-100) */
  riskScore: number;
  
  /** Event timestamp */
  timestamp: number;
}

// ============================================================================
// TYPE UNIONS & UTILITIES
// ============================================================================

/**
 * AllTokenTypes - Union of all token types in the system
 */
export type AllTokenTypes =
  | GameAuthToken
  | RefreshToken
  | SessionToken
  | PaymentToken
  | SubscriptionToken
  | CSRFToken
  | AudioChannelToken
  | VideoStreamToken
  | SMSVerificationToken
  | InGameMessageToken;

/**
 * TokenPrefixes - Map token prefixes to types
 */
export const TOKEN_PREFIXES = {
  gat: 'GameAuthToken',
  grt: 'RefreshToken',
  gst: 'SessionToken',
  gpt: 'PaymentToken',
  gsu: 'SubscriptionToken',
  csrf: 'CSRFToken',
  gac: 'AudioChannelToken',
  gvs: 'VideoStreamToken',
  gsv: 'SMSVerificationToken',
  gim: 'InGameMessageToken',
} as const;

/**
 * Parse token prefix to determine type
 */
export function getTokenType(token: string): keyof typeof TOKEN_PREFIXES | null {
  const prefix = token.split('_')[0] as keyof typeof TOKEN_PREFIXES;
  return TOKEN_PREFIXES[prefix] ? prefix : null;
}

// dk:reminder All tokens expire and must be refreshed
// dk:security Never log full tokens - only first/last 4 characters
// dk:architecture Token format: prefix_version_data_hash
// dk:business Premium features gated by SubscriptionToken validation
