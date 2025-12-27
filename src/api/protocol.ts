/**
 * SignalNet Protocol - Client ↔ Server Message Types
 * 
 * This file defines the complete type-safe protocol for communication
 * between the React frontend and FastAPI backend.
 * 
 * All messages use discriminated unions with a `type` field for type safety.
 */

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export type Role = "synod_operator" | "citizen" | "resistance" | "admin";

export interface RolePermissions {
  canSend: string[];
  canReceive: string[];
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  synod_operator: {
    canSend: ["SET_THRESHOLD", "TRIGGER_LOCKDOWN", "MARK_FALSE_POSITIVE", "REQUEST_ANALYSIS"],
    canReceive: ["SERVER_INFERRED_STATE", "SERVER_ALERT", "SERVER_RISK_UPDATE"]
  },
  citizen: {
    canSend: ["MOVE", "INTERACT", "ACQUIRE_RESOURCE", "REST", "WORK"],
    canReceive: ["SERVER_PERSONAL_STATE", "SERVER_ALERT", "SERVER_LOCATION_UPDATE"]
  },
  resistance: {
    canSend: ["JAM_NODE", "SPOOF_DEVICE", "DROP_ARTIFACT", "MESSAGE_CELL", "MOVE"],
    canReceive: ["SERVER_TACTICAL_STATE", "SERVER_ALERT", "SERVER_CELL_MESSAGE"]
  },
  admin: {
    canSend: ["ADMIN_SET_PARAM", "ADMIN_TRIGGER_EVENT", "ADMIN_QUERY_STATE"],
    canReceive: ["ADMIN_STATE_UPDATE", "AUDIT_LOG_ENTRY", "SERVER_WORLD_SNAPSHOT"]
  }
};

// ============================================================================
// WORLD DATA MODELS
// ============================================================================

export interface Position {
  x: number;
  y: number;
  zone_id: string;
}

export interface BoundingBox {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
}

export enum ZoneType {
  RESIDENTIAL = "RESIDENTIAL",
  COMMERCIAL = "COMMERCIAL",
  SENSITIVE = "SENSITIVE",
  INDUSTRIAL = "INDUSTRIAL"
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  bounds: BoundingBox;
  surveillance_density: number;
  risk_modifier: number;
}

export enum NodeType {
  WIFI_AP = "WIFI_AP",
  CELL_TOWER = "CELL_TOWER",
  CAMERA = "CAMERA",
  BEACON = "BEACON"
}

export enum NodeStatus {
  ACTIVE = "ACTIVE",
  JAMMED = "JAMMED",
  OFFLINE = "OFFLINE"
}

export interface InfrastructureNode {
  id: string;
  type: NodeType;
  position: Position;
  coverage_radius: number;
  status: NodeStatus;
  signals?: Signal[];
}

export interface Signal {
  node_id: string;
  signal_type: string;
  strength: number;
  timestamp: number;
  data?: Record<string, any>;
}

export enum AgentRole {
  CITIZEN = "CITIZEN",
  RESISTANCE = "RESISTANCE",
  ENFORCEMENT = "ENFORCEMENT",
  NPC = "NPC"
}

export enum AgentState {
  IDLE = "IDLE",
  MOVING = "MOVING",
  WORKING = "WORKING",
  RESTING = "RESTING",
  DETAINED = "DETAINED"
}

export interface Agent {
  id: string;
  role: AgentRole;
  position: Position;
  risk_score: number;
  state: AgentState;
  inventory?: Item[];
}

export interface Item {
  id: string;
  type: string;
  name: string;
  contraband: boolean;
}

export enum EventType {
  ALERT = "ALERT",
  LOCKDOWN = "LOCKDOWN",
  RAID = "RAID",
  ARTIFACT_DROP = "ARTIFACT_DROP",
  INFRASTRUCTURE_JAM = "INFRASTRUCTURE_JAM",
  ADMIN_DECREE = "ADMIN_DECREE",
  DISASTER = "DISASTER"
}

export interface Event {
  id: string;
  type: EventType;
  timestamp: number;
  position?: Position;
  affected_agents: string[];
  data: Record<string, any>;
  visible_to_roles: Role[];
}

// ============================================================================
// CLIENT MESSAGES (Client → Server)
// ============================================================================

// --- Connection & Meta ---

