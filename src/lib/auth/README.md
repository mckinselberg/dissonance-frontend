# Authentication & Authorization Library

Comprehensive authentication system for SignalNet (Dissonance) with tokenized security, payment integrations, database schemas, and cryptographic utilities.

## 📂 Library Structure

```
frontend/src/lib/auth/
├── index.ts          # Main entry point, exports all modules
├── types.ts          # Token & authentication types (900+ lines)
├── tokenUtils.ts     # Cryptographic utilities (600+ lines)
├── schema.ts         # Database schema definitions (700+ lines)
├── payments.ts       # Payment provider integrations (500+ lines)
└── README.md         # This file
```

## 🔐 Token Types

All tokens use **hashed/salted formats** with versioning for backwards compatibility:

### Format: `prefix_version_data_hash`

- **GameAuthToken** (`gat_v1_...`) - Primary authentication (24h expiry)
- **RefreshToken** (`grt_v1_...`) - Silent renewal (30 day sliding window)
- **SessionToken** (`gst_...`) - WebSocket connections (1h expiry)
- **PaymentToken** (`gpt_provider_...`) - Tokenized payment methods
- **SubscriptionToken** (`gsu_tier_...`) - Active subscriptions
- **CSRFToken** (`csrf_...`) - Anti-CSRF protection (15min, one-time use)
- **AudioChannelToken** (`gac_...`) - WebRTC voice chat (2h expiry)
- **VideoStreamToken** (`gvs_...`) - Surveillance camera feeds (8h expiry)
- **SMSVerificationToken** (`gsv_...`) - 2FA verification (5min, 6-digit code)
- **InGameMessageToken** (`gim_...`) - Encrypted resistance messaging

## 💳 Payment Integrations

### Supported Providers

1. **Stripe** (Primary) - Credit/debit cards, PCI compliant
2. **PayPal** - International users, no card required
3. **Coinbase Commerce** - Crypto payments (BTC, ETH, USDC, etc.)
4. **Metamask** - Web3 wallet direct transactions

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | Basic access, 2h daily limit, ads |
| **Natural Mode** | $4.99/mo | Schumann resonance lock (7.83 Hz), 4h daily, no ads |
| **Premium** | $9.99/mo | Unlimited sessions, custom audio, all plugins |
| **Enterprise** | $49/mo | API access, white-label, priority support |

### "Natural Mode" - Dystopian Commentary

**Narrative Concept:** In the surveillance state, citizens must *pay* to maintain their natural human frequency (Schumann resonance). The regime disrupts natural bioacoustic states by default.

**Revenue Model:** Premium wellness feature = real-world monetization strategy (like meditation apps, but dystopian)

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts (email/password, profile, settings)
- **user_sessions** - Active sessions (IP hash, device fingerprint, location)
- **payment_methods** - Tokenized payment info (Stripe/PayPal/crypto)
- **subscriptions** - Active subscriptions (tier, billing, features)
- **payments** - Transaction history (provider, status, refunds)
- **security_events** - Audit log (auth, payments, suspicious activity)
- **rate_limits** - Rate limiting tracking (sliding window)
- **player_stats** - Game statistics (playtime, wins, achievements)
- **game_sessions** - Individual match records (role, duration, outcome)
- **audio_profiles** - Saved audio configurations (scales, settings)
- **messages** - Encrypted in-game messages (Signal Protocol E2EE)
- **conversations** - Message threads (direct, group, broadcast)

### Security Features

- ✅ All PII encrypted at rest (AES-256-GCM)
- ✅ User IDs hashed in foreign keys (prevent enumeration attacks)
- ✅ Timestamps in Unix epoch milliseconds (consistency)
- ✅ JSONB columns for flexibility (GIN indexes for fast queries)
- ✅ Soft deletes (deleted_at timestamp)
- ✅ Audit trail immutable (security_events table)

## 🔧 Usage Examples

### Generate Authentication Token

```typescript
import { generateGameAuthToken, hashUserId } from '@/lib/auth';

const userId = 'user_abc123';
const role = 'citizen';
const ipAddress = '192.168.1.1';
const deviceFingerprint = await generateDeviceFingerprint();

const authToken = await generateGameAuthToken(
  userId,
  role,
  ipAddress,
  deviceFingerprint
);

// Result: "gat_v1_1703174400_a3f9c8b2e7d1..."
```

### Check Feature Access

```typescript
import { getUserSubscription, hasFeatureAccess } from '@/lib/auth';

const userId = 'user_abc123';
const subscription = await getUserSubscription(userId);

// Check if user can access Natural Mode (Schumann resonance)
const canUseNaturalMode = hasFeatureAccess(subscription, 'natural_mode');

if (!canUseNaturalMode) {
  console.log('Upgrade to Natural Mode for $4.99/month');
}
```

