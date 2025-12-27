/**
 * Database Schema Types
 * 
 * Comprehensive type definitions for PostgreSQL database schema.
 * Covers users, sessions, payments, subscriptions, security, and game state.
 * 
 * dk:architecture Schema designed for PostgreSQL with JSONB for flexibility
 * dk:security All PII is encrypted at rest, hashed IDs in foreign keys
 * dk:performance Indexes on frequently queried fields (userId, timestamps, status)
 */

// ============================================================================
// USER SCHEMA
// ============================================================================

/**
 * User - Core user account table
 * 
 * Table: users
 * Primary Key: id (UUID)
 * Indexes: email_hash, username, created_at
 */
export interface UserSchema {
  /** UUID primary key */
  id: string;
  
  /** Username (unique, public) */
  username: string;
  
  /** Email hash (for lookup, not recovery) */
  email_hash: string;
  
  /** Password hash (bcrypt with 12 rounds) */
  password_hash: string;
  
  /** Account status */
  status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  
  /** Email verified? */
  email_verified: boolean;
  
  /** Phone verified? */
  phone_verified: boolean;
  
  /** Two-factor authentication enabled? */
  twofa_enabled: boolean;
  
  /** Preferred game role */
  preferred_role: 'operator' | 'citizen' | 'resistance' | 'spectator';
  
  /** User profile (JSONB) */
  profile: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    location?: string; // City/region only, not GPS
    timezone?: string;
    language?: string;
  };
  
  /** Account settings (JSONB) */
  settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    telemetry_opt_in: boolean;
    audio_settings_sync: boolean;
  };
  
  /** Account creation timestamp */
  created_at: number;
  
  /** Last update timestamp */
  updated_at: number;
  
  /** Last login timestamp */
  last_login_at: number | null;
  
  /** Soft delete timestamp */
  deleted_at: number | null;
}

/**
 * UserSession - Active user sessions
 * 
 * Table: user_sessions
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id
 * Indexes: user_id, token_hash, expires_at
 */
export interface UserSessionSchema {
  id: string;
  user_id: string;
  
  /** Token hash (for lookup) */
  token_hash: string;
  
  /** Session role */
  role: 'operator' | 'citizen' | 'resistance' | 'spectator';
  
  /** IP address hash */
  ip_hash: string;
  
  /** User agent hash */
  user_agent_hash: string;
  
  /** Device fingerprint */
  device_fingerprint: string;
  
  /** Geographic location (city-level) */
  location: {
    city: string;
    region: string;
    country_code: string;
    timezone: string;
    isp: string;
  } | null;
  
  /** Session metadata (JSONB) */
  metadata: {
    browser?: string;
    os?: string;
    device_type?: 'desktop' | 'mobile' | 'tablet';
  };
  
  /** Session start timestamp */
  created_at: number;
  
  /** Last activity timestamp */
  last_activity_at: number;
  
  /** Session expiry timestamp */
  expires_at: number;
  
  /** Session revoked? */
  revoked: boolean;
  
  /** Revocation reason */
  revoke_reason: string | null;
}

// ============================================================================
// PAYMENT & SUBSCRIPTION SCHEMA
// ============================================================================

/**
 * PaymentMethod - Tokenized payment methods
 * 
 * Table: payment_methods
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id
 * Indexes: user_id, provider_customer_id, status
 */
export interface PaymentMethodSchema {
  id: string;
  user_id: string;
  
  /** Payment provider */
  provider: 'stripe' | 'paypal' | 'coinbase' | 'metamask';
  
  /** Provider's customer ID */
  provider_customer_id: string;
  
  /** Provider's payment method ID */
  provider_payment_method_id: string;
  
  /** Payment method type */
  type: 'card' | 'bank_account' | 'crypto_wallet' | 'paypal_account';
  
  /** Last 4 digits (for display) */
  last4: string;
  
  /** Card brand or wallet type */
  brand: string;
  
  /** Expiration date (MM/YY) */
  expiry_date: string | null;
  
  /** Billing address (encrypted JSONB) */
  billing_address_encrypted: string;
  
  /** Is default payment method? */
  is_default: boolean;
  
  /** Payment method status */
  status: 'active' | 'expired' | 'failed' | 'pending_verification';
  
  /** Verification status (for bank accounts, crypto wallets) */
  verification_status: 'pending' | 'verified' | 'failed' | null;
  
  created_at: number;
  updated_at: number;
}

/**
 * Subscription - Active subscriptions
 * 
 * Table: subscriptions
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id, payment_method_id → payment_methods.id
 * Indexes: user_id, status, current_period_end
 */
export interface SubscriptionSchema {
  id: string;
  user_id: string;
  payment_method_id: string;
  
  /** Subscription tier */
  tier: 'free' | 'natural' | 'premium' | 'enterprise';
  
  /** Provider subscription ID */
  provider_subscription_id: string | null;
  
  /** Subscription status */
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  
  /** Current billing period start */
  current_period_start: number;
  
  /** Current billing period end */
  current_period_end: number;
  
  /** Trial start date */
  trial_start: number | null;
  
  /** Trial end date */
  trial_end: number | null;
  
