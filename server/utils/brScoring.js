/**
 * Battle Royale Tournament Scoring Engine (BGIS / BMSD / Esports Official Standards)
 */

const OFFICIAL_BGIS_PLACEMENT_POINTS = {
  1: 10, // WWCD (Winner Winner Chicken Dinner / Booyah)
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 0,
  16: 0
};

/**
 * Calculates placement, kill, and total points for a single team in a match.
 * @param {number|string} rank - Finished rank (1 to 16, or 0 if unranked)
 * @param {number|string} kills - Total finishes/kills by the team
 * @param {object} [customMatrix] - Optional custom placement point mapping
 * @returns {object} { rank, kills, placementPoints, killPoints, totalPoints, wwcd }
 */
function calculateMatchPoints(rank, kills = 0, customMatrix = null) {
  const numericRank = parseInt(rank, 10);
  const parsedRank = (!isNaN(numericRank) && numericRank >= 1 && numericRank <= 16) ? numericRank : 0;
  const parsedKills = Math.max(0, parseInt(kills, 10) || 0);

  const matrix = customMatrix || OFFICIAL_BGIS_PLACEMENT_POINTS;
  const placementPoints = parsedRank > 0 && matrix[parsedRank] !== undefined ? matrix[parsedRank] : 0;
  const killPoints = parsedKills * 1; // 1 pt per kill
  const totalPoints = placementPoints + killPoints;
  const wwcd = parsedRank === 1;

  return {
    rank: parsedRank,
    kills: parsedKills,
    placementPoints,
    killPoints,
    totalPoints,
    wwcd
  };
}

/**
 * Aggregates all matches played within a group to generate cumulative overall group standings.
 * Applies official tie-breaker logic:
 * 1. Total Points (DESC)
 * 2. Total WWCDs (DESC)
 * 3. Total Placement Points (DESC)
 * 4. Total Kill Points (DESC)
 * 5. Best single rank (ASC: 1 < 2)
 *
 * @param {Array} teamsInGroup - Assigned slots/teams in this group
 * @param {Array} matches - List of matches with results
 * @returns {Array} Sorted standings array with overallRank (1 to 16)
 */