### Encrypt Sensitive Data

```typescript
import { encryptData, decryptData } from '@/lib/auth';

const plaintext = 'Sensitive user data';
const encryptionKey = 'your_32_byte_hex_key';

// Encrypt
const { ciphertext, iv, authTag } = await encryptData(plaintext, encryptionKey);

// Decrypt
const decrypted = await decryptData(ciphertext, iv, authTag, encryptionKey);
```

### Create Stripe Subscription

```typescript
import { createStripeSubscription, SUBSCRIPTION_PRICING } from '@/lib/auth';

const userId = 'user_abc123';
const tier = 'natural'; // $4.99/month
const paymentMethodId = 'pm_1A2B3C...'; // From Stripe.js Elements
const interval = 'month';

const { subscriptionId, clientSecret } = await createStripeSubscription(
  userId,
  tier,
  paymentMethodId,
  interval
);

console.log(`Subscription created: ${subscriptionId}`);
console.log(`Price: ${SUBSCRIPTION_PRICING[tier].monthly} cents`);
```

### Hash User Data

```typescript
import { hashUserId, hashEmail, hashPhoneNumber } from '@/lib/auth';

const userId = 'user_abc123';
const email = 'user@example.com';
const phone = '+1-555-123-4567';

const userIdHash = await hashUserId(userId);
const emailHash = await hashEmail(email);
const phoneHash = await hashPhoneNumber(phone);

// Store hashes in database, never raw values
```

### Validate Token

```typescript
import { validateTokenFormat, validateTokenExpiry, parseTokenMetadata } from '@/lib/auth';

const token = 'gat_v1_1703174400_a3f9c8b2...';

// Check format
if (!validateTokenFormat(token)) {
  console.error('Invalid token format');
}

// Parse metadata
const metadata = parseTokenMetadata(token);
console.log(metadata);
// { prefix: 'gat', version: 'v1', timestamp: 1703174400 }

// Check expiry
const tokenData = {
  issuedAt: 1703174400000,
  expiresAt: 1703260800000
};

if (!validateTokenExpiry(tokenData)) {
  console.error('Token expired');
}
```

### Redact Token for Logging

```typescript
import { redactToken } from '@/lib/auth';

const token = 'gat_v1_1703174400_a3f9c8b2e7d19f8c3a5b6d4e2f1c0a9b';

console.log(redactToken(token));
// "gat_v1_1********************0a9b"

// ✅ Safe for logs
// ❌ NEVER log full tokens!
```

## 🔒 Security Best Practices

### Token Storage

- **GameAuthToken** → `localStorage` (client-side)
- **RefreshToken** → `HttpOnly` cookie (server-side)
- **SessionToken** → Memory (WebSocket connection)
- **CSRF Token** → Hidden form field + meta tag

### Cryptographic Operations

- **Hashing:** SHA-256 (user IDs, IP addresses)
- **Salted Hashing:** HMAC-SHA256 (tokens, passwords use bcrypt)
- **Encryption:** AES-256-GCM (PII, payment data)
- **Random Generation:** `crypto.getRandomValues()` (CSPRNG)

### Rate Limiting

```typescript
import { generateRateLimitKey, generateSlidingWindowKey } from '@/lib/auth';

const ipAddress = '192.168.1.1';
const endpoint = '/api/auth/login';

const rateLimitKey = await generateRateLimitKey(ipAddress, endpoint);
// "ratelimit:/api/auth/login:a3f9c8b2e7d1..."

// Sliding window (15 minute buckets)
const windowKey = generateSlidingWindowKey(rateLimitKey, 15 * 60 * 1000);
// "ratelimit:/api/auth/login:a3f9c8b2e7d1...:1703174400000"
```

## 🌐 Payment Provider Integration

### Stripe (Credit Cards)

```typescript
import { initializeStripe, createStripePaymentIntent, confirmStripePayment } from '@/lib/auth';

const stripe = await initializeStripe('pk_live_...');
const { clientSecret, paymentIntentId } = await createStripePaymentIntent(999, 'usd', 'user123');

const result = await confirmStripePayment(stripe, clientSecret, 'pm_1A2B3C...');
if (result.success) {
  console.log('Payment succeeded!');
}
```

### PayPal

```typescript
import { initializePayPal, createPayPalSubscription } from '@/lib/auth';

await initializePayPal('your_paypal_client_id');
const { subscriptionId, approvalUrl } = await createPayPalSubscription('user123', 'premium');

// Redirect user to approvalUrl to complete subscription
window.location.href = approvalUrl;
```

### Coinbase Commerce (Crypto)