  /** Cancel at period end? */
  cancel_at_period_end: boolean;
  
  /** Cancellation timestamp */
  canceled_at: number | null;
  
  /** Cancellation reason */
  cancel_reason: string | null;
  
  /** Price per billing period (cents) */
  price_cents: number;
  
  /** Billing interval */
  interval: 'month' | 'year';
  
  /** Subscription features (JSONB) */
  features: {
    natural_mode: boolean;
    unlimited_sessions: boolean;
    custom_audio_engine: boolean;
    plugin_access: boolean;
    priority_support: boolean;
    white_label: boolean;
    api_access: boolean;
  };
  
  created_at: number;
  updated_at: number;
}

/**
 * Payment - Payment transaction records
 * 
 * Table: payments
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id, subscription_id → subscriptions.id
 * Indexes: user_id, subscription_id, status, created_at
 */
export interface PaymentSchema {
  id: string;
  user_id: string;
  subscription_id: string | null;
  
  /** Payment provider */
  provider: 'stripe' | 'paypal' | 'coinbase' | 'metamask';
  
  /** Provider transaction ID */
  provider_transaction_id: string;
  
  /** Payment intent ID (Stripe) */
  payment_intent_id: string | null;
  
  /** Amount in cents (or smallest currency unit) */
  amount_cents: number;
  
  /** Currency code (ISO 4217) */
  currency: string;
  
  /** Payment status */
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
  
  /** Payment method snapshot (JSONB) */
  payment_method_snapshot: {
    type: string;
    last4: string;
    brand: string;
  };
  
  /** Failure reason (if failed) */
  failure_reason: string | null;
  
  /** Failure code (provider-specific) */
  failure_code: string | null;
  
  /** Refund amount (cents) */
  refund_amount_cents: number | null;
  
  /** Refund timestamp */
  refunded_at: number | null;
  
  /** Invoice URL */
  invoice_url: string | null;
  
  /** Payment metadata (JSONB) */
  metadata: {
    description?: string;
    receipt_email?: string;
    statement_descriptor?: string;
  };
  
  created_at: number;
  updated_at: number;
}

// ============================================================================
// SECURITY & AUDIT SCHEMA
// ============================================================================

/**
 * SecurityEvent - Security audit log
 * 
 * Table: security_events
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id (nullable)
 * Indexes: user_id, event_type, risk_score, created_at
 */
export interface SecurityEventSchema {
  id: string;
  user_id: string | null;
  
  /** Session ID (if applicable) */
  session_id: string | null;
  
  /** Event type */
  event_type: 
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
  
  /** IP address hash */
  ip_hash: string;
  
  /** User agent hash */
  user_agent_hash: string;
  
  /** Event metadata (JSONB) */
  metadata: {
    endpoint?: string;
    method?: string;
    status_code?: number;
    error_message?: string;
    [key: string]: unknown;
  };
  
  /** Risk score (0-100) */
  risk_score: number;
  
  /** Automated action taken */
  action_taken: 'none' | 'rate_limit' | 'account_suspend' | 'token_revoke' | null;
  
  /** Event timestamp */
  created_at: number;
}

/**
 * RateLimitEntry - Rate limiting tracking
 * 
 * Table: rate_limits
 * Primary Key: id (UUID)
 * Indexes: key_hash, window_start, expires_at
 */
export interface RateLimitEntrySchema {
  id: string;
  
  /** Rate limit key hash (ip:endpoint) */
  key_hash: string;
  
  /** Sliding window start timestamp */
  window_start: number;
  
  /** Request count in window */
  request_count: number;
  
  /** Maximum requests allowed */
  max_requests: number;
  
  /** Window duration (milliseconds) */
  window_duration_ms: number;
  
  /** Expiry timestamp (for cleanup) */
  expires_at: number;
  
  created_at: number;
  updated_at: number;
}

// ============================================================================
// GAME STATE SCHEMA
// ============================================================================

/**
 * PlayerStats - Player statistics and progression
 * 
 * Table: player_stats
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id
 * Indexes: user_id, total_playtime_seconds
 */
export interface PlayerStatsSchema {
  id: string;
  user_id: string;
  
  /** Total playtime (seconds) */
  total_playtime_seconds: number;
  
  /** Games played by role (JSONB) */
  games_played: {
    operator: number;
    citizen: number;
    resistance: number;
    spectator: number;
  };
  
  /** Wins by role (JSONB) */
  wins: {
    operator: number;
    citizen: number;
    resistance: number;
  };
  
  /** Highest risk score achieved */
  highest_risk_score: number;
  
  /** Lowest concealment achieved */
  lowest_concealment: number;
  
  /** Audio engine stats (JSONB) */
  audio_stats: {
    total_frequency_changes: number;
    bioacoustic_hours: number;
    natural_mode_hours: number;
    custom_scales_created: number;
  };
  
  /** Achievements (array of achievement IDs) */
  achievements: string[];
  
  /** Current level */
  level: number;
  
  /** Experience points */
  experience_points: number;
  
  created_at: number;
  updated_at: number;
}

