/**
 * Developer Dashboard Component
 * 
 * Full-featured developer interface with:
 * - Developer Console for custom messages
 * - Connection status monitoring
 * - Telemetry display
 * - Quick action buttons
 * 
 * dk:architecture This is synodeveloper's control panel
 * dk:ux Always visible in dev mode, press ` to open console
 */

import { DeveloperConsole } from './DeveloperConsole';
import { useGameWebSocket } from '../hooks/useGameWebSocket';

export const DeveloperDashboard: React.FC = () => {
  const { gameState, isConnected, error, telemetry, send } = useGameWebSocket({
    url: 'ws://localhost:8000/ws', // dk:important Matches backend default port
    autoConnect: true
  });

  // Quick action buttons for common developer tasks
  const handlePing = () => {
    send({
      type: 'CLIENT_PING',
      timestamp: Date.now()
    });
  };

  const handleTriggerLockdown = () => {
    send({
      type: 'TRIGGER_LOCKDOWN',
      zone_id: 'zone_commercial_01',
      duration: 30
    });
  };

  const handleAdjustPitch = () => {
    send({
      type: 'PITCH_UPDATE',
      synod_pitch: 442.0 + Math.random() * 2, // Small variation around A442
      message: 'The regime adjusts the harmony. Compliance is expected.',
      timestamp: Date.now()
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#00ff00' }}>
          🛠️ SYNODEVELOPER DASHBOARD
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#888' }}>
          Full access to SignalNet backend • Press <kbd>`</kbd> for console
        </p>
      </div>

      {/* Connection Status */}
      <div
        style={{
          padding: '15px',
          marginBottom: '20px',
          background: isConnected ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
          border: `2px solid ${isConnected ? '#00ff00' : '#ff0000'}`,
          borderRadius: '5px'
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
          {isConnected ? '✅ CONNECTED' : '❌ DISCONNECTED'}
        </div>
        
        {error && (
          <div style={{ color: '#ff0000', marginBottom: '10px' }}>
            Error: {error}
          </div>
        )}
        
        {isConnected && (
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            <div>Messages Received: {telemetry.messagesReceived}</div>
            <div>Current Tick: {telemetry.lastTick}</div>
            <div>Tick Rate: {telemetry.ticksPerSecond} Hz</div>
            <div>Average Latency: {telemetry.averageLatency}ms</div>
            <div>Missed Ticks: {telemetry.missedTicks}</div>
            <div>Uptime: {Math.floor(telemetry.connectionUptime)}s</div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ff00' }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handlePing}
            disabled={!isConnected}
            style={{
              padding: '10px 15px',
              background: isConnected ? 'rgba(0, 255, 0, 0.2)' : '#333',
              border: '1px solid #00ff00',
              color: isConnected ? '#00ff00' : '#666',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              borderRadius: '3px',
              fontSize: '13px'
            }}
          >
            📡 Send Ping
          </button>
          
          <button
            onClick={handleTriggerLockdown}
            disabled={!isConnected}
            style={{
              padding: '10px 15px',
              background: isConnected ? 'rgba(255, 0, 0, 0.2)' : '#333',
              border: '1px solid #ff0000',
              color: isConnected ? '#ff0000' : '#666',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              borderRadius: '3px',
              fontSize: '13px'
            }}
          >
            🚨 Trigger Lockdown
          </button>
          
          <button
            onClick={handleAdjustPitch}
            disabled={!isConnected}
            style={{
              padding: '10px 15px',
              background: isConnected ? 'rgba(0, 150, 255, 0.2)' : '#333',
              border: '1px solid #0096ff',
              color: isConnected ? '#0096ff' : '#666',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              borderRadius: '3px',
              fontSize: '13px'
            }}
          >
            🎵 Adjust Pitch
          </button>
        </div>
      </div>

      {/* Game State Preview */}
      {gameState && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#00ff00' }}>
            📊 Game State Preview
          </h2>
          <div
            style={{
              padding: '15px',
              background: '#000',
              border: '1px solid #00ff00',
              borderRadius: '5px',
              fontSize: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            <div>Agents: {gameState.agents?.length || 0}</div>
            <div>Nodes: {gameState.nodes?.length || 0}</div>
            <div>Risk Score: {(gameState.risk_score * 100).toFixed(1)}%</div>
            <div>Recent Events: {gameState.events?.length || 0}</div>
            
            {gameState.events && gameState.events.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #004400' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Last Event:</div>
                <div style={{ opacity: 0.8 }}>
                  {gameState.events[gameState.events.length - 1].message}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Developer Console (Toggleable with backtick) */}
      <DeveloperConsole 
        sendMessage={send}
        enabled={true}
      />

      {/* Instructions */}
      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid #333',
          borderRadius: '5px',
          fontSize: '12px',
          opacity: 0.7
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>💡 Developer Tips:</div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Press <kbd>`</kbd> (backtick) to open/close the developer console</li>
          <li>Console provides message templates for all game actions</li>
          <li>Edit JSON directly to craft custom messages</li>
          <li>Check browser console for full WebSocket logs</li>
          <li>Telemetry tracks backend sync (tick rate, latency, missed ticks)</li>
        </ul>
      </div>
    </div>
  );
};

// dk:architecture This dashboard is the "ground truth" view - unfiltered simulation state
// dk:ux Quick actions for common testing scenarios (ping, lockdown, pitch adjust)
// dk:telemetry Exposes all WebSocket metrics for debugging connection issues
// dk:business Could package this as "SignalNet SDK" for modders/plugin devs
