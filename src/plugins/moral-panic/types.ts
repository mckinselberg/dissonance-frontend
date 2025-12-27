/**
 * TypeScript interfaces for Moral Panic game mode
 * 
 * Parallels backend plugin types (roles.py, events.py, scoring.py, cultural_sites.py)
 */

// ============================================================================
// ROLES
// ============================================================================

export type RoleType = 'authority' | 'musician' | 'kid';

export interface RoleConfig {
  name: string;
  description: string;
  baseFrequency: number;  // Hz (A440/A435/A445)
  startingResources: Record<string, number>;
  winCondition: string;
  colorTheme: string;  // Hex color
}

export interface AuthorityState {
  playerId: string;
  roleType: 'authority';
  resources: {
    influence: number;      // Political power
    mediaReach: number;     // TV/radio access
    pressurePoints: number; // Boycott targets
  };
  monitoredSites: string[];      // Cultural site IDs
  activeCampaigns: Campaign[];   // Boycott targets
  bannedAlbums: string[];        // Album IDs
}

export interface MusicianState {
  playerId: string;
  roleType: 'musician';
  resources: {
    creativity: number;    // Write songs
    fanbase: number;       // Followers
    controversy: number;   // Notoriety
  };
  discography: Album[];         // Released albums
  tourSchedule: Tour[];         // Upcoming shows
  legalBattles: CourtCase[];    // Active lawsuits
}

export interface KidState {
  playerId: string;
  roleType: 'kid';
  resources: {
    allowance: number;     // Buy tapes/CDs
    corruption: number;    // Cultural rebellion level (0-100)
    trust: number;         // Parental trust
  };
  tapeCollection: string[];     // Album IDs owned
  hiddenStash: string[];        // Albums hidden from parents
  concertHistory: Concert[];    // Shows attended
  peerGroup: string[];          // Friend IDs
}

export type PlayerState = AuthorityState | MusicianState | KidState;

// ============================================================================
// GAME OBJECTS
// ============================================================================

export interface Album {
  id: string;
  title: string;
  artistId: string;
  controversy: number;  // 0-100
  sales: number;
  banned: boolean;
  parentalAdvisory: boolean;
  releaseTick: number;
  hiddenMessage?: {
    content: string;
    technique: 'backwards_masking' | 'subliminal' | 'lyrical';
    discovered: boolean;
  };
}

export interface Campaign {
  target: string;
  type: 'boycott' | 'protest' | 'hearing';
  influenceCost: number;
  durationTicks: number;
  successChance: number;
}

export interface Tour {
  albumId: string;
  venues: string[];
  ticketsSold: number;
  cancelledShows: number;
  status: 'scheduled' | 'cancelled' | 'completed';
}

export interface Concert {
  venueId: string;
  sneaked: boolean;
  caught: boolean;
  corruptionGain: number;
}

export interface CourtCase {
  id: string;
  plaintiff: string;
  defendant: string;
  charges: string;
  status: 'pending' | 'in_trial' | 'verdict';
  verdict?: 'guilty' | 'not_guilty';
}

// ============================================================================
// EVENTS
// ============================================================================

export type EventCategory = 
  | 'album_release' 
  | 'legal_battle' 
  | 'congressional' 
  | 'protest' 
  | 'media_panic' 
  | 'cultural_shift';

export interface HistoricalEvent {
  id: string;
  year: number;
  month: number;
  category: EventCategory;
  title: string;
  description: string;
  effects: Record<string, number | boolean | string>;  // Mechanical effects on game state
  realContext: string;
  keyFigures: string[];
  triggersFor: RoleType[];
  miniGame?: 'press_conference' | 'congressional_testimony' | 'court_case';
}

// ============================================================================
// SCORING
// ============================================================================

export type CorruptionLevel = 
  | 'innocent'    // 0-20%
  | 'curious'     // 20-40%
  | 'rebellious'  // 40-60%
  | 'subversive'  // 60-80%
  | 'corrupted';  // 80-100%

export interface CorruptionFactors {
  albumControversy: number;      // 0-100
  concertAttendance: number;     // 0-100
  hiddenStashSize: number;       // 0-100
  peerPressure: number;          // 0-100
  musicianExposure: number;      // 0-100
  defianceActs: number;          // 0-100
  parentalTrustLoss: number;     // 0-100
  decodedMessages: number;       // 0-100
  historicalAwareness: number;   // 0-100
}

