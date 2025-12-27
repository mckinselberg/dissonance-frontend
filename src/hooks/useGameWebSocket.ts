import { useEffect, useRef, useState } from 'react';
import { wsDebug } from '../lib/websocketDebug';

// dk:important WebSocket message types from backend
export interface GameState {
  agents: Record<string, Agent>; // dk:fix Changed from array to object keyed by agent ID
  nodes: InfrastructureNode[];
  zones?: Zone[]; // dk:important Zones from world simulation
  risk_score: number;
  tick: number;
  events: GameEvent[];
}

// dk:telemetry Track backend iteration sync
export interface WebSocketTelemetry {
  messagesReceived: number;
  lastTick: number;
  ticksPerSecond: number; // Measured tick rate
  missedTicks: number; // Gaps in tick sequence
  averageLatency: number; // ms between tick timestamp and receive time
  connectionUptime: number; // seconds connected
}

export interface Agent {
  id: string;
  position: Position;
  role: 'citizen' | 'operator' | 'resistance';
  risk_score: number;
  status: string;
  fov_angle?: number; // Field of view angle in degrees (e.g., 90)
  fov_distance?: number; // FOV range in world units (e.g., 100)
}

export interface Zone {
  id: string;
  type: string;
  bounds: {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
  };
  surveillance_density: number;
}

