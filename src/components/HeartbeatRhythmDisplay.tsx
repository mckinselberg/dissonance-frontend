/**
 * HeartbeatRhythmDisplay Component
 * 
 * Visualizes network heartbeat sync with musical rhythm.
 * Shows beat grid, packet timing, sync accuracy, and network health.
 * 
 * dk:vision Surveillance state's heartbeat visualized as cardiac monitor
 * dk:music Data packets = drum hits. On-time = green, late = yellow, missed = red
 */

import React, { useEffect, useRef } from 'react';
import type { HeartbeatRhythmSettings } from '../hooks/useHeartbeatRhythm';

interface HeartbeatRhythmDisplayProps {
  /** Current beat number (1-4) */
  currentBeat: number;
  /** Sync accuracy percentage (0-100) */
  syncAccuracy: number;
  /** Average network latency in ms */
  averageLatency: number;
  /** Recent beat events (last 16 beats) */
  beatHistory: Array<{
    beatNumber: number;
    packetReceived: boolean;
    isOnBeat: boolean;
    latencyMs: number;
  }>;
  /** Settings */
  settings: HeartbeatRhythmSettings;
  /** Callback to update settings */
  onSettingsChange: (settings: Partial<HeartbeatRhythmSettings>) => void;
  /** Compact mode */
  compact?: boolean;
}

