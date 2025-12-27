/**
 * Payment Integration Utilities
 * 
 * Integration with Stripe, PayPal, Coinbase Commerce, and Metamask
 * for subscription payments and crypto transactions.
 * 
 * dk:business Primary payment provider: Stripe (credit cards)
 * dk:business Secondary: PayPal, Coinbase (crypto), Metamask (Web3)
 * dk:security All payment data tokenized, never stored raw
 */

import type {
  PaymentToken,
  SubscriptionToken,
} from './types';

// ============================================================================
// SUBSCRIPTION PRICING
// ============================================================================

/**
 * Subscription tier pricing (monthly, USD cents)
 */
export const SUBSCRIPTION_PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
    name: 'Free',
    description: 'Basic game access with advertisements',
  },
  natural: {
    monthly: 499, // $4.99/month
    yearly: 4990, // $49.90/year (2 months free)
    name: 'Natural Mode',
    description: 'Unlock Schumann resonance (7.83 Hz) - maintain your natural state',
  },
  premium: {
    monthly: 999, // $9.99/month
    yearly: 9990, // $99.90/year (2 months free)
    name: 'Premium',
    description: 'Unlimited sessions, custom audio engine, all plugins',
  },
  enterprise: {
    monthly: 4900, // $49/month
    yearly: 49000, // $490/year (2 months free)
    name: 'Enterprise',
    description: 'White-label, API access, priority support, custom deployment',
  },
} as const;

/**
 * Feature matrix by tier
 */
export const TIER_FEATURES = {
  free: {
    natural_mode: false,
    unlimited_sessions: false, // 2 hour daily limit
    custom_audio_engine: false,
    plugin_access: false,
    priority_support: false,
    white_label: false,
    api_access: false,
    ads: true,
  },
  natural: {
    natural_mode: true,
    unlimited_sessions: false, // 4 hour daily limit
    custom_audio_engine: false,
    plugin_access: false,
    priority_support: false,
    white_label: false,
    api_access: false,
    ads: false,
  },
  premium: {
    natural_mode: true,
    unlimited_sessions: true,
    custom_audio_engine: true,
    plugin_access: true,
    priority_support: false,
    white_label: false,
    api_access: false,
    ads: false,
  },
  enterprise: {
    natural_mode: true,
    unlimited_sessions: true,
    custom_audio_engine: true,
    plugin_access: true,
    priority_support: true,
    white_label: true,
    api_access: true,
    ads: false,
  },
} as const;

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

/**
 * Initialize Stripe.js (load from CDN)
 * 
 * dk:security Use Stripe Elements for PCI compliance
 */
export async function initializeStripe(publishableKey: string): Promise<unknown> {
  // @ts-expect-error Stripe is loaded via CDN
  if (typeof Stripe === 'undefined') {
    throw new Error('Stripe.js not loaded. Add script tag to HTML.');
  }
  
  // @ts-expect-error Stripe is loaded via CDN
  return Stripe(publishableKey);
}

/**
 * Create Stripe payment intent
 */
