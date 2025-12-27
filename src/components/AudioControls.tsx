/**
 * Audio Controls UI Component
 * 
 * Expressive dials and sliders for real-time audio manipulation:
 * - Master volume
 * - 3-band EQ
 * - Reverb mix
 * - ADSR envelope
 * - Multi-mode filter
 * - LFO modulation
 * 
 * dk:ux Designed for tactile, immediate feedback (like hardware synth)
 * dk:linnstrument MIDI-mappable parameters for Linnstrument/controller use
 */

import React, { useState, useEffect, useRef } from 'react';
import type {
  EQBandSettings,
  ADSREnvelope,
  FilterSettings,
  LFOSettings,
  FilterMode,
  LFOShape
} from '../lib/audioEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface AudioControlsState {
  masterVolume: number;
  eq: {
    low: EQBandSettings;
    mid: EQBandSettings;
    high: EQBandSettings;
  };
  reverb: {
    mix: number;        // 0-1
    decayTime: number;  // seconds
  };
  envelope: ADSREnvelope;
  filter: FilterSettings;
  lfo: LFOSettings;
}

interface AudioControlsProps {
  initialState?: Partial<AudioControlsState>;
  onChange?: (state: AudioControlsState) => void;
  onReset?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AudioControls: React.FC<AudioControlsProps> = ({
  initialState,
  onChange,
  onReset
}) => {
  // Default state
  const [state, setState] = useState<AudioControlsState>({
    masterVolume: initialState?.masterVolume ?? 0.15,  // dk:perf Reduced default to balance all audio systems
    eq: initialState?.eq ?? {
      low: { frequency: 250, gain: 0, Q: 1.0 },
      mid: { frequency: 1000, gain: 0, Q: 1.0 },
      high: { frequency: 4000, gain: 0, Q: 1.0 }
    },
    reverb: initialState?.reverb ?? {
      mix: 0.3,
      decayTime: 2.0
    },
    envelope: initialState?.envelope ?? {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3
    },
    filter: initialState?.filter ?? {
      mode: 'lowpass',
      frequency: 1000,
      resonance: 1,
      gain: 0
    },
    lfo: initialState?.lfo ?? {
      shape: 'sine',
      rate: 1.0,
      depth: 0.5
    }
  });

  // Notify parent of changes
  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  // Update helper
  const updateState = <K extends keyof AudioControlsState>(
    key: K,
    value: Partial<AudioControlsState[K]>
  ) => {
    setState(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'object' 
        ? { ...prev[key], ...value }
        : value
    }));
  };

  const handleReset = () => {
    setState({
      masterVolume: 0.15,  // dk:perf Reset to balanced default
      eq: {
        low: { frequency: 250, gain: 0, Q: 1.0 },
        mid: { frequency: 1000, gain: 0, Q: 1.0 },
        high: { frequency: 4000, gain: 0, Q: 1.0 }
      },
      reverb: { mix: 0.3, decayTime: 2.0 },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
      filter: { mode: 'lowpass', frequency: 1000, resonance: 1, gain: 0 },
      lfo: { shape: 'sine', rate: 1.0, depth: 0.5 }
    });
    onReset?.();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎛️ Audio Engine</h2>
        <button onClick={handleReset} style={styles.resetButton}>
          Reset All
        </button>
      </div>

      {/* Master Volume */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Master Volume</h3>
        <RotaryDial
          label="Volume"
          value={state.masterVolume}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => updateState('masterVolume', value)}
          unit="%"
          displayValue={(v) => Math.round(v * 100)}
        />
      </section>

      {/* 3-Band EQ */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Parametric EQ</h3>
        <div style={styles.dialRow}>
          <EQBandControl
            label="Low"
            band={state.eq.low}
            onChange={(band) => updateState('eq', { low: band })}
          />
          <EQBandControl
            label="Mid"
            band={state.eq.mid}
            onChange={(band) => updateState('eq', { mid: band })}
          />
          <EQBandControl
            label="High"
            band={state.eq.high}
            onChange={(band) => updateState('eq', { high: band })}
          />
        </div>
      </section>

      {/* Reverb */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Convolution Reverb</h3>
        <div style={styles.dialRow}>
          <RotaryDial
            label="Mix"
            value={state.reverb.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateState('reverb', { mix: value })}
            unit="%"
            displayValue={(v) => Math.round(v * 100)}
          />
          <RotaryDial
            label="Decay"
            value={state.reverb.decayTime}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(value) => updateState('reverb', { decayTime: value })}
            unit="s"
          />
        </div>
      </section>

      {/* ADSR Envelope */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>ADSR Envelope</h3>
        <div style={styles.dialRow}>
          <RotaryDial
            label="Attack"
            value={state.envelope.attack}
            min={0.001}
            max={2}
            step={0.001}
            onChange={(value) => updateState('envelope', { attack: value })}
            unit="s"
            displayValue={(v) => v.toFixed(3)}
          />
          <RotaryDial
            label="Decay"
            value={state.envelope.decay}
            min={0.001}
            max={2}
            step={0.001}
            onChange={(value) => updateState('envelope', { decay: value })}
            unit="s"
            displayValue={(v) => v.toFixed(3)}
          />
          <RotaryDial
            label="Sustain"
            value={state.envelope.sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateState('envelope', { sustain: value })}
            unit="%"
            displayValue={(v) => Math.round(v * 100)}
          />
          <RotaryDial
            label="Release"
            value={state.envelope.release}
            min={0.001}
            max={5}
            step={0.001}
            onChange={(value) => updateState('envelope', { release: value })}
            unit="s"
            displayValue={(v) => v.toFixed(3)}
          />
        </div>
        <ADSRVisualizer envelope={state.envelope} />
      </section>

      {/* Multi-Mode Filter */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Multi-Mode Filter</h3>
        <div style={styles.filterControls}>
          <div style={styles.filterModeSelector}>
            <label style={styles.label}>Mode:</label>
            <select
              value={state.filter.mode}
              onChange={(e) => updateState('filter', { mode: e.target.value as FilterMode })}
              style={styles.select}
            >
              <option value="lowpass">Lowpass</option>
              <option value="highpass">Highpass</option>
              <option value="bandpass">Bandpass</option>
              <option value="notch">Notch</option>
              <option value="allpass">Allpass</option>
              <option value="lowshelf">Low Shelf</option>
              <option value="highshelf">High Shelf</option>
              <option value="peaking">Peaking</option>
            </select>
          </div>
          <div style={styles.dialRow}>
            <RotaryDial
              label="Cutoff"
              value={state.filter.frequency}
              min={20}
              max={20000}
              step={1}
              onChange={(value) => updateState('filter', { frequency: value })}
              unit="Hz"
              isLog={true}
            />
            <RotaryDial
              label="Resonance"
              value={state.filter.resonance}
              min={0.1}
              max={30}
              step={0.1}
              onChange={(value) => updateState('filter', { resonance: value })}
              unit="Q"
            />
            {(state.filter.mode === 'peaking' || 
              state.filter.mode === 'lowshelf' || 
              state.filter.mode === 'highshelf') && (
              <RotaryDial
                label="Gain"
                value={state.filter.gain || 0}
                min={-40}
                max={40}
                step={0.5}
                onChange={(value) => updateState('filter', { gain: value })}
                unit="dB"
              />
            )}
          </div>
        </div>
      </section>

      {/* LFO */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>LFO (Modulation)</h3>
        <div style={styles.filterControls}>
          <div style={styles.filterModeSelector}>
            <label style={styles.label}>Shape:</label>
            <select
              value={state.lfo.shape}
              onChange={(e) => updateState('lfo', { shape: e.target.value as LFOShape })}
              style={styles.select}
            >
              <option value="sine">Sine</option>
              <option value="triangle">Triangle</option>
              <option value="square">Square</option>
              <option value="sawtooth">Sawtooth</option>
            </select>
          </div>
          <div style={styles.dialRow}>
            <RotaryDial
              label="Rate"
              value={state.lfo.rate}
              min={0.01}
              max={20}
              step={0.01}
              onChange={(value) => updateState('lfo', { rate: value })}
              unit="Hz"
              displayValue={(v) => v.toFixed(2)}
            />
            <RotaryDial
              label="Depth"
              value={state.lfo.depth}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateState('lfo', { depth: value })}
              unit="%"
              displayValue={(v) => Math.round(v * 100)}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface EQBandControlProps {
  label: string;
  band: EQBandSettings;
  onChange: (band: EQBandSettings) => void;
}

const EQBandControl: React.FC<EQBandControlProps> = ({ label, band, onChange }) => {
  return (
    <div style={styles.eqBand}>
      <div style={styles.eqBandLabel}>{label}</div>
      <RotaryDial
        label="Freq"
        value={band.frequency}
        min={20}
        max={20000}
        step={1}
        onChange={(frequency) => onChange({ ...band, frequency })}
        unit="Hz"
        isLog={true}
        size="small"
      />
      <RotaryDial
        label="Gain"
        value={band.gain}
        min={-12}
        max={12}
        step={0.5}
        onChange={(gain) => onChange({ ...band, gain })}
        unit="dB"
        size="small"
      />
      <RotaryDial
        label="Q"
        value={band.Q}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(Q) => onChange({ ...band, Q })}
        unit=""
        size="small"
      />
    </div>
  );
};

interface RotaryDialProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  displayValue?: (v: number) => string | number;
  size?: 'small' | 'medium' | 'large';
  isLog?: boolean;  // Logarithmic scale (for frequency)
}

const RotaryDial: React.FC<RotaryDialProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
  displayValue,
  size = 'medium',
  isLog = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const dialSize = size === 'small' ? 60 : size === 'large' ? 100 : 80;

  // Convert value to rotation angle (-135° to +135°, 270° total range)
  const valueToAngle = (v: number): number => {
    let normalized;
    if (isLog) {
      // Logarithmic scaling for frequency
      normalized = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
    } else {
      normalized = (v - min) / (max - min);
    }
    return -135 + normalized * 270;
  };

  const angle = valueToAngle(value);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY; // Inverted (up = increase)
      const sensitivity = 0.5;
      let newValue;

      if (isLog) {
        // Logarithmic adjustment
        const logRange = Math.log(max) - Math.log(min);
        const logValue = Math.log(startValueRef.current) + (deltaY * sensitivity * logRange / 100);
        newValue = Math.exp(logValue);
      } else {
        const range = max - min;
        newValue = startValueRef.current + (deltaY * sensitivity * range / 100);
      }

      newValue = Math.max(min, Math.min(max, newValue));
      newValue = Math.round(newValue / step) * step;
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange, isLog]);

  const displayVal = displayValue ? displayValue(value) : value.toFixed(2);

  return (
    <div style={styles.dial}>
      <div style={styles.dialLabel}>{label}</div>
      <svg
        width={dialSize}
        height={dialSize}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={handleMouseDown}
      >
        {/* Outer ring */}
        <circle
          cx={dialSize / 2}
          cy={dialSize / 2}
          r={dialSize / 2 - 5}
          fill="#222"
          stroke="#444"
          strokeWidth="2"
        />
        {/* Value arc */}
        <circle
          cx={dialSize / 2}
          cy={dialSize / 2}
          r={dialSize / 2 - 5}
          fill="none"
          stroke="#00ff00"
          strokeWidth="3"
          strokeDasharray={`${((value - min) / (max - min)) * Math.PI * (dialSize - 10)} ${Math.PI * (dialSize - 10)}`}
          strokeDashoffset={-Math.PI * (dialSize - 10) * 0.25}
          opacity="0.6"
        />
        {/* Pointer line */}
        <line
          x1={dialSize / 2}
          y1={dialSize / 2}
          x2={dialSize / 2 + (dialSize / 2 - 10) * Math.sin((angle * Math.PI) / 180)}
          y2={dialSize / 2 - (dialSize / 2 - 10) * Math.cos((angle * Math.PI) / 180)}
          stroke="#00ff00"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={dialSize / 2} cy={dialSize / 2} r="3" fill="#00ff00" />
      </svg>
      <div style={styles.dialValue}>
        {displayVal}{unit}
      </div>
    </div>
  );
};