export const HeartbeatRhythmDisplay: React.FC<HeartbeatRhythmDisplayProps> = ({
  currentBeat,
  syncAccuracy,
  averageLatency,
  beatHistory,
  settings,
  onSettingsChange,
  compact = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animate beat indicators
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw 4-beat grid
    const beatWidth = width / 4;
    
    for (let i = 0; i < 4; i++) {
      const x = i * beatWidth;
      const isCurrentBeat = (i + 1) === currentBeat;
      
      // Beat box
      ctx.strokeStyle = isCurrentBeat ? '#00ff00' : 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = isCurrentBeat ? 3 : 1;
      ctx.strokeRect(x + 2, 2, beatWidth - 4, height - 4);
      
      // Beat number
      ctx.fillStyle = isCurrentBeat ? '#00ff00' : 'rgba(0, 255, 0, 0.5)';
      ctx.font = isCurrentBeat ? 'bold 24px monospace' : '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText((i + 1).toString(), x + beatWidth / 2, height / 2 + 8);
      
      // Beat type label
      const labels = ['KICK', 'HAT', 'SNARE', 'HAT'];
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.fillText(labels[i], x + beatWidth / 2, height - 10);
    }
    
    // Draw recent beat history as timeline
    const historyStart = 10;
    const historyWidth = width - 20;
    const recentBeats = beatHistory.slice(-16); // Last 16 beats
    
    recentBeats.forEach((beat, idx) => {
      const x = historyStart + (idx / 16) * historyWidth;
      const y = 20;
      
      // Color based on timing
      let color = '#00ff00'; // On time
      if (!beat.packetReceived) {
        color = '#ff0000'; // Missed
      } else if (!beat.isOnBeat) {
        color = '#ffff00'; // Late
      }
      
      // Draw beat marker
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw vertical line to grid
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [currentBeat, beatHistory]);
  
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}
      >
        {/* Beat indicator */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3, 4].map(beat => (
            <div
              key={beat}
              style={{
                width: '20px',
                height: '20px',
                background: beat === currentBeat 
                  ? '#00ff00' 
                  : 'rgba(0, 255, 0, 0.2)',
                border: '1px solid #00ff00',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: beat === currentBeat ? 'bold' : 'normal',
                color: beat === currentBeat ? '#000' : '#00ff00'
              }}
            >
              {beat}
            </div>
          ))}
        </div>
        
        {/* Sync accuracy */}
        <div style={{ color: '#00ff00', opacity: 0.8 }}>
          Sync: {syncAccuracy.toFixed(0)}%
        </div>
        
        {/* Latency */}
        <div style={{ 
          color: averageLatency < 50 ? '#00ff00' : averageLatency < 100 ? '#ffff00' : '#ff0000',
          opacity: 0.8
        }}>
          {averageLatency.toFixed(0)}ms
        </div>
      </div>
    );
  }
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        background: '#0a0a0a',
        border: '1px solid rgba(0, 255, 0, 0.3)',
        borderRadius: '8px',
        fontFamily: 'monospace'
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🫀</span>
          <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
            Network Heartbeat Rhythm
          </span>
        </div>
        <div style={{ 
          color: syncAccuracy > 90 ? '#00ff00' : syncAccuracy > 70 ? '#ffff00' : '#ff0000',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {syncAccuracy.toFixed(1)}% sync
        </div>
      </div>
      
      {/* Beat grid canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        style={{
          width: '100%',
          height: 'auto',
          border: '1px solid rgba(0, 255, 0, 0.2)',
          borderRadius: '4px'
        }}
      />
      
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          fontSize: '12px'
        }}
      >
        <div>
          <div style={{ color: 'rgba(0, 255, 0, 0.6)', marginBottom: '4px' }}>
            Tempo
          </div>
          <div style={{ color: '#00ff00', fontSize: '16px', fontWeight: 'bold' }}>
            60 BPM
          </div>
          <div style={{ color: 'rgba(0, 255, 0, 0.5)', fontSize: '10px' }}>
            1 beat/second
          </div>
        </div>
        
        <div>
          <div style={{ color: 'rgba(0, 255, 0, 0.6)', marginBottom: '4px' }}>
            Latency
          </div>
          <div style={{ 
            color: averageLatency < 50 ? '#00ff00' : averageLatency < 100 ? '#ffff00' : '#ff0000',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {averageLatency.toFixed(0)}ms
          </div>
          <div style={{ color: 'rgba(0, 255, 0, 0.5)', fontSize: '10px' }}>
            average
          </div>
        </div>
        
        <div>
          <div style={{ color: 'rgba(0, 255, 0, 0.6)', marginBottom: '4px' }}>
            Packet Loss
          </div>
          <div style={{ 
            color: '#00ff00',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {beatHistory.filter(b => !b.packetReceived).length} / {beatHistory.length}
          </div>
          <div style={{ color: 'rgba(0, 255, 0, 0.5)', fontSize: '10px' }}>
            missed beats
          </div>
        </div>
      </div>
      
      {/* Settings */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
          background: 'rgba(0, 255, 0, 0.05)',
          borderRadius: '4px',
          fontSize: '11px'
        }}
      >
        <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '4px' }}>
          Rhythm Settings
        </div>
        
        {/* Enable/Disable */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onSettingsChange({ enabled: e.target.checked })}
            style={{ accentColor: '#00ff00' }}
          />
          <span style={{ color: '#00ff00' }}>Enable heartbeat rhythm</span>
        </label>
        
        {/* Sync to network */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.syncToNetwork}
            onChange={(e) => onSettingsChange({ syncToNetwork: e.target.checked })}
            style={{ accentColor: '#00ff00' }}
          />
          <span style={{ color: '#00ff00' }}>Sync to network packets</span>
        </label>
        
        {/* Glitch on missed beat */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.missedBeatGlitch}
            onChange={(e) => onSettingsChange({ missedBeatGlitch: e.target.checked })}
            style={{ accentColor: '#00ff00' }}
          />
          <span style={{ color: '#00ff00' }}>Glitch effect on packet loss</span>
        </label>
        
        {/* Volume sliders */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ color: 'rgba(0, 255, 0, 0.7)', marginBottom: '4px' }}>
            Kick Volume: {(settings.kickVolume * 100).toFixed(0)}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.kickVolume * 100}
            onChange={(e) => onSettingsChange({ kickVolume: Number(e.target.value) / 100 })}
            style={{ width: '100%', accentColor: '#00ff00' }}
          />
        </div>
        
        <div>
          <div style={{ color: 'rgba(0, 255, 0, 0.7)', marginBottom: '4px' }}>
            Snare Volume: {(settings.snareVolume * 100).toFixed(0)}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.snareVolume * 100}
            onChange={(e) => onSettingsChange({ snareVolume: Number(e.target.value) / 100 })}
            style={{ width: '100%', accentColor: '#00ff00' }}
          />
        </div>
        
        <div>
          <div style={{ color: 'rgba(0, 255, 0, 0.7)', marginBottom: '4px' }}>
            Hi-hat Volume: {(settings.hihatVolume * 100).toFixed(0)}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.hihatVolume * 100}
            onChange={(e) => onSettingsChange({ hihatVolume: Number(e.target.value) / 100 })}
            style={{ width: '100%', accentColor: '#00ff00' }}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          fontSize: '10px',
          color: 'rgba(0, 255, 0, 0.6)',
          paddingTop: '8px',
          borderTop: '1px solid rgba(0, 255, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', background: '#00ff00', borderRadius: '50%' }} />
          On time (&lt;50ms)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', background: '#ffff00', borderRadius: '50%' }} />
          Late (&gt;50ms)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', background: '#ff0000', borderRadius: '50%' }} />
          Missed packet
        </div>
      </div>
    </div>
  );
};

// dk:vision Cardiac monitor aesthetic - surveillance state's vital signs
// dk:music Green = healthy rhythm, Yellow = arrhythmia, Red = cardiac arrest
// dk:narrative "The city's heartbeat never stops. Unless the network fails."
