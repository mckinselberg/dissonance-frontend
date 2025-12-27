/**
 * useLocalStorage Hook
 * 
 * Persist state to localStorage with automatic serialization/deserialization.
 * Perfect for long-term settings (audio presets, user preferences, compliance history).
 * 
 * dk:ux State persists across browser sessions (until user clears data)
 * dk:privacy Only store non-sensitive data (no auth tokens, personal info)
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to sync state with localStorage
 * 
 * @param key - localStorage key (namespaced as `signalnet:${key}`)
 * @param initialValue - Default value if key doesn't exist
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Namespace keys to avoid collisions
  const namespacedKey = `signalnet:${key}`;
  
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(namespacedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${namespacedKey}":`, error);
      return initialValue;
    }
  });
  
  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(namespacedKey, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${namespacedKey}":`, error);
    }
  }, [namespacedKey, storedValue]);
  
  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(namespacedKey);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${namespacedKey}":`, error);
    }
  }, [namespacedKey, initialValue]);
  
  // Listen for storage events (changes in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === namespacedKey && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn('Error parsing storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [namespacedKey]);
  
  return [storedValue, setValue, removeValue];
}

// dk:reminder Consider adding schema versioning for settings migration
// dk:perf Debounce writes if settings change rapidly (e.g., slider dragging)
