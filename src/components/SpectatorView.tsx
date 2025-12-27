import { useGameWebSocket, type GameState, type Agent } from '../hooks/useGameWebSocket';
import { useSynodMusicEngine } from '../hooks/useSynodMusicEngine';
import { DashboardTutorial } from './DashboardTutorial';
import { GameWorldCanvas } from './GameWorldCanvas';
import { useMemo } from 'react';

/**
 * SpectatorView - The "Ground Truth" Visualization
 * 
 * This component displays the RAW, UNFILTERED simulation state.
 * Think of it as the "God view" or "reality" - what's actually happening in the world.
 * 
 * dk:vision This is the BASE LAYER. Each role will apply filters on top:
 * - Operator: Surveillance overlays, risk heat maps, alert highlights
 * - Citizen: Limited visibility, paranoia distortion, memory gaps
 * - Resistance: Signal jamming effects, counter-surveillance markers
 * 
 * dk:music Risk score from this view will drive the adaptive music system
 * dk:important This view is for debugging/spectating - players never see "pure reality"
 */
export const SpectatorView: React.FC = () => {
  const { gameState, isConnected, error, telemetry } = useGameWebSocket({
    autoConnect: true
  });

  // dk:music Adaptive music responds automatically to simulation risk_score
  useSynodMusicEngine(gameState?.risk_score || 0, {
    enabled: isConnected,
    masterVolume: 0.15  // dk:perf Reduced to balance with heartbeat rhythm (1 BPS = 60 BPM)
  });

  // dk:perf Memoize focusAgentId to prevent GameWorldCanvas from re-rendering
  const focusAgentId = useMemo(() => {
    if (!gameState?.agents) return undefined;
    const keys = Object.keys(gameState.agents);
    return keys.length > 0 ? keys[0] : undefined;
  }, [gameState]);

  if (error) {
    return (
      <>
        <DashboardTutorial />
        <div style={{
          padding: '20px',
          background: '#ff4444',
          color: '#fff',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h2>❌ Connection Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Make sure backend is running: <code>ws://localhost:8001/ws</code>
          </p>
        </div>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <DashboardTutorial />
        <div style={{
          padding: '20px',
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          <h2>🔌 Connecting to Simulation...</h2>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Establishing WebSocket connection
          </p>
        </div>
      </>
    );
  }

  if (!gameState) {
    return (
      <>
        <DashboardTutorial />
        <div style={{
          padding: '20px',
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          <h2>⏳ Waiting for Simulation Data...</h2>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Connected, but no state updates yet
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTutorial />
      <div style={{
        padding: '20px',
        fontFamily: 'monospace',
        background: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #333'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>
          👁️ SPECTATOR VIEW (GROUND TRUTH)
        </h1>
        <div style={{
          display: 'flex',
          gap: '20px',
          fontSize: '14px',
          color: '#888',
          flexWrap: 'wrap'
        }}>
          <span>✅ Connected</span>
          <span>Tick: {gameState.tick}</span>
          <span style={{ color: getRiskColor(gameState.risk_score) }}>
            Risk: {(gameState.risk_score * 100).toFixed(1)}%
          </span>
          {/* dk:telemetry Backend iteration sync */}
          <span title="Backend iterations per second (target: 10 Hz)">
            ⚡ {telemetry.ticksPerSecond.toFixed(1)} Hz
          </span>
          <span title="Total messages received">
            📨 {telemetry.messagesReceived}
          </span>
          <span title="Average network latency">
            ⏱️ {telemetry.averageLatency}ms
          </span>
          {telemetry.missedTicks > 0 && (
            <span style={{ color: '#ff8800' }} title="Dropped ticks (simulation lag or network packet loss)">
              ⚠️ {telemetry.missedTicks} missed
            </span>
          )}
          <span title="Connection uptime">
            🕐 {telemetry.connectionUptime.toFixed(0)}s
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        {/* Main Map Area with Canvas Visualization */}
        <div style={{
          background: '#111',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '20px',
          position: 'relative'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#00ff00' }}>🗺️ World Map</h3>
          {/* dk:vision Canvas shows zones, nodes, agents with FOV cones */}
          <GameWorldCanvas 
            gameState={gameState}
            focusAgentId={focusAgentId}
          />
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Risk Meter */}
          <RiskMeter riskScore={gameState.risk_score} />

          {/* Agent List */}
          <AgentList agents={Object.values(gameState.agents)} />

          {/* Event Feed */}
          <EventFeed events={gameState.events} />
        </div>
      </div>

      {/* dk:vision annotation */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#1a1a1a',
        borderRadius: '8px',
        borderLeft: '4px solid #ff1493',
        fontSize: '12px',
        color: '#888'
      }}>
        <strong style={{ color: '#ff1493' }}>dk:vision</strong> This is the unfiltered "reality" layer. 
        Operator sees surveillance overlays (heat maps, alerts). 
        Citizen sees limited FOV with paranoia distortion. 
        Resistance sees signal jamming effects. 
        Each role = different visual filter + music response.
      </div>
    </div>
    </>
  );
};

// Helper component: Risk Meter
const RiskMeter: React.FC<{ riskScore: number }> = ({ riskScore }) => {
  const percentage = riskScore * 100;
  const color = getRiskColor(riskScore);

  return (
    <div style={{
      background: '#111',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px'
    }}>
      <h3 style={{ marginTop: 0, color: '#00ff00', fontSize: '14px' }}>
        ⚠️ GLOBAL RISK SCORE
      </h3>
      <div style={{
        background: '#222',
        borderRadius: '4px',
        overflow: 'hidden',
        height: '30px',
        position: 'relative'
      }}>
        <div style={{
          background: color,
          width: `${percentage}%`,
          height: '100%',
          transition: 'width 0.3s ease'
        }} />
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#fff',
          textShadow: '1px 1px 2px #000'
        }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div style={{
        marginTop: '10px',
        fontSize: '11px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Safe (0%)</span>
        <span>Lockdown (100%)</span>
      </div>
    </div>
  );
};

// Helper component: Agent List
const AgentList: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  return (
    <div style={{
      background: '#111',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      maxHeight: '250px',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginTop: 0, color: '#00ff00', fontSize: '14px' }}>
        🤖 AGENTS ({agents.length})
      </h3>
      <div style={{ fontSize: '12px' }}>
        {agents.map(agent => (
          <div
            key={agent.id}
            style={{
              padding: '8px',
              marginBottom: '5px',
              background: '#1a1a1a',
              borderRadius: '4px',
              borderLeft: `4px solid ${getAgentColor(agent.role)}`
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {agent.role.toUpperCase()} - {agent.id}
            </div>
            <div style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
              Position: ({agent.position.x.toFixed(1)}, {agent.position.y.toFixed(1)})
            </div>
            <div style={{ color: getRiskColor(agent.risk_score), fontSize: '11px' }}>
              Risk: {(agent.risk_score * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper component: Event Feed
const EventFeed: React.FC<{ events: GameState['events'] }> = ({ events }) => {
  // Show last 10 events
  const recentEvents = events.slice(-10).reverse();

  return (
    <div style={{
      background: '#111',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      maxHeight: '250px',
      overflowY: 'auto'
    }}>
      <h3 style={{ marginTop: 0, color: '#00ff00', fontSize: '14px' }}>
        📡 EVENT FEED
      </h3>
      <div style={{ fontSize: '11px' }}>
        {recentEvents.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No events yet...
          </div>
        ) : (
          recentEvents.map((event, idx) => (
            <div
              key={`${event.timestamp}-${idx}`}
              style={{
                padding: '8px',
                marginBottom: '5px',
                background: '#1a1a1a',
                borderRadius: '4px',
                borderLeft: '3px solid #666'
              }}
            >
              <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                {event.type}
              </div>
              <div style={{ color: '#ccc', marginTop: '4px' }}>
                {event.message}
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper functions
function getAgentColor(role: string): string {
  switch (role) {
    case 'operator': return '#ff0000';
    case 'citizen': return '#00ff00';
    case 'resistance': return '#0088ff';
    default: return '#888';
  }
}

function getRiskColor(risk: number): string {
  if (risk < 0.3) return '#00ff00'; // Green (safe)
  if (risk < 0.5) return '#ffff00'; // Yellow (unease)
  if (risk < 0.7) return '#ff8800'; // Orange (heightened)
  if (risk < 0.9) return '#ff0000'; // Red (danger)
  return '#ff00ff'; // Magenta (crisis)
}

// dk:music Risk color thresholds match Synod scale music layer activation (0.3, 0.5, 0.7, 0.9)
// dk:perf SVG grid scales infinitely - no canvas re-rendering needed
// dk:vision This "reality" layer will be distorted by role-specific filters in Phase 5
