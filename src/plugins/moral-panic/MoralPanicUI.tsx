interface KidDashboardProps {
  playerState: PlayerState;
}
/**
 * UI Components for Moral Panic game mode
 * 
 * Role-specific interfaces adapting SignalNet's dashboard pattern
 * 
 * dk:architecture Modular, extractable components
 */

import React from 'react';
import type { 
  PlayerState, 
  MoralPanicGameState
} from './types';
import { getCorruptionLevelName } from './moralPanicScale';

// ============================================================================
// PLACEHOLDER COMPONENTS (Implement based on role needs)
// ============================================================================

interface MoralPanicDashboardProps {
  gameState: MoralPanicGameState;
  playerState: PlayerState;
}

/**
 * Main dashboard component for Moral Panic mode
 * 
 * Switches between role-specific UIs
 */
export const MoralPanicDashboard: React.FC<MoralPanicDashboardProps> = ({
  gameState,
  playerState
}) => {
  if (playerState.roleType === 'authority') {
    return <AuthorityDashboard gameState={gameState} playerState={playerState} />;
  } else if (playerState.roleType === 'musician') {
    return <MusicianDashboard gameState={gameState} playerState={playerState} />;
  } else {
  return <KidDashboard playerState={playerState} />;
  }
};

// ============================================================================
// AUTHORITY DASHBOARD
// ============================================================================

const AuthorityDashboard: React.FC<MoralPanicDashboardProps> = ({
  gameState,
  playerState
}) => {
  if (playerState.roleType !== 'authority') return null;
  
  return (
    <div style={{ padding: '20px', color: '#ff4444' }}>
      <h1>Authority Dashboard</h1>
      <p>Role: The Censors (PMRC, Parents, Churches)</p>
      
      {/* Resources */}
      <div>
        <h2>Resources</h2>
        <p>Influence: {playerState.resources.influence}</p>
        <p>Media Reach: {playerState.resources.mediaReach}</p>
        <p>Pressure Points: {playerState.resources.pressurePoints}</p>
      </div>
      
      {/* Monitored Sites */}
      <div>
        <h2>Monitored Sites ({playerState.monitoredSites.length})</h2>
        {/* dk:reminder Render site list with map */}
      </div>
      
      {/* Active Campaigns */}
      <div>
        <h2>Active Campaigns ({playerState.activeCampaigns.length})</h2>
        {/* dk:reminder Render campaign list */}
      </div>
      
      {/* Banned Albums */}
      <div>
        <h2>Banned Albums ({playerState.bannedAlbums.length})</h2>
        {/* dk:reminder Render album list */}
      </div>
      
      {/* Win Condition Progress */}
      <div>
        <h2>Win Progress</h2>
        <p>Average Corruption: {gameState.averageCorruption.toFixed(1)}%</p>
        <p>Goal: Reduce to &lt; 30%</p>
      </div>
    </div>
  );
};

// ============================================================================
// MUSICIAN DASHBOARD
// ============================================================================

const MusicianDashboard: React.FC<MoralPanicDashboardProps> = ({
  playerState
}) => {
  if (playerState.roleType !== 'musician') return null;
  
  return (
    <div style={{ padding: '20px', color: '#9945ff' }}>
      <h1>Musician Dashboard</h1>
      <p>Role: The Artists (Rock/Metal/Hip-Hop)</p>
      
      {/* Resources */}
      <div>
        <h2>Resources</h2>
        <p>Creativity: {playerState.resources.creativity}</p>
        <p>Fanbase: {playerState.resources.fanbase}</p>
        <p>Controversy: {playerState.resources.controversy}</p>
      </div>
      
      {/* Discography */}
      <div>
        <h2>Discography ({playerState.discography.length} albums)</h2>
        {/* dk:reminder Render album list with sales */}
      </div>
      
      {/* Tour Schedule */}
      <div>
        <h2>Tour Schedule ({playerState.tourSchedule.length} tours)</h2>
        {/* dk:reminder Render tour list */}
      </div>
      
      {/* Legal Battles */}
      <div>
        <h2>Legal Battles ({playerState.legalBattles.length})</h2>
        {/* dk:reminder Render court cases */}
      </div>
      
      {/* Win Condition Progress */}
      <div>
        <h2>Win Progress</h2>
        <p>Fanbase: {playerState.resources.fanbase} / 1000</p>
        <p>Controversy: {playerState.resources.controversy} / 80</p>
      </div>
    </div>
  );
};