export async function createStripePaymentIntent(
  amount: number,
  currency: string,
  userId: string
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> {
  const response = await fetch('/api/payments/stripe/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, user_id: userId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create payment intent: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Confirm Stripe payment
 */
export async function confirmStripePayment(
  stripe: unknown,
  clientSecret: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // @ts-expect-error Stripe types not imported
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (paymentIntent.status === 'succeeded') {
      return { success: true };
    }
    
    return { success: false, error: 'Payment not completed' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Create Stripe subscription
 */
export async function createStripeSubscription(
  userId: string,
  tier: keyof typeof SUBSCRIPTION_PRICING,
  paymentMethodId: string,
  interval: 'month' | 'year'
): Promise<{
  subscriptionId: string;
  clientSecret: string;
}> {
  const response = await fetch('/api/payments/stripe/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      tier,
      payment_method_id: paymentMethodId,
      interval,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create subscription: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Cancel Stripe subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<{ success: boolean }> {
  const response = await fetch('/api/payments/stripe/cancel-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      cancel_at_period_end: cancelAtPeriodEnd,
    }),
  });
  
  return await response.json();
}

// ============================================================================
// PAYPAL INTEGRATION
// ============================================================================

/**
 * Initialize PayPal SDK
 */
export async function initializePayPal(clientId: string): Promise<void> {
  // Load PayPal SDK script
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
  script.async = true;
  
  return new Promise((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Create PayPal subscription
 */
export async function createPayPalSubscription(
  userId: string,
  tier: keyof typeof SUBSCRIPTION_PRICING
): Promise<{
  subscriptionId: string;
  approvalUrl: string;
}> {
  const response = await fetch('/api/payments/paypal/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, tier }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create PayPal subscription: ${response.statusText}`);
  }
  
  return await response.json();
}

// ============================================================================
// COINBASE COMMERCE (CRYPTO PAYMENTS)
// ============================================================================

/**
 * Create Coinbase Commerce charge
 */
export async function createCoinbaseCharge(
  userId: string,
  tier: keyof typeof SUBSCRIPTION_PRICING,
  interval: 'month' | 'year'
): Promise<{
  chargeId: string;
  hostedUrl: string;
  expiresAt: number;
}> {
  const pricing = SUBSCRIPTION_PRICING[tier];
  const amount = interval === 'month' ? pricing.monthly : pricing.yearly;
  
  const response = await fetch('/api/payments/coinbase/create-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      tier,
      amount_cents: amount,
      interval,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create Coinbase charge: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Check Coinbase charge status
 */
export async function checkCoinbaseChargeStatus(
  chargeId: string
): Promise<{
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  confirmations: number;
}> {
  const response = await fetch(`/api/payments/coinbase/charge-status/${chargeId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to check charge status: ${response.statusText}`);
  }
  
  return await response.json();
}

// ============================================================================
// METAMASK (WEB3 CRYPTO)
// ============================================================================

/**
 * Check if Metamask is installed
 */
export function isMetamaskInstalled(): boolean {
  // @ts-expect-error ethereum is injected by Metamask
  return typeof window.ethereum !== 'undefined';
}

/**
 * Connect Metamask wallet
 */
export async function connectMetamask(): Promise<{
  address: string;
  chainId: number;
}> {
  if (!isMetamaskInstalled()) {
    throw new Error('Metamask not installed');
  }
  
  try {
    // @ts-expect-error ethereum is injected by Metamask
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    
    // @ts-expect-error ethereum is injected by Metamask
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    
    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
    };
  } catch (err) {
    throw new Error(`Metamask connection failed: ${err}`);
  }
}

/**
 * Send Metamask payment transaction
 */
export async function sendMetamaskPayment(
  toAddress: string,
  amountWei: string
): Promise<{ transactionHash: string }> {
  if (!isMetamaskInstalled()) {
    throw new Error('Metamask not installed');
  }
  
  try {
    // @ts-expect-error ethereum is injected by Metamask
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    
    // @ts-expect-error ethereum is injected by Metamask
    const transactionHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: accounts[0],
        to: toAddress,
        value: amountWei,
      }],
    });
    
    return { transactionHash };
  } catch (err) {
    throw new Error(`Metamask payment failed: ${err}`);
  }
}

/**
 * Verify Metamask transaction confirmation
 */
export async function verifyMetamaskTransaction(
  transactionHash: string
): Promise<{
  confirmed: boolean;
  confirmations: number;
}> {
  const response = await fetch('/api/payments/metamask/verify-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_hash: transactionHash }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to verify transaction: ${response.statusText}`);
  }
  
  return await response.json();
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get user's active subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionToken | null> {
  const response = await fetch(`/api/subscriptions/user/${userId}`);
  
  if (response.status === 404) {
    return null; // No active subscription
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get subscription: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Check if user has access to feature
 */
export function hasFeatureAccess(
  subscription: SubscriptionToken | null,
  feature: keyof typeof TIER_FEATURES.free
): boolean {
  if (!subscription || subscription.status !== 'active') {
    return TIER_FEATURES.free[feature] ?? false;
  }
  
  const tierFeatures = TIER_FEATURES[subscription.tier];
  return tierFeatures[feature] ?? false;
}

/**
 * Upgrade subscription to higher tier
 */
export async function upgradeSubscription(
  subscriptionId: string,
  newTier: keyof typeof SUBSCRIPTION_PRICING
): Promise<{ success: boolean }> {
  const response = await fetch('/api/subscriptions/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      new_tier: newTier,
    }),
  });
  
  return await response.json();
}

/**
 * Downgrade subscription to lower tier
 */
export async function downgradeSubscription(
  subscriptionId: string,
  newTier: keyof typeof SUBSCRIPTION_PRICING,
  atPeriodEnd: boolean = true
): Promise<{ success: boolean }> {
  const response = await fetch('/api/subscriptions/downgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      new_tier: newTier,
      at_period_end: atPeriodEnd,
    }),
  });
  
  return await response.json();
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  const response = await fetch('/api/subscriptions/reactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_id: subscriptionId }),
  });
  
  return await response.json();
}

