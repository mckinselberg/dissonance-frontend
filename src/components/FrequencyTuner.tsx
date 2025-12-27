import { useState, useRef, useEffect } from 'react';
import { setBaseFrequency, getBaseFrequency, getCFromA, TUNING_STANDARDS, TIME_FREQUENCIES } from '../lib/synodScale';

/**
 * FrequencyTuner Component
 * 
 * Allows user to AUDITION base frequencies before committing.
 * 
 * dk:music Press & hold to preview frequency, release to stop
 * dk:vision The 1 Hz heartbeat IS the musical foundation (kick drum)
 * dk:ux This tool lets you choose the ROOT NOTE for your harmonic system
 */

export const FrequencyTuner: React.FC = () => {
  const [frequency, setFrequency] = useState(getBaseFrequency());
  // dk:fix Default to closed (off state) - user must explicitly open
  const [isOpen, setIsOpen] = useState(false);
  const [isAuditioning, setIsAuditioning] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // dk:music Stop auditioning (release button)
  const stopAudition = () => {
    setIsAuditioning(false);
    
    if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const gain = gainNodeRef.current;
      
      // Fade out quickly
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      
      oscillatorRef.current.stop(ctx.currentTime + 0.05);
      oscillatorRef.current = null;
      gainNodeRef.current = null;
    }
  };

  // Initialize audio context on first use
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopAudition();
      audioContextRef.current?.close();
    };
  }, []);

  // dk:music Start auditioning a frequency (press & hold)
  const startAudition = (freq: number) => {
    setIsAuditioning(true);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    
    // Stop previous audition
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    
    // Create oscillator and gain
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine'; // Pure tone for frequency reference
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); // Quick fade in
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
  };

  // dk:music Apply frequency as the new base (commits the choice)
  const applyFrequency = (freq: number) => {
    setFrequency(freq);
    setBaseFrequency(freq);
    stopAudition(); // Stop any active audition
  };

  const presets = [
    // Musical tunings
    { name: 'A440 (ISO Standard)', freq: getCFromA(TUNING_STANDARDS.A440), category: 'Musical' },
    { name: 'A445 (French Sharp)', freq: getCFromA(TUNING_STANDARDS.A445), category: 'Musical' },
    { name: 'A435 (Philharmonic)', freq: getCFromA(TUNING_STANDARDS.A435), category: 'Musical' },
    { name: 'A432 (Verdi/"Natural")', freq: getCFromA(TUNING_STANDARDS.A432), category: 'Musical' },
    { name: 'Scientific C (256 Hz)', freq: 256, category: 'Musical' },
    
    // Time-based
    { name: 'Simulation Tick (10 Hz)', freq: TIME_FREQUENCIES.tickRate100ms, category: 'Time' },
    { name: 'Seconds/Minute (60 Hz)', freq: TIME_FREQUENCIES.secondsPerMinute, category: 'Time' },
    { name: 'Hours/Day (24 Hz)', freq: TIME_FREQUENCIES.hoursPerDay, category: 'Time' },
    
    // Physiological
    { name: 'Resting Heartbeat (70 Hz)', freq: 70, category: 'Physiological' },
    { name: 'Breathing Rate (16 Hz)', freq: 16, category: 'Physiological' },
  ];

  const groupedPresets = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, typeof presets>);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#ff4444' : '#333',
          color: isOpen ? '#fff' : '#ff4444',
          border: '2px solid #ff4444',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? '✖ Close Tuner' : '🎛️ Tune Frequency'}
      </button>

      {/* Tuner Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '0',
          width: '400px',
          maxHeight: '70vh',
          overflowY: 'auto',
          background: '#1a1a1a',
          border: '2px solid #ff4444',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(255, 68, 68, 0.4)',
          fontFamily: 'monospace',
          color: '#fff'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            color: '#ff4444',
            fontSize: '24px',
            borderBottom: '2px solid #ff4444',
            paddingBottom: '10px'
          }}>
            🎛️ Frequency Tuner
          </h2>

          {/* Current Frequency Display */}
          <div style={{
            padding: '15px',
            background: isAuditioning ? '#332222' : '#252525',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            border: isAuditioning ? '2px solid #ff4444' : '2px solid transparent',
            transition: 'all 0.2s'
          }}>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '5px' }}>
              {isAuditioning ? '🔊 Auditioning...' : 'Current Base Frequency (Middle C)'}
            </div>
            <div style={{ fontSize: '32px', color: '#ff4444', fontWeight: 'bold' }}>
              {frequency.toFixed(2)} Hz
            </div>
          </div>

          {/* Custom Frequency Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ff4444', fontSize: '14px' }}>
              Custom Frequency (Hz)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                min="1"
                max="20000"
                step="0.01"
                value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value) || 261.63)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#252525',
                  border: '2px solid #333',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '16px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onMouseDown={() => startAudition(frequency)}
                onMouseUp={() => stopAudition()}
                onMouseLeave={() => stopAudition()}
                style={{
                  padding: '10px 20px',
                  background: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  userSelect: 'none'
                }}
              >
                🔊 Preview
              </button>
              <button
                onClick={() => applyFrequency(frequency)}
                style={{
                  padding: '10px 20px',
                  background: '#ff4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Preset Categories */}
          {Object.entries(groupedPresets).map(([category, presets]) => (
            <div key={category} style={{ marginBottom: '20px' }}>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#ff4444',
                fontSize: '16px',
                borderBottom: '1px solid #333',
                paddingBottom: '5px'
              }}>
                {category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onMouseDown={() => startAudition(preset.freq)}
                    onMouseUp={() => stopAudition()}
                    onMouseLeave={() => stopAudition()}
                    onClick={() => applyFrequency(preset.freq)}
                    style={{
                      padding: '12px',
                      background: Math.abs(frequency - preset.freq) < 0.1 ? '#ff4444' : '#252525',
                      color: Math.abs(frequency - preset.freq) < 0.1 ? '#fff' : '#ccc',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      userSelect: 'none' // Prevent text selection during press-hold
                    }}
                  >
                    <span>{preset.name}</span>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {preset.freq.toFixed(2)} Hz
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#252525',
            borderRadius: '8px',
            border: '1px solid #333',
            color: '#888',
            fontSize: '12px'
          }}>
            <strong style={{ color: '#ff4444' }}>💡 How to Use:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li><strong>Press & Hold</strong> a button to audition the frequency</li>
              <li><strong>Click</strong> to apply it as your root note</li>
              <li>The 1 Hz heartbeat kick drum is your musical foundation</li>
              <li>All Synod scale intervals build from your chosen root</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// dk:vision Future: Save tuning preferences per-role (Operator/Citizen/Resistance)
// dk:music Time-based frequencies could drive generative bass lines from simulation state
// dk:reminder Add beat frequency visualization when multiple tunings are active