export interface ClientJoinMessage {
  type: "CLIENT_JOIN";
  role: Role;
  player_name?: string;
  world_id?: string;
}

export interface ClientPingMessage {
  type: "CLIENT_PING";
  timestamp: number;
}

// --- Synod Operator Actions ---

export interface SetThresholdMessage {
  type: "SET_THRESHOLD";
  threshold_type: string;
  value: number;
}

export interface TriggerLockdownMessage {
  type: "TRIGGER_LOCKDOWN";
  zone_id: string;
  duration?: number;
}

export interface MarkFalsePositiveMessage {
  type: "MARK_FALSE_POSITIVE";
  agent_id: string;
}

export interface RequestAnalysisMessage {
  type: "REQUEST_ANALYSIS";
  agent_id: string;
}

// --- Citizen Actions ---

export interface MoveMessage {
  type: "MOVE";
  destination: Position;
}

export interface InteractMessage {
  type: "INTERACT";
  target_id: string;
  interaction_type: string;
}

export interface AcquireResourceMessage {
  type: "ACQUIRE_RESOURCE";
  resource_type: string;
}

export interface RestMessage {
  type: "REST";
  duration: number;
}

export interface WorkMessage {
  type: "WORK";
  job_type: string;
}

// --- Resistance Actions ---

export interface JamNodeMessage {
  type: "JAM_NODE";
  node_id: string;
  duration: number;
}

export interface SpoofDeviceMessage {
  type: "SPOOF_DEVICE";
  position: Position;
  fake_id: string;
  duration: number;
}

export interface DropArtifactMessage {
  type: "DROP_ARTIFACT";
  artifact_type: string;
  position: Position;
}

export interface MessageCellMessage {
  type: "MESSAGE_CELL";
  recipient_id?: string;
  message: string;
  encrypted: boolean;
}

// --- Admin Actions ---

export interface AdminSetParamMessage {
  type: "ADMIN_SET_PARAM";
  parameter: string;
  value: number;
}

export interface AdminTriggerEventMessage {
  type: "ADMIN_TRIGGER_EVENT";
  event_type: string;
  event_data: Record<string, any>;
}

export interface AdminQueryStateMessage {
  type: "ADMIN_QUERY_STATE";
  query_type: string;
}

// --- Discriminated Union of All Client Messages ---

export type ClientMessage =
  | ClientJoinMessage
  | ClientPingMessage
  | SetThresholdMessage
  | TriggerLockdownMessage
  | MarkFalsePositiveMessage
  | RequestAnalysisMessage
  | MoveMessage
  | InteractMessage
  | AcquireResourceMessage
  | RestMessage
  | WorkMessage
  | JamNodeMessage
  | SpoofDeviceMessage
  | DropArtifactMessage
  | MessageCellMessage
  | AdminSetParamMessage
  | AdminTriggerEventMessage
  | AdminQueryStateMessage;

// ============================================================================
// SERVER MESSAGES (Server → Client)
// ============================================================================

// --- Connection & Meta ---

export interface ServerWelcomeMessage {
  type: "SERVER_WELCOME";
  client_id: string;
  role: Role;
  world_id: string;
  initial_state: WorldState;
}

export interface ServerPongMessage {
  type: "SERVER_PONG";
  timestamp: number;
}

export interface ServerErrorMessage {
  type: "SERVER_ERROR";
  error_code: string;
  message: string;
}

// --- World Updates ---

export interface ServerWorldSnapshotMessage {
  type: "SERVER_WORLD_SNAPSHOT";
  tick: number;
  timestamp: number;
  world_state: WorldState;
}

export interface ServerDeltaUpdateMessage {
  type: "SERVER_DELTA_UPDATE";
  tick: number;
  timestamp: number;
  changes: Delta[];
}

export interface ServerAlertMessage {
  type: "SERVER_ALERT";
  alert_id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  event?: Event;
}

// --- Role-Specific Updates ---

export interface ServerInferredStateMessage {
  type: "SERVER_INFERRED_STATE";
  inferred_agents: InferredAgent[];
  active_alerts: Alert[];
  thresholds: Record<string, number>;
}

export interface ServerPersonalStateMessage {
  type: "SERVER_PERSONAL_STATE";
  agent_id: string;
  position: Position;
  risk_score: number;
  resources: Resources;
  available_actions: string[];
  current_state: AgentState;
}