export interface InfrastructureNode {
  id: string;
  position: Position;
  type: string;
  status: string;
  coverage_radius?: number;
  active?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameEvent {
  type: string;
  message: string;
  timestamp: number;
  visible_to: string[];
}

export interface UseGameWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseGameWebSocketReturn {
  gameState: GameState | null;
  isConnected: boolean;
  error: string | null;
  telemetry: WebSocketTelemetry; // dk:telemetry Expose iteration tracking
  send: (message: Record<string, unknown>) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for managing WebSocket connection to game simulation backend.
 * 
 * Handles:
 * - Automatic reconnection with exponential backoff
 * - Message parsing and state updates
 * - Connection lifecycle management
 * - Telemetry tracking (tick sync, latency, missed iterations)
 * 
 * dk:important This is the "ground truth" data stream - unfiltered simulation state
 * dk:vision Each role (Operator/Citizen/Resistance) will filter/distort this view
 * dk:telemetry Tracks backend iteration sync to detect slowdowns, maintenance mode
 */
export const useGameWebSocket = (
  options: UseGameWebSocketOptions = {}
): UseGameWebSocketReturn => {
  const {
    url = 'ws://localhost:8000/ws', // dk:fix Port 8000 (backend default)
    autoConnect = true,
    reconnectInterval = 2000,
    maxReconnectAttempts = 5
  } = options;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // dk:telemetry Track WebSocket iteration sync with backend
  const [telemetry, setTelemetry] = useState<WebSocketTelemetry>({
    messagesReceived: 0,
    lastTick: 0,
    ticksPerSecond: 0,
    missedTicks: 0,
    averageLatency: 0,
    connectionUptime: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Telemetry refs
  const connectionStartRef = useRef<number>(0);
  const tickHistoryRef = useRef<Array<{ tick: number; timestamp: number; receiveTime: number }>>([]);
  const latencyHistoryRef = useRef<number[]>([]);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected to simulation');
        wsDebug.logConnection('open'); // dk:debug
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // dk:telemetry Start tracking connection uptime
        connectionStartRef.current = Date.now();

        // dk:important Backend expects 'admin' role for spectator/developer view
        const joinMessage = {
          type: 'CLIENT_JOIN',
          role: 'admin',
          player_name: 'Developer Dashboard'
        };
        ws.send(JSON.stringify(joinMessage));
        wsDebug.logOutgoing(joinMessage); // dk:debug
      };

      ws.onmessage = (event) => {
        try {
          const receiveTime = Date.now();
          const rawMessage = event.data;
          const message = JSON.parse(rawMessage);
          
          // dk:debug Log incoming message
          wsDebug.logIncoming(message, rawMessage);
          
          // dk:telemetry Track message receive
          setTelemetry(prev => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1,
            connectionUptime: (receiveTime - connectionStartRef.current) / 1000
          }));

          // dk:fix Handle SERVER_WELCOME with initial world state (zones, nodes, NPCs)
          if (message.type === 'SERVER_WELCOME') {
            console.log('🎉 SERVER_WELCOME received with initial_state:', {
              zones: message.initial_state?.zones?.length || 0,
              nodes: message.initial_state?.nodes?.length || 0,
              agents: message.initial_state?.agents ? Object.keys(message.initial_state.agents).length : 0,
              tick: message.initial_state?.tick
            });
            
            if (message.initial_state) {
              setGameState(message.initial_state);
            }
            
            return; // Don't process as state update
          }
          
          // dk:important Backend can send STATE_UPDATE or SERVER_DELTA_UPDATE messages
          if (message.type === 'STATE_UPDATE' || message.type === 'SERVER_DELTA_UPDATE') {
            const state = message.state || message.delta; // dk:fix Handle both formats
            
            // dk:debug Log zones/nodes when received
            if (state.zones || state.nodes) {
              console.log('📦 Received zones/nodes:', {
                zones: state.zones?.length || 0,
                nodes: state.nodes?.length || 0,
                zonesData: state.zones,
                nodesData: state.nodes
              });
            }
            
            // dk:fix Merge delta updates with existing state
            if (message.type === 'SERVER_DELTA_UPDATE') {
              setGameState(prev => {
                if (!prev || !state) return state;
                return {
                  ...prev,
                  ...state,
                  // Merge agents (don't replace entire object)
                  agents: state.agents ? { ...prev.agents, ...state.agents } : prev.agents,
                  // Use new arrays if provided AND non-empty, otherwise keep old
                  zones: (state.zones && state.zones.length > 0) ? state.zones : prev.zones,
                  nodes: (state.nodes && state.nodes.length > 0) ? state.nodes : prev.nodes,
                  events: state.events || prev.events
                };
              });
            } else {
              // Full state update
              setGameState(state);
            }
            
            // dk:telemetry Track tick sync and latency
            if (state.tick !== undefined) {
              const tick = state.tick;
              const timestamp = state.timestamp || (receiveTime / 1000);
              
              // Calculate latency (if backend includes timestamp)
              const latency = receiveTime - (timestamp * 1000);
              latencyHistoryRef.current.push(latency);
              if (latencyHistoryRef.current.length > 100) {
                latencyHistoryRef.current.shift(); // Keep last 100 samples
              }
              
              // Track tick history
              tickHistoryRef.current.push({ tick, timestamp, receiveTime });
              if (tickHistoryRef.current.length > 20) {
                tickHistoryRef.current.shift(); // Keep last 20 ticks (2 seconds at 10 Hz)
              }
              
              // Calculate ticks per second (from last 10 samples)
              let ticksPerSecond = 0;
              if (tickHistoryRef.current.length >= 10) {
                const recent = tickHistoryRef.current.slice(-10);
                const timeDiff = (recent[recent.length - 1].receiveTime - recent[0].receiveTime) / 1000;
                const tickDiff = recent[recent.length - 1].tick - recent[0].tick;
                ticksPerSecond = tickDiff / timeDiff;
              }
              
              // Calculate average latency
              const avgLatency = latencyHistoryRef.current.length > 0
                ? latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length
                : 0;
              
              setTelemetry(prev => {
                // Detect missed ticks
                const missedTicks = prev.lastTick > 0 ? Math.max(0, tick - prev.lastTick - 1) : 0;
                
                return {
                  ...prev,
                  lastTick: tick,
                  ticksPerSecond: Math.round(ticksPerSecond * 10) / 10,
                  missedTicks: prev.missedTicks + missedTicks,
                  averageLatency: Math.round(avgLatency)
                };
              });
              
              // dk:debug Log telemetry update
              wsDebug.logTelemetry({
                tick,
                ticksPerSecond: Math.round(ticksPerSecond * 10) / 10,
                avgLatency: Math.round(avgLatency)
              });
            }
          } else if (message.type === 'EVENT_OCCURRED') {
            // dk:reminder Add event to state without replacing it
            setGameState(prev => prev ? {
              ...prev,
              events: [...prev.events, message.event]
            } : null);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        wsDebug.logConnection('error', event); // dk:debug
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        wsDebug.logConnection('close'); // dk:debug
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setGameState(null);
    
    // dk:telemetry Reset telemetry on disconnect
    tickHistoryRef.current = [];
    latencyHistoryRef.current = [];
  };

  const send = (message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify(message);
      wsRef.current.send(jsonMessage);
      wsDebug.logOutgoing(message, jsonMessage); // dk:debug
    } else {
      console.warn('Cannot send message - WebSocket not connected');
    }
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, url]);

  return {
    gameState,
    isConnected,
    error,
    telemetry, // dk:telemetry Expose iteration tracking
    send,
    connect,
    disconnect
  };
};

// dk:perf WebSocket reconnection uses exponential backoff to avoid hammering server
// dk:reminder Add heartbeat/ping-pong to detect stale connections (backend timeout = 60s)
// dk:vision This is the "reality" layer - each role will apply visual/sonic filters to this data
