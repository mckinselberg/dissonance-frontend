/**
 * Authentication & Authorization Library
 * 
 * Comprehensive authentication system with tokenized security,
 * payment integrations, database schemas, and cryptographic utilities.
 * 
 * @module lib/auth
 */

// Type definitions
export * from './types';
export * from './schema';

// Utilities
export * from './tokenUtils';
export * from './payments';

// Re-export commonly used types
export type {
  GameAuthToken,
  RefreshToken,
  SessionToken,
  PaymentToken,
  SubscriptionToken,
  CSRFToken,
  AudioChannelToken,
  VideoStreamToken,
  SMSVerificationToken,
  InGameMessageToken,
  AllTokenTypes,
} from './types';

export type {
  UserSchema,
  UserSessionSchema,
  PaymentMethodSchema,
  SubscriptionSchema,
  PaymentSchema,
  SecurityEventSchema,
  RateLimitEntrySchema,
  PlayerStatsSchema,
  GameSessionSchema,
  AudioProfileSchema,
  MessageSchema,
  ConversationSchema,
} from './schema';

// Re-export utilities
export {
  generateGameAuthToken,
  generateRefreshToken,
  generateSessionToken,
  generatePaymentToken,
  generateSubscriptionToken,
  generateCSRFToken,
  generateSMSVerificationCode,
  generateAudioChannelToken,
  generateVideoStreamToken,
  hashSHA256,
  hashWithSalt,
  generateSalt,
  validateTokenFormat,
  isTokenExpired,
  calculateExpiryTime,
  validateTokenExpiry,
  hashUserId,
  hashIPAddress,
  hashPhoneNumber,
  hashEmail,
  generateDeviceFingerprint,
  encryptData,
  decryptData,
  redactToken,
  parseTokenMetadata,
} from './tokenUtils';

export {
  SUBSCRIPTION_PRICING,
  TIER_FEATURES,
  initializeStripe,
  createStripePaymentIntent,
  confirmStripePayment,
  createStripeSubscription,
  cancelStripeSubscription,
  initializePayPal,
  createPayPalSubscription,
  createCoinbaseCharge,
  checkCoinbaseChargeStatus,
  isMetamaskInstalled,
  connectMetamask,
  sendMetamaskPayment,
  verifyMetamaskTransaction,
  getUserSubscription,
  hasFeatureAccess,
  upgradeSubscription,
  downgradeSubscription,
  reactivateSubscription,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  formatPrice,
  calculateProration,
  isPaymentProviderAvailable,
} from './payments';

// Constants
export { TOKEN_PREFIXES, getTokenType } from './types';
export { TOKEN_EXPIRY, SALT_LENGTH, TOKEN_VERSION } from './tokenUtils';
export { TableName } from './schema';

/**
 * Library Usage Examples:
 * 
 * ```typescript
 * import {
 *   generateGameAuthToken,
 *   hasFeatureAccess,
 *   SUBSCRIPTION_PRICING,
 *   hashUserId,
 *   encryptData
 * } from '@/lib/auth';
 * 
 * // Generate authentication token
 * const authToken = await generateGameAuthToken(
 *   'user123',
 *   'citizen',
 *   '192.168.1.1',
 *   'device_fingerprint_hash'
 * );
 * 
 * // Check feature access
 * const subscription = await getUserSubscription('user123');
 * const canUseNaturalMode = hasFeatureAccess(subscription, 'natural_mode');
 * 
 * // Get pricing
 * const naturalPrice = SUBSCRIPTION_PRICING.natural.monthly; // 499 cents
 * 
 * // Hash sensitive data
 * const userIdHash = await hashUserId('user123');
 * 
 * // Encrypt sensitive data
 * const { ciphertext, iv, authTag } = await encryptData(
 *   'sensitive data',
 *   'encryption_key_hex'
 * );
 * ```
 * 
 * dk:architecture This library provides everything needed for secure authentication
 * dk:security All tokens are hashed/salted, all PII is encrypted
 * dk:business Subscription system with 4 tiers (free → natural → premium → enterprise)
 * dk:payments Stripe (primary), PayPal, Coinbase, Metamask integrations
 */