export interface ServerTacticalStateMessage {
  type: "SERVER_TACTICAL_STATE";
  safe_routes: SafeRoute[];
  blind_spots: Position[];
  surveillance_heatmap: HeatmapData;
  active_operations: Operation[];
}

export interface ServerCellMessageMessage {
  type: "SERVER_CELL_MESSAGE";
  sender_id: string;
  message: string;
  timestamp: number;
  encrypted: boolean;
}

// --- Admin-Only Updates ---

export interface AdminStateUpdateMessage {
  type: "ADMIN_STATE_UPDATE";
  world_state: WorldState;
  metrics: AdminMetrics;
  faction_health: FactionHealth;
}

export interface AuditLogEntryMessage {
  type: "AUDIT_LOG_ENTRY";
  entry: AuditLogEntry;
}

// --- Discriminated Union of All Server Messages ---

export type ServerMessage =
  | ServerWelcomeMessage
  | ServerPongMessage
  | ServerErrorMessage
  | ServerWorldSnapshotMessage
  | ServerDeltaUpdateMessage
  | ServerAlertMessage
  | ServerInferredStateMessage
  | ServerPersonalStateMessage
  | ServerTacticalStateMessage
  | ServerCellMessageMessage
  | AdminStateUpdateMessage
  | AuditLogEntryMessage;

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface WorldState {
  tick: number;
  timestamp: number;
  zones: Record<string, Zone>;
  nodes: Record<string, InfrastructureNode>;
  agents: Record<string, Agent>;
  events: Event[];
}

export interface Delta {
  path: string;
  operation: "ADD" | "UPDATE" | "REMOVE";
  value?: any;
}

export interface InferredAgent {
  id: string;
  inferred_position: Position;
  confidence: number;
  risk_score: number;
  last_seen: number;
  signals: Signal[];
}

export interface Alert {
  id: string;
  agent_id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface Resources {
  money: number;
  food: number;
  energy: number;
}

export interface SafeRoute {
  waypoints: Position[];
  risk_level: number;
  estimated_time: number;
}

export interface HeatmapData {
  grid_size: number;
  cells: number[][];
}

export interface Operation {
  id: string;
  type: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "FAILED";
  target?: string;
  participants: string[];
}

export interface AdminMetrics {
  connected_players: number;
  total_agents: number;
  ticks_per_second: number;
  avg_latency: number;
}

export interface FactionHealth {
  synod: {
    effectiveness: number;
    operators: number;
  };
  resistance: {
    strength: number;
    members: number;
  };
  citizens: {
    unrest: number;
    count: number;
  };
}

export interface AuditLogEntry {
  timestamp: number;
  action: string;
  admin_id?: string;
  type: "PARAMETER" | "EVENT" | "SYSTEM";
  details: Record<string, any>;
}

// ============================================================================
// TYPE GUARDS (for runtime type checking)
// ============================================================================

export function isClientMessage(msg: any): msg is ClientMessage {
  return msg && typeof msg.type === "string" && msg.type.startsWith("CLIENT") || 
         ["MOVE", "INTERACT", "JAM_NODE", "SET_THRESHOLD", "ADMIN_SET_PARAM"].includes(msg.type);
}

export function isServerMessage(msg: any): msg is ServerMessage {
  return msg && typeof msg.type === "string" && msg.type.startsWith("SERVER") || 
         msg.type.startsWith("ADMIN") || msg.type.startsWith("AUDIT");
}

export function getMessageRole(msg: ClientMessage): Role | null {
  // Determine which role can send this message
  if (["SET_THRESHOLD", "TRIGGER_LOCKDOWN", "MARK_FALSE_POSITIVE", "REQUEST_ANALYSIS"].includes(msg.type)) {
    return "synod_operator";
  }
  if (["MOVE", "INTERACT", "ACQUIRE_RESOURCE", "REST", "WORK"].includes(msg.type)) {
    return "citizen";
  }
  if (["JAM_NODE", "SPOOF_DEVICE", "DROP_ARTIFACT", "MESSAGE_CELL"].includes(msg.type)) {
    return "resistance";
  }
  if (msg.type.startsWith("ADMIN_")) {
    return "admin";
  }
  return null;
}