function calculateGroupLeaderboard(teamsInGroup = [], matches = []) {
  const standingsMap = new Map();

  // 1. Initialize all registered/assigned slots (Slots 1 to 16)
  teamsInGroup.forEach((slotItem) => {
    const key = (slotItem.team?._id || slotItem.team || `slot_${slotItem.slotNumber}`).toString();
    standingsMap.set(key, {
      teamId: slotItem.team?._id || slotItem.team || null,
      teamName: slotItem.teamName || slotItem.team?.name || `Slot ${slotItem.slotNumber}`,
      teamTag: slotItem.teamTag || slotItem.team?.tag || '',
      teamLogo: slotItem.teamLogo || slotItem.team?.logo || '',
      slotNumber: slotItem.slotNumber,
      matchesPlayed: 0,
      wwcd: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      bestRank: 99,
      matchBreakdown: []
    });
  });

  // 2. Accumulate results from all matches in this group
  matches.forEach((match, matchIdx) => {
    if (!match.results || match.results.length === 0) return;

    // Check if match was actively scored or marked completed
    const hasScores = match.status === 'completed' || match.results.some((r) => (r.rank > 0 || r.kills > 0 || r.placementPoints > 0));
    if (!hasScores) return;

    match.results.forEach((res) => {
      // Find matching entry by teamId or slotNumber
      const keyByTeam = res.team ? (res.team._id || res.team).toString() : null;
      let teamStat = keyByTeam ? standingsMap.get(keyByTeam) : null;

      if (!teamStat) {
        // Fallback by slotNumber
        for (const stat of standingsMap.values()) {
          if (stat.slotNumber === res.slotNumber) {
            teamStat = stat;
            break;
          }
        }
      }

      if (!teamStat) {
        // Unassigned or dynamically added team
        const fallbackKey = keyByTeam || `slot_${res.slotNumber}`;
        teamStat = {
          teamId: res.team || null,
          teamName: res.teamName || `Slot ${res.slotNumber}`,
          teamTag: '',
          teamLogo: res.teamLogo || '',
          slotNumber: res.slotNumber,
          matchesPlayed: 0,
          wwcd: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
          bestRank: 99,
          matchBreakdown: []
        };
        standingsMap.set(fallbackKey, teamStat);
      }

      // Record match result only if rank > 0 or kills > 0 or explicitly completed
      const played = res.rank > 0 || res.kills > 0 || res.placementPoints > 0 || res.killPoints > 0;
      if (played) {
        teamStat.matchesPlayed += 1;
        if (res.wwcd || res.rank === 1) teamStat.wwcd += 1;
        teamStat.placementPoints += (res.placementPoints || 0);
        teamStat.killPoints += (res.killPoints || 0);
        teamStat.totalPoints += (res.totalPoints || 0);
        if (res.rank > 0 && res.rank < teamStat.bestRank) {
          teamStat.bestRank = res.rank;
        }

        teamStat.matchBreakdown.push({
          matchNumber: match.matchNumber || matchIdx + 1,
          matchTitle: match.title || `Match ${match.matchNumber || matchIdx + 1}`,
          map: match.map || 'Erangel',
          rank: res.rank,
          kills: res.kills,
          placementPoints: res.placementPoints,
          killPoints: res.killPoints,
          totalPoints: res.totalPoints,
          wwcd: res.wwcd || res.rank === 1
        });
      }
    });
  });

  // 3. Sort strictly by Official Esports Tiebreakers
  const standings = Array.from(standingsMap.values());

  standings.sort((a, b) => {
    // Rule 1: Total Points (Desc)
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    // Rule 2: Total WWCDs / Wins (Desc)
    if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
    // Rule 3: Placement Points (Desc)
    if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
    // Rule 4: Kill Points (Desc)
    if (b.killPoints !== a.killPoints) return b.killPoints - a.killPoints;
    // Rule 5: Best Single Placement Rank (Asc: 1st < 2nd)
    if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;
    // Rule 6: Slot number fallback
    return a.slotNumber - b.slotNumber;
  });

  // 4. Return with 1-based overallRank
  return standings.map((item, index) => ({
    overallRank: index + 1,
    ...item
  }));
}

/**
 * Computes Stage-Wide Cumulative Leaderboard across ALL groups in the stage.
 * Used when a stage has multiple groups (e.g. Group A & Group B in Qualifiers)
 * or for Grand Finals.
 */
function calculateStageWideLeaderboard(groups = []) {
  const stageMap = new Map();

  groups.forEach((group) => {
    const groupLb = calculateGroupLeaderboard(group.teams, group.matches);
    groupLb.forEach((team) => {
      const key = (team.teamId || `${group.name}_slot_${team.slotNumber}`).toString();
      let existing = stageMap.get(key);

      if (!existing) {
        existing = {
          ...team,
          groupName: group.name,
          matchesPlayed: team.matchesPlayed,
          wwcd: team.wwcd,
          placementPoints: team.placementPoints,
          killPoints: team.killPoints,
          totalPoints: team.totalPoints,
          bestRank: team.bestRank,
          matchBreakdown: [...team.matchBreakdown]
        };
        stageMap.set(key, existing);
      } else {
        existing.matchesPlayed += team.matchesPlayed;
        existing.wwcd += team.wwcd;
        existing.placementPoints += team.placementPoints;
        existing.killPoints += team.killPoints;
        existing.totalPoints += team.totalPoints;
        if (team.bestRank < existing.bestRank) existing.bestRank = team.bestRank;
        existing.matchBreakdown.push(...team.matchBreakdown);
      }
    });
  });

  const allTeams = Array.from(stageMap.values());
  allTeams.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
    if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
    if (b.killPoints !== a.killPoints) return b.killPoints - a.killPoints;
    return a.bestRank - b.bestRank;
  });

  return allTeams.map((item, index) => ({
    overallRank: index + 1,
    ...item
  }));
}

module.exports = {
  OFFICIAL_BGIS_PLACEMENT_POINTS,
  calculateMatchPoints,
  calculateGroupLeaderboard,
  calculateStageWideLeaderboard
};