// ADSR Visualizer (shows envelope shape)
const ADSRVisualizer: React.FC<{ envelope: ADSREnvelope }> = ({ envelope }) => {
  const width = 300;
  const height = 80;
  const padding = 10;

  const totalTime = envelope.attack + envelope.decay + 0.5 + envelope.release; // 0.5s sustain hold
  const scaleX = (width - 2 * padding) / totalTime;
  const scaleY = height - 2 * padding;

  const attackEnd = envelope.attack * scaleX;
  const decayEnd = attackEnd + envelope.decay * scaleX;
  const sustainEnd = decayEnd + 0.5 * scaleX;
  const releaseEnd = sustainEnd + envelope.release * scaleX;

  const path = `
    M ${padding} ${height - padding}
    L ${padding + attackEnd} ${padding}
    L ${padding + decayEnd} ${padding + (1 - envelope.sustain) * scaleY}
    L ${padding + sustainEnd} ${padding + (1 - envelope.sustain) * scaleY}
    L ${padding + releaseEnd} ${height - padding}
  `;

  return (
    <svg width={width} height={height} style={styles.adsrVisualizer}>
      <path d={path} fill="none" stroke="#00ff00" strokeWidth="2" />
      <text x={padding + attackEnd / 2} y={height - 5} fill="#888" fontSize="10">A</text>
      <text x={padding + attackEnd + (decayEnd - attackEnd) / 2} y={height - 5} fill="#888" fontSize="10">D</text>
      <text x={padding + decayEnd + (sustainEnd - decayEnd) / 2} y={height - 5} fill="#888" fontSize="10">S</text>
      <text x={padding + sustainEnd + (releaseEnd - sustainEnd) / 2} y={height - 5} fill="#888" fontSize="10">R</text>
    </svg>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#111',
    border: '2px solid #00ff00',
    borderRadius: '10px',
    padding: '20px',
    color: '#00ff00',
    fontFamily: 'monospace',
    maxWidth: '900px',
    margin: '20px auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #00ff00',
    paddingBottom: '10px'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  resetButton: {
    background: '#222',
    border: '1px solid #00ff00',
    color: '#00ff00',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '15px',
    color: '#00ff00',
    borderBottom: '1px solid #333',
    paddingBottom: '5px'
  },
  dialRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const
  },
  dial: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '5px'
  },
  dialLabel: {
    fontSize: '12px',
    color: '#888'
  },
  dialValue: {
    fontSize: '14px',
    fontWeight: 'bold' as const
  },
  eqBand: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    background: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  eqBandLabel: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    marginBottom: '5px'
  },
  filterControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  filterModeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  label: {
    fontSize: '14px'
  },
  select: {
    background: '#222',
    border: '1px solid #00ff00',
    color: '#00ff00',
    padding: '5px 10px',
    borderRadius: '5px',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  adsrVisualizer: {
    marginTop: '10px',
    background: '#1a1a1a',
    borderRadius: '5px',
    border: '1px solid #333'
  }
};

// dk:linnstrument Add MIDI learn mode - click dial, move MIDI controller, bind CC
// dk:reminder Add preset system (save/load control states)
// dk:ux Add keyboard shortcuts for quick parameter adjustments