// ============================================================================
// KID DASHBOARD
// ============================================================================

const KidDashboard: React.FC<KidDashboardProps> = ({ playerState }) => {
  if (playerState.roleType !== 'kid') return null;
  
  const corruption = playerState.resources.corruption;
  const corruptionLevel = getCorruptionLevelName(corruption);
  
  return (
    <div style={{ padding: '20px', color: '#00ff00' }}>
      <h1>Kid Dashboard</h1>
      <p>Role: The Youth (Caught in the Middle)</p>
      
      {/* Resources */}
      <div>
        <h2>Resources</h2>
        <p>Allowance: ${playerState.resources.allowance}</p>
        <p>Corruption: {corruption.toFixed(1)}% ({corruptionLevel})</p>
        <p>Trust: {playerState.resources.trust}%</p>
      </div>
      
      {/* Tape Collection */}
      <div>
        <h2>Tape Collection ({playerState.tapeCollection.length})</h2>
        {/* dk:reminder Render album covers */}
      </div>
      
      {/* Hidden Stash */}
      <div>
        <h2>Hidden Stash ({playerState.hiddenStash.length})</h2>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>
          (Albums hidden from parents)
        </p>
        {/* dk:reminder Render hidden albums */}
      </div>
      
      {/* Concert History */}
      <div>
        <h2>Concerts Attended ({playerState.concertHistory.length})</h2>
        {/* dk:reminder Render concert list with sneaked/caught status */}
      </div>
      
      {/* Win Condition Progress */}
      <div>
        <h2>Win Progress</h2>
        <p>Independence: {corruption >= 100 && playerState.resources.trust > 30 ? 'Achieved!' : 'In Progress'}</p>
        <p>Goal: Corruption = 100 AND Trust &gt; 30</p>
      </div>
      
      {/* Frequency Display (Kid's tuning drifts with corruption) */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#222', borderRadius: '5px' }}>
        <h3>Your Frequency</h3>
        <p>Base: {(440 - corruption * 0.05).toFixed(2)} Hz</p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>
          (Drifts from A440 → A435 as you rebel)
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

/**
 * Corruption meter component (visual indicator)
 */
export const CorruptionMeter: React.FC<{ corruption: number }> = ({ corruption }) => {
  const level = getCorruptionLevelName(corruption);
  
  return (
    <div style={{ 
      padding: '10px', 
      background: '#222', 
      borderRadius: '5px',
      border: `2px solid ${getCorruptionColor(corruption)}`
    }}>
      <h3>Corruption</h3>
      <div style={{ 
        width: '100%', 
        height: '20px', 
        background: '#111', 
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${corruption}%`,
          height: '100%',
          background: getCorruptionColor(corruption),
          transition: 'width 0.5s ease'
        }} />
      </div>
      <p>{corruption.toFixed(1)}% ({level})</p>
    </div>
  );
};

function getCorruptionColor(corruption: number): string {
  if (corruption < 20) return '#00ff00';  // Green (innocent)
  if (corruption < 40) return '#88ff00';  // Yellow-green (curious)
  if (corruption < 60) return '#ffaa00';  // Orange (rebellious)
  if (corruption < 80) return '#ff4400';  // Red-orange (subversive)
  return '#ff0000';                       // Red (corrupted)
}

// dk:reminder Implement full UI components based on role requirements
// dk:vision Dark theme, period-appropriate aesthetic (cassette tapes, VHS)
