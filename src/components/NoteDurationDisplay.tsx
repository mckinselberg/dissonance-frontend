/**
 * NoteDurationDisplay Component
 * 
 * Visual feedback for current note duration setting.
 * From MUSIC_PLAYGROUND_FEATURES.md keyboard shortcuts:
 * - A key = Semi-quaver (fast) ♬
 * - Default = Quaver ♪
 * - S key = Crotchet (longer) ♩
 * - D key = Minim (very long) 𝅗𝅥
 * 
 * dk:ux Musical notation symbols are universally understood by musicians
 * dk:music Duration affects envelope timing and rhythm feel
 */

import React from 'react';
import { useSessionStorage } from '../hooks/useSessionStorage';

export type NoteDuration = 'semiquaver' | 'quaver' | 'crotchet' | 'minim';

interface NoteDurationConfig {
  name: string;
  symbol: string;
  durationMs: number;
  description: string;
  keyBinding: string;
}

const DURATION_CONFIG: Record<NoteDuration, NoteDurationConfig> = {
  semiquaver: {
    name: 'Semi-quaver',
    symbol: '♬',
    durationMs: 125,
    description: 'Fast (1/16th note)',
    keyBinding: 'A'
  },
  quaver: {
    name: 'Quaver',
    symbol: '♪',
    durationMs: 250,
    description: 'Default (1/8th note)',
    keyBinding: 'None'
  },
  crotchet: {
    name: 'Crotchet',
    symbol: '♩',
    durationMs: 500,
    description: 'Longer (1/4th note)',
    keyBinding: 'S'
  },
  minim: {
    name: 'Minim',
    symbol: '𝅗𝅥',
    durationMs: 1000,
    description: 'Very long (1/2 note)',
    keyBinding: 'D'
  }
};

interface NoteDurationDisplayProps {
  /** Current duration setting */
  duration?: NoteDuration;
  /** Callback when duration changes via keyboard */
  onDurationChange?: (duration: NoteDuration) => void;
  /** Show keyboard shortcuts hint */
  showHints?: boolean;
  /** Compact mode (smaller display) */
  compact?: boolean;
}

export const NoteDurationDisplay: React.FC<NoteDurationDisplayProps> = ({
  duration: controlledDuration,
  onDurationChange,
  showHints = true,
  compact = false
}) => {
  // Use sessionStorage for current session duration (resets on tab close)
  const [internalDuration, setInternalDuration] = useSessionStorage<NoteDuration>(
    'music:noteDuration',
    'quaver'
  );
  
  const duration = controlledDuration ?? internalDuration;
  const config = DURATION_CONFIG[duration];
  
  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      let newDuration: NoteDuration | null = null;
      
      switch (e.key.toLowerCase()) {
        case 'a':
          newDuration = 'semiquaver';
          break;
        case 's':
          newDuration = 'crotchet';
          break;
        case 'd':
          newDuration = 'minim';
          break;
        default:
          return;
      }
      
      if (newDuration) {
        e.preventDefault();
        setInternalDuration(newDuration);
        onDurationChange?.(newDuration);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDurationChange, setInternalDuration]);
  
  // Cycle through durations on click
  const cycleDuration = () => {
    const durations: NoteDuration[] = ['semiquaver', 'quaver', 'crotchet', 'minim'];
    const currentIndex = durations.indexOf(duration);
    const nextIndex = (currentIndex + 1) % durations.length;
    const newDuration = durations[nextIndex];
    
    setInternalDuration(newDuration);
    onDurationChange?.(newDuration);
  };
  
  if (compact) {
    return (
      <div
        onClick={cycleDuration}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          background: 'rgba(0, 255, 0, 0.1)',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#00ff00',
          userSelect: 'none'
        }}
        title={`${config.name} - ${config.durationMs}ms\n${config.keyBinding !== 'None' ? `Press ${config.keyBinding}` : 'Default'}`}
      >
        <span style={{ fontSize: '20px' }}>{config.symbol}</span>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>{config.durationMs}ms</span>
      </div>
    );
  }
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        borderRadius: '8px',
        minWidth: '200px'
      }}
    >
      {/* Current Duration Display */}
      <div
        onClick={cycleDuration}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px',
          background: 'rgba(0, 255, 0, 0.15)',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 0, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 255, 0, 0.15)';
        }}
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#00ff00'
          }}
        >
          {config.symbol}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
            {config.name}
          </div>
          <div style={{ color: '#00ff00', opacity: 0.7, fontSize: '12px' }}>
            {config.description} • {config.durationMs}ms
          </div>
        </div>
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      {showHints && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px',
            background: 'rgba(0, 255, 0, 0.05)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#00ff00',
            opacity: 0.6
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', opacity: 1 }}>
            Keyboard Shortcuts:
          </div>
          <div>A = Semi-quaver ♬ (fast)</div>
          <div>S = Crotchet ♩ (longer)</div>
          <div>D = Minim 𝅗𝅥 (very long)</div>
          <div style={{ marginTop: '4px', fontSize: '10px', fontStyle: 'italic' }}>
            Click to cycle durations
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to manage note duration with persistence
 * Returns: [duration, setDuration, durationMs]
 */
export function useNoteDuration(
  initialDuration: NoteDuration = 'quaver'
): [NoteDuration, (d: NoteDuration) => void, number] {
  const [duration, setDuration] = useSessionStorage<NoteDuration>(
    'music:noteDuration',
    initialDuration
  );
  
  const durationMs = DURATION_CONFIG[duration].durationMs;
  
  return [duration, setDuration, durationMs];
}

// Export duration config for external use
export { DURATION_CONFIG };

// dk:music Note durations affect ADSR envelope timing (longer notes = longer decay)
// dk:ux Visual feedback prevents confusion about why notes sound different lengths
