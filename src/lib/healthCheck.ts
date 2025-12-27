/**
 * Health Check Utility
 * 
 * Verifies backend is running and ticking before app initialization.
 * Checks session/localStorage state, cache validity, and backend connectivity.
 * 
 * dk:important Run this before mounting React app
 * dk:perf Timeout after 5 seconds to avoid blocking startup
 */

export interface HealthCheckResult {
  backend: {
    reachable: boolean;
    ticking: boolean;
    tickRate: number | null;
    latency: number | null;
    error?: string;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    cacheValid: boolean;
    termsAccepted: boolean;
    lastCacheBust: string | null;
  };
  timestamp: number;
}

const BACKEND_URL = 'http://localhost:8001';
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
const CACHE_VERSION = '24F'; // dk:important Increment on breaking changes

/**
 * Check if backend is reachable and responding
 */
async function checkBackendHealth(): Promise<HealthCheckResult['backend']> {
  const startTime = Date.now();
  
  try {
    // Check REST health endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      return {
        reachable: true,
        ticking: false,
        tickRate: null,
        latency: Date.now() - startTime,
        error: `Backend returned ${response.status}`
      };
    }
    
    const data = await response.json();
    
    // dk:telemetry Backend health endpoint should return tick info
    return {
      reachable: true,
      ticking: data.status === 'running',
      tickRate: data.tick_rate || null,
      latency: Date.now() - startTime,
    };
    
  } catch (error) {
    return {
      reachable: false,
      ticking: false,
      tickRate: null,
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check storage availability and cache validity
 */
function checkStorageHealth(): HealthCheckResult['storage'] {
  let localStorageAvailable = false;
  let sessionStorageAvailable = false;
  
  // Test localStorage
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    localStorageAvailable = true;
  } catch {
    console.warn('localStorage not available');
  }
  
  // Test sessionStorage
  try {
    sessionStorage.setItem('__test__', 'test');
    sessionStorage.removeItem('__test__');
    sessionStorageAvailable = true;
  } catch {
    console.warn('sessionStorage not available');
  }
  
  // Check cache version (bust cache on mismatch)
  const storedVersion = localStorage.getItem('cache_version');
  const cacheValid = storedVersion === CACHE_VERSION;
  
  if (!cacheValid && localStorageAvailable) {
    console.warn(`🔄 Cache version mismatch (stored: ${storedVersion}, current: ${CACHE_VERSION}). Busting cache...`);
    bustCache();
  }
  
  // Check terms acceptance
  const termsAccepted = localStorage.getItem('terms_accepted_v1') === 'true';
  
  // Get last cache bust timestamp
  const lastCacheBust = localStorage.getItem('last_cache_bust');
  
  return {
    localStorage: localStorageAvailable,
    sessionStorage: sessionStorageAvailable,
    cacheValid,
    termsAccepted,
    lastCacheBust
  };
}

/**
 * Bust cache by clearing stored state
 * 
 * dk:important Preserves user preferences and terms acceptance
 * dk:business Only clear ephemeral state, not consent records
 */
function bustCache() {
  if (!localStorage) return;
  
  // Preserve important data
  const preserve = {
    terms_accepted: localStorage.getItem('terms_accepted_v1'),
    user_preferences: localStorage.getItem('user_preferences'),
    telemetry_consent: localStorage.getItem('telemetry_consent'),
    // dk:business Never clear consent records - legal requirement
  };
  
  // Clear everything
  localStorage.clear();
  
  // Restore preserved data
  Object.entries(preserve).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });
  
  // Set new cache version
  localStorage.setItem('cache_version', CACHE_VERSION);
  localStorage.setItem('last_cache_bust', new Date().toISOString());
  
  console.log(`✅ Cache busted. Version: ${CACHE_VERSION}`);
}

/**
 * Run comprehensive health check
 * 
 * dk:important Call this before React app mounts
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log('🏥 Running health check...');
  
  const [backend, storage] = await Promise.all([
    checkBackendHealth(),
    Promise.resolve(checkStorageHealth())
  ]);
  
  const result: HealthCheckResult = {
    backend,
    storage,
    timestamp: Date.now()
  };
  
  // Log results
  console.group('🏥 Health Check Results');
  console.log('Backend:', backend);
  console.log('Storage:', storage);
  console.groupEnd();
  
  // Store result
  if (storage.sessionStorage) {
    sessionStorage.setItem('health_check', JSON.stringify(result));
  }
  
  return result;
}

/**
 * Force cache bust (manual trigger)
 */
export function forceCacheBust() {
  console.log('🔄 Forcing cache bust...');
  bustCache();
  window.location.reload();
}

/**
 * Get current cache version
 */
export function getCacheVersion(): string {
  return CACHE_VERSION;
}

/**
 * Check if backend is healthy (from last health check)
 */
export function isBackendHealthy(): boolean {
  try {
    const stored = sessionStorage.getItem('health_check');
    if (!stored) return false;
    
    const result: HealthCheckResult = JSON.parse(stored);
    return result.backend.reachable && result.backend.ticking;
  } catch {
    return false;
  }
}

// dk:debug Expose to window for manual testing
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).healthCheck = {
    run: runHealthCheck,
    bustCache: forceCacheBust,
    getVersion: getCacheVersion,
    isHealthy: isBackendHealthy
  };
}
