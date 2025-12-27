/**
 * Bioacoustic State Display Component
 * 
 * Visualizes current psychological state and allows manual control.
 * Shows frequency ranges, brainwave targets, and biological effects.
 * 
 * dk:vision EEG monitor aesthetic - medical surveillance device
 * dk:narrative UI reveals the regime's manipulation tactics
 * dk:ux Color-coded states make psychological manipulation visible
 */

import React, { useRef, useEffect } from 'react';
import { PSYCHOLOGICAL_STATES } from '../lib/bioacousticFrequencies';
import type { BioacousticSettings, BioacousticState } from '../hooks/useBioacousticState';

export interface BioacousticStateDisplayProps {
  currentState: BioacousticState;
  settings: BioacousticSettings;
  onSettingsChange: (settings: Partial<BioacousticSettings>) => void;
  availableStates: (keyof typeof PSYCHOLOGICAL_STATES)[];
  onForceState?: (state: keyof typeof PSYCHOLOGICAL_STATES) => void;
  compact?: boolean;
}

export const BioacousticStateDisplay: React.FC<BioacousticStateDisplayProps> = ({
  currentState,
  settings,
  onSettingsChange,
  availableStates,
  onForceState,
  compact = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const stateConfig = PSYCHOLOGICAL_STATES[currentState.currentState];
  const stateColor = stateConfig.color;
  
  /**
   * Draw frequency waveform visualization
   */
  useEffect(() => {
    if (!canvasRef.current || !settings.showFrequencyDisplay) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let time = 0;
    
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw frequency waveform
      ctx.strokeStyle = stateColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < width; x++) {
        // Base frequency wave
        const baseY = height / 2 + 
          Math.sin((x / width) * Math.PI * 4 + time * currentState.baseFrequency / 10) * 
          (height / 4);
        
        // Modulation envelope
        const modEnv = Math.sin(time * currentState.modulationFrequency);
        const y = baseY + modEnv * (height / 8);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Draw LFO indicator (moving circle)
      const lfoX = (Math.sin(time * currentState.lfoRate) * 0.5 + 0.5) * width;
      const lfoY = height / 2;
      
      ctx.fillStyle = stateColor;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(lfoX, lfoY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      
      // Draw frequency labels
      ctx.fillStyle = stateColor;
      ctx.font = '10px monospace';
      ctx.fillText(`${currentState.baseFrequency.toFixed(1)} Hz`, 5, 15);
      ctx.fillText(`LFO: ${currentState.lfoRate.toFixed(1)} Hz`, 5, 30);
      ctx.fillText(`Mod: ${currentState.modulationFrequency.toFixed(1)} Hz`, 5, 45);
      
      time += 0.016; // ~60fps
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    currentState.baseFrequency,
    currentState.lfoRate,
    currentState.modulationFrequency,
    stateColor,
    settings.showFrequencyDisplay
  ]);
  
  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        background: 'rgba(0, 0, 0, 0.6)',
        border: `1px solid ${stateColor}`,
        borderRadius: '4px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: stateColor,
          boxShadow: `0 0 8px ${stateColor}`
        }} />
        <span style={{
          color: stateColor,
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {stateConfig.name} | {currentState.brainwaveTarget}
        </span>
        <span style={{
          color: '#666',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          {currentState.baseFrequency.toFixed(1)} Hz
        </span>
      </div>
    );
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      background: 'rgba(0, 0, 0, 0.8)',
      border: `2px solid ${stateColor}`,
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '400px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: stateColor,
            boxShadow: `0 0 16px ${stateColor}`,
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <div>
            <div style={{
              color: stateColor,
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {stateConfig.name}
            </div>
            <div style={{
              color: '#999',
              fontSize: '12px'
            }}>
              {currentState.brainwaveTarget} Wave State
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onSettingsChange({ enabled: !settings.enabled })}
          style={{
            padding: '4px 12px',
            background: settings.enabled ? stateColor : 'rgba(255, 255, 255, 0.1)',
            border: `1px solid ${settings.enabled ? stateColor : '#666'}`,
            borderRadius: '4px',
            color: settings.enabled ? '#000' : '#999',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {settings.enabled ? 'ACTIVE' : 'DISABLED'}
        </button>
      </div>
      
      {/* Description */}
      <div style={{
        color: '#ccc',
        fontSize: '13px',
        lineHeight: '1.4',
        fontStyle: 'italic'
      }}>
        {stateConfig.description}
      </div>
      
      {/* Frequency Display */}
      {settings.showFrequencyDisplay && (
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(0, 255, 0, 0.2)',
            borderRadius: '4px'
          }}
        />
      )}
      
      {/* Frequency Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '4px'
      }}>
        <div>
          <div style={{ color: '#666', fontSize: '10px' }}>BASE</div>
          <div style={{ color: stateColor, fontSize: '14px', fontWeight: 'bold' }}>
            {currentState.baseFrequency.toFixed(2)} Hz
          </div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: '10px' }}>LFO RATE</div>
          <div style={{ color: stateColor, fontSize: '14px', fontWeight: 'bold' }}>
            {currentState.lfoRate.toFixed(2)} Hz
          </div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: '10px' }}>MODULATION</div>
          <div style={{ color: stateColor, fontSize: '14px', fontWeight: 'bold' }}>
            {currentState.modulationFrequency.toFixed(2)} Hz
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Sub-bass toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <span style={{ color: '#ccc', fontSize: '12px' }}>
            🔊 Sub-Bass Resonance (20-200 Hz)
          </span>
          <input
            type="checkbox"
            checked={settings.subBassEnabled}
            onChange={(e) => onSettingsChange({ subBassEnabled: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
        </label>
        
        {settings.subBassEnabled && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '24px'
          }}>
            <span style={{ color: '#999', fontSize: '11px', minWidth: '60px' }}>
              Volume:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.subBassVolume * 100}
              onChange={(e) => onSettingsChange({ subBassVolume: parseInt(e.target.value) / 100 })}
              style={{ flex: 1 }}
            />
            <span style={{ color: '#999', fontSize: '11px', minWidth: '40px' }}>
              {Math.round(settings.subBassVolume * 100)}%
            </span>
          </label>
        )}
        
        {/* Binaural beats toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <span style={{ color: '#ccc', fontSize: '12px' }}>
            🎧 Binaural Beats (Brainwave Entrainment)
          </span>
          <input
            type="checkbox"
            checked={settings.binauralBeatsEnabled}
            onChange={(e) => onSettingsChange({ binauralBeatsEnabled: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
        </label>
        
        {settings.binauralBeatsEnabled && (
          <>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '24px'
            }}>
              <span style={{ color: '#999', fontSize: '11px', minWidth: '60px' }}>
                Volume:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.binauralVolume * 100}
                onChange={(e) => onSettingsChange({ binauralVolume: parseInt(e.target.value) / 100 })}
                style={{ flex: 1 }}
              />
              <span style={{ color: '#999', fontSize: '11px', minWidth: '40px' }}>
                {Math.round(settings.binauralVolume * 100)}%
              </span>
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '24px'
            }}>
              <span style={{ color: '#999', fontSize: '11px', minWidth: '60px' }}>
                Carrier:
              </span>
              <input
                type="range"
                min="200"
                max="800"
                value={settings.carrierFrequency}
                onChange={(e) => onSettingsChange({ carrierFrequency: parseInt(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ color: '#999', fontSize: '11px', minWidth: '60px' }}>
                {settings.carrierFrequency} Hz
              </span>
            </label>
          </>
        )}
        
        {/* LFO modulation toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}>
          <span style={{ color: '#ccc', fontSize: '12px' }}>
            🌊 LFO Modulation (Music Engine)
          </span>
          <input
            type="checkbox"
            checked={settings.lfoModulationEnabled}
            onChange={(e) => onSettingsChange({ lfoModulationEnabled: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
        </label>
        
        {/* Master intensity */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px'
        }}>
          <span style={{ color: '#ccc', fontSize: '12px', minWidth: '100px' }}>
            🎚️ Master Intensity:
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.intensity * 100}
            onChange={(e) => onSettingsChange({ intensity: parseInt(e.target.value) / 100 })}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#ccc', fontSize: '12px', minWidth: '40px' }}>
            {Math.round(settings.intensity * 100)}%
          </span>
        </label>
        
        {/* Natural mode toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px',
          background: settings.naturalModeEnabled ? 'rgba(34, 139, 34, 0.2)' : 'transparent',
          border: settings.naturalModeEnabled ? '1px solid #228B22' : '1px solid transparent',
          borderRadius: '4px'
        }}>
          <span style={{ 
            color: settings.naturalModeEnabled ? '#228B22' : '#ccc', 
            fontSize: '12px',
            fontWeight: settings.naturalModeEnabled ? 'bold' : 'normal'
          }}>
            🌍 Natural Mode (Schumann Resonance 7.83 Hz)
          </span>
          <input
            type="checkbox"
            checked={settings.naturalModeEnabled}
            onChange={(e) => onSettingsChange({ naturalModeEnabled: e.target.checked })}
            style={{ cursor: 'pointer' }}
          />
        </label>
      </div>
      
      {/* State selector (dev/demo mode) */}
      {onForceState && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginTop: '8px',
          paddingTop: '12px',
          borderTop: '1px solid #333'
        }}>
          <div style={{ color: '#666', fontSize: '10px', marginBottom: '4px' }}>
            FORCE STATE (DEV MODE):
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px'
          }}>
            {availableStates.map((stateName) => {
              const state = PSYCHOLOGICAL_STATES[stateName];
              const isActive = currentState.currentState === stateName;
              
              return (
                <button
                  key={stateName}
                  onClick={() => onForceState(stateName)}
                  style={{
                    padding: '6px 8px',
                    background: isActive ? state.color : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isActive ? state.color : '#333'}`,
                    borderRadius: '4px',
                    color: isActive ? '#000' : state.color,
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  {state.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Warning message */}
      <div style={{
        padding: '8px',
        background: 'rgba(255, 165, 0, 0.1)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        borderRadius: '4px',
        color: '#FFA500',
        fontSize: '10px',
        lineHeight: '1.4'
      }}>
        ⚠️ <strong>Bioacoustic manipulation active.</strong> Frequencies may affect mood, cognition, and physiology. 
        Use with caution. Disable if experiencing discomfort.
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// dk:vision Medical monitor aesthetic makes the manipulation visible and unsettling
// dk:narrative Players SEE the regime's frequency manipulation in real-time
// dk:ux Color-coded states create immediate understanding of psychological state
// dk:ethics Warning message is critical - this is real psychoacoustic manipulation
// dk:business "Natural Mode" premium feature = $4.99/month for Schumann resonance lock