export interface CorruptionScore {
  playerId: string;
  score: number;  // 0-100
  level: CorruptionLevel;
  factors: CorruptionFactors;
  trend: number;  // Positive = increasing, negative = decreasing
  topFactors: Array<{
    name: string;
    value: number;
    contribution: number;
  }>;
}

// ============================================================================
// CULTURAL SITES
// ============================================================================

export type SiteType = 
  | 'record_store' 
  | 'concert_venue' 
  | 'church' 
  | 'school' 
  | 'radio_station';

export interface CulturalSite {
  id: string;
  siteType: SiteType;
  name: string;
  position: { x: number; y: number };
  monitoredBy: string[];  // Authority player IDs
  influenceRadius: number;
  active: boolean;
  controversyLevel: number;  // 0-100
}

export interface RecordStore extends CulturalSite {
  siteType: 'record_store';
  inventory: string[];        // Album IDs
  bannedAlbums: string[];     // Removed by pressure
  purchaseHistory: Array<{
    kidId: string;
    albumId: string;
    tick: number;
    detected: boolean;
  }>;
  boycotted: boolean;
}

export interface ConcertVenue extends CulturalSite {
  siteType: 'concert_venue';
  capacity: number;
  scheduledShows: Array<{
    id: string;
    musicianId: string;
    albumId: string;
    dateTick: number;
    status: 'scheduled' | 'cancelled' | 'completed';
    ticketsSold: number;
    attendees: string[];  // Kid IDs
  }>;
  cancelledShows: Array<Record<string, unknown>>;
  showHistory: Array<Record<string, unknown>>;
}

export interface Church extends CulturalSite {
  siteType: 'church';
  congregationSize: number;
  sermons: Array<{
    targetType: string;
    targetId: string;
    influenceGain: number;
    kidsAffected: string[];
  }>;
  recordBurnings: Array<{
    albumIds: string[];
    attendees: number;
    mediaCoverage: number;
    authorityInfluence: number;
  }>;
}

export interface School extends CulturalSite {
  siteType: 'school';
  studentPopulation: number;
  dressCodeStrict: boolean;
  confiscations: Array<{
    kidId: string;
    albumId: string;
    returned: boolean;
    parentalContact: boolean;
  }>;
  peerGroups: Record<string, {
    members: string[];
    genre: string;
    corruptionAvg: number;
  }>;
}

export interface RadioStation extends CulturalSite {
  siteType: 'radio_station';
  frequency: number;  // FM frequency
  playlist: string[];  // Album IDs in rotation
  blacklist: string[];  // Banned from airplay
  listenerCount: number;
}

// ============================================================================
// GAME STATE
// ============================================================================

export interface MoralPanicGameState {
  mode: 'moral_panic';
  currentYear: number;
  currentMonth: number;
  tick: number;
  
  players: PlayerState[];
  culturalSites: CulturalSite[];
  albums: Album[];
  events: HistoricalEvent[];
  
  corruptionScores: Record<string, CorruptionScore>;  // kidId -> score
  averageCorruption: number;
  
  // Win conditions
  authorityWinProgress: number;  // 0-100 (toward "saving youth")
  musicianWinProgress: number;   // 0-100 (toward cultural movement)
  kidsIndependent: number;       // Count of kids who achieved independence
}

// ============================================================================
// WEBSOCKET MESSAGES
// ============================================================================

export interface MoralPanicAction {
  type: 'MORAL_PANIC_ACTION';
  action: 
    | 'MONITOR_SITE'
    | 'LAUNCH_CAMPAIGN'
    | 'RELEASE_ALBUM'
    | 'BOOK_TOUR'
    | 'ACQUIRE_ALBUM'
    | 'ATTEND_CONCERT'
    | 'HIDE_ALBUM'
    | 'DECODE_MESSAGE';
  payload: Record<string, unknown>;
}

export interface MoralPanicStateUpdate {
  type: 'MORAL_PANIC_STATE';
  state: MoralPanicGameState;
}

// dk:reminder Add WebSocket message types for mini-games (court cases, testimonies)