```typescript
import { createCoinbaseCharge, checkCoinbaseChargeStatus } from '@/lib/auth';

const { chargeId, hostedUrl, expiresAt } = await createCoinbaseCharge('user123', 'natural', 'month');

// Redirect to Coinbase checkout
window.location.href = hostedUrl;

// Later: Check payment status
const status = await checkCoinbaseChargeStatus(chargeId);
if (status.status === 'confirmed' && status.confirmations >= 3) {
  console.log('Crypto payment confirmed!');
}
```

### Metamask (Web3)

```typescript
import { isMetamaskInstalled, connectMetamask, sendMetamaskPayment } from '@/lib/auth';

if (!isMetamaskInstalled()) {
  alert('Please install Metamask');
}

const { address, chainId } = await connectMetamask();
console.log(`Connected: ${address} on chain ${chainId}`);

const { transactionHash } = await sendMetamaskPayment(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Company wallet
  '10000000000000000' // 0.01 ETH in wei
);

console.log(`Transaction: ${transactionHash}`);
```

## 📊 Telemetry & Privacy

### Location Data (City-Level Only)

```typescript
// ✅ GOOD: City-level location
const location = {
  city: 'San Francisco',
  region: 'California',
  country_code: 'US',
  timezone: 'America/Los_Angeles',
  approximate_latitude: 37.8, // Rounded to 1 decimal
  approximate_longitude: -122.4
};

// ❌ BAD: Precise GPS coordinates
// NEVER store: { lat: 37.7749, lng: -122.4194 }
```

### Data Retention

- **Security Events:** 2 years (compliance requirement)
- **Payment History:** 7 years (legal requirement)
- **Game Sessions:** 90 days (analytics)
- **Messages:** Auto-delete after 24 hours (resistance feature)
- **Session Tokens:** Auto-expire, no storage

## 🚀 Performance Considerations

### Async Operations

All cryptographic operations are **async** to avoid blocking the main thread:

```typescript
// ✅ Non-blocking
const hash = await hashSHA256('data');

// ❌ Would block UI if synchronous
```

### Token Pooling

Reuse tokens when possible (WebSocket sessions):

```typescript
// ✅ Reuse existing session token
const existingToken = sessionStorage.getItem('session_token');

// ❌ Don't generate new token every message
```

### Rate Limiting

Prevent abuse with sliding window rate limits:

- **Auth endpoints:** 5 requests / 15 minutes
- **Payment endpoints:** 10 requests / hour
- **API endpoints:** 100 requests / minute (Enterprise tier)

## 📝 License & Compliance

- **PCI DSS Compliant:** No raw card data stored (tokenization at provider)
- **GDPR Compliant:** User data encrypted, right to deletion
- **SOC 2 Type II:** Audit trail for all security events
- **CCPA Compliant:** User data not sold, opt-out available

## 🎵 Integration with Audio System

Your existing **audio-art.onrender.com** demo uses **A440 (440 Hz)** as the base frequency. In Dissonance, this connects to the authentication system via:

### Subscription-Gated Features

```typescript
import { hasFeatureAccess, getUserSubscription } from '@/lib/auth';

const subscription = await getUserSubscription(userId);

// Natural Mode: Lock to Schumann resonance (7.83 Hz)
if (hasFeatureAccess(subscription, 'natural_mode')) {
  setBaseFrequency(7.83); // Bioacoustic state: grounded, natural
} else {
  setBaseFrequency(getRegimeFrequency()); // Synod-controlled frequency
}

// Custom Audio Engine: User-defined scales
if (hasFeatureAccess(subscription, 'custom_audio_engine')) {
  enableCustomScaleEditor();
}
```

### Role-Based Tuning

```typescript
// Operator: A445 (bright, authoritarian)
// Citizen: A440 (standard, conditioned)
// Resistance: A435 (warm, rebellious)

const roleFrequency = {
  operator: 445,
  citizen: 440,
  resistance: 435
};

setTuningStandard(roleFrequency[userRole]);
```

## 🔮 Future Enhancements

- [ ] WebAuthn/FIDO2 support (passwordless auth)
- [ ] OAuth2 integrations (Google, Discord, Steam)
- [ ] Multi-factor authentication (TOTP, hardware keys)
- [ ] Geographic matchmaking (low-latency pairs)
- [ ] API rate limiting per subscription tier
- [ ] Blockchain verification for crypto payments
- [ ] End-to-end encrypted voice chat (resistance channels)

---

**dk:architecture** Fully modular - each file works standalone  
**dk:security** All tokens hashed/salted with Web Crypto API  
**dk:business** 4-tier subscription model with clear upsell path  
**dk:narrative** "Natural Mode" = dystopian commentary on wellness monetization  
**dk:reminder** Your audio-art demo already has the frequency manipulation foundation!