/**
 * GameSession - Individual game session records
 * 
 * Table: game_sessions
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id
 * Indexes: user_id, role, match_id, started_at
 */
export interface GameSessionSchema {
  id: string;
  user_id: string;
  
  /** Match ID (groups players in same match) */
  match_id: string;
  
  /** Player role in this session */
  role: 'operator' | 'citizen' | 'resistance' | 'spectator';
  
  /** Session duration (seconds) */
  duration_seconds: number;
  
  /** Match outcome */
  outcome: 'win' | 'loss' | 'draw' | 'abandoned';
  
  /** Final risk score */
  final_risk_score: number;
  
  /** Final concealment */
  final_concealment: number;
  
  /** Session stats (JSONB) */
  stats: {
    actions_taken: number;
    messages_sent: number;
    frequency_changes: number;
    detections: number;
    evasions: number;
    [key: string]: unknown;
  };
  
  /** Session start timestamp */
  started_at: number;
  
  /** Session end timestamp */
  ended_at: number;
  
  created_at: number;
}

// ============================================================================
// AUDIO & SETTINGS SCHEMA
// ============================================================================

/**
 * AudioProfile - Saved audio configurations
 * 
 * Table: audio_profiles
 * Primary Key: id (UUID)
 * Foreign Key: user_id → users.id
 * Indexes: user_id, is_default, created_at
 */
export interface AudioProfileSchema {
  id: string;
  user_id: string;
  
  /** Profile name */
  name: string;
  
  /** Is this the default profile? */
  is_default: boolean;
  
  /** Base frequency (Hz) */
  base_frequency: number;
  
  /** Tuning standard (A440/A432/etc) */
  tuning_standard: string;
  
  /** Scale type */
  scale_type: 'synod' | 'pure' | 'traditional' | 'moral_panic' | 'custom';
  
  /** Custom scale definition (JSONB, if custom) */
  custom_scale: {
    intervals: number[]; // Cents from root
    note_names?: string[];
  } | null;
  
  /** Audio engine settings (JSONB) */
  audio_settings: {
    master_volume: number;
    reverb_enabled: boolean;
    delay_enabled: boolean;
    drone_volume: number;
    tension_sensitivity: number;
    layer_crossfade_duration: number;
    [key: string]: unknown;
  };
  
  /** Bioacoustic settings (JSONB) */
  bioacoustic_settings: {
    enabled: boolean;
    sub_bass_enabled: boolean;
    binaural_beats_enabled: boolean;
    lfo_modulation_enabled: boolean;
    intensity: number;
    natural_mode_enabled: boolean;
  };
  
  created_at: number;
  updated_at: number;
}

// ============================================================================
// COMMUNICATION SCHEMA
// ============================================================================

/**
 * Message - In-game messages
 * 
 * Table: messages
 * Primary Key: id (UUID)
 * Foreign Key: sender_id → users.id
 * Indexes: conversation_id, sender_id, created_at
 */
export interface MessageSchema {
  id: string;
  
  /** Conversation ID (groups messages) */
  conversation_id: string;
  
  /** Sender user ID */
  sender_id: string;
  
  /** Encrypted message content */
  content_encrypted: string;
  
  /** Encryption metadata (JSONB) */
  encryption_metadata: {
    algorithm: string;
    iv: string;
    auth_tag: string;
    key_id: string;
  };
  
  /** Message type */
  message_type: 'text' | 'audio' | 'system';
  
  /** Read by user IDs (array) */
  read_by: string[];
  
  /** Message deleted? */
  deleted: boolean;
  
  /** Auto-delete timestamp (resistance messages) */
  auto_delete_at: number | null;
  
  created_at: number;
  updated_at: number;
}

/**
 * Conversation - Message conversation threads
 * 
 * Table: conversations
 * Primary Key: id (UUID)
 * Indexes: created_at
 */
export interface ConversationSchema {
  id: string;
  
  /** Conversation type */
  type: 'direct' | 'group' | 'broadcast';
  
  /** Participant user IDs (array) */
  participants: string[];
  
  /** Conversation metadata (JSONB) */
  metadata: {
    name?: string;
    description?: string;
    avatar_url?: string;
  };
  
  /** Last message timestamp */
  last_message_at: number;
  
  /** Conversation active? */
  active: boolean;
  
  created_at: number;
  updated_at: number;
}

// ============================================================================
// SCHEMA UTILITIES
// ============================================================================

/**
 * Database table names enum
 */
export enum TableName {
  Users = 'users',
  UserSessions = 'user_sessions',
  PaymentMethods = 'payment_methods',
  Subscriptions = 'subscriptions',
  Payments = 'payments',
  SecurityEvents = 'security_events',
  RateLimits = 'rate_limits',
  PlayerStats = 'player_stats',
  GameSessions = 'game_sessions',
  AudioProfiles = 'audio_profiles',
  Messages = 'messages',
  Conversations = 'conversations',
}

// dk:architecture All timestamps are Unix epoch (milliseconds) for consistency
// dk:security All PII fields are encrypted or hashed
// dk:performance JSONB columns indexed with GIN indexes for fast queries
// dk:business Schema supports multi-tenancy via namespace in future