// ============================================================================
// PAYMENT METHOD MANAGEMENT
// ============================================================================

/**
 * Add payment method
 */
export async function addPaymentMethod(
  userId: string,
  provider: 'stripe' | 'paypal' | 'coinbase' | 'metamask',
  providerPaymentMethodId: string
): Promise<PaymentToken> {
  const response = await fetch('/api/payment-methods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      provider,
      provider_payment_method_id: providerPaymentMethodId,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add payment method: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Remove payment method
 */
export async function removePaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  });
  
  return await response.json();
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/payment-methods/${paymentMethodId}/set-default`, {
    method: 'POST',
  });
  
  return await response.json();
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format price (cents to display)
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate proration for subscription changes
 */
export function calculateProration(
  currentTier: keyof typeof SUBSCRIPTION_PRICING,
  newTier: keyof typeof SUBSCRIPTION_PRICING,
  interval: 'month' | 'year',
  daysRemaining: number
): number {
  const currentPrice = interval === 'month'
    ? SUBSCRIPTION_PRICING[currentTier].monthly
    : SUBSCRIPTION_PRICING[currentTier].yearly;
  
  const newPrice = interval === 'month'
    ? SUBSCRIPTION_PRICING[newTier].monthly
    : SUBSCRIPTION_PRICING[newTier].yearly;
  
  const daysInPeriod = interval === 'month' ? 30 : 365;
  const unusedCredit = (currentPrice * daysRemaining) / daysInPeriod;
  const newCharge = (newPrice * daysRemaining) / daysInPeriod;
  
  return Math.max(0, newCharge - unusedCredit);
}

/**
 * Validate payment provider availability
 */
export function isPaymentProviderAvailable(
  provider: 'stripe' | 'paypal' | 'coinbase' | 'metamask'
): boolean {
  switch (provider) {
    case 'stripe':
      return true; // Always available
    case 'paypal':
      // @ts-expect-error paypal is loaded via CDN
      return typeof window.paypal !== 'undefined';
    case 'coinbase':
      return true; // Uses hosted checkout
    case 'metamask':
      return isMetamaskInstalled();
    default:
      return false;
  }
}

// dk:business Stripe handles 95% of payments (credit cards)
// dk:business PayPal for international users without cards
// dk:business Coinbase for crypto enthusiasts (Bitcoin, Ethereum, USDC)
// dk:business Metamask for Web3 native users (direct wallet transactions)
// dk:security All payment data tokenized at provider level (PCI compliant)
// dk:narrative "Natural Mode" subscription = dystopian commentary on wellness monetization
