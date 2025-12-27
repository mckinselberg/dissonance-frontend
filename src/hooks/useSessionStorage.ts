/**
 * useSessionStorage Hook
 * 
 * Persist state to sessionStorage with automatic serialization/deserialization.
 * Perfect for temporary state (current session pitch, active layer volumes, transient UI state).
 * 
 * dk:ux State cleared when browser tab closes (shorter-lived than localStorage)
 * dk:architecture Use for "don't ask again this session" prompts
 */

import { useState, useCallback } from 'react';

/**
 * Hook to sync state with sessionStorage
 * 
 * @param key - sessionStorage key (namespaced as `signalnet:${key}`)
 * @param initialValue - Default value if key doesn't exist
 * @returns [storedValue, setValue, removeValue]
 */
export function useSessionStorage<T>(
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
      const item = window.sessionStorage.getItem(namespacedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${namespacedKey}":`, error);
      return initialValue;
    }
  });
  
  // Return a wrapped version of useState's setter function that persists to sessionStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(namespacedKey, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${namespacedKey}":`, error);
    }
  }, [namespacedKey, storedValue]);
  
  // Remove from sessionStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(namespacedKey);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${namespacedKey}":`, error);
    }
  }, [namespacedKey, initialValue]);
  
  return [storedValue, setValue, removeValue];
}

// dk:reminder sessionStorage doesn't sync across tabs (unlike localStorage)
// dk:ux Good for "current session only" state like active filters, expanded panels
