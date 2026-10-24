const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const User = require('../models/User');
const { calculateBRStandings } = require('../utils/brScoring');

async function seedLiveVisualDemo() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[LIVE DEMO] Connected to MongoDB Atlas.');

  // ========================================================
  // 1. POPULATE BRACKET TOURNAMENT: "BGMI WOW 4v4 Masters League"
  // ========================================================
  const bracketTournament = await Tournament.findOne({ slug: 'bgmi-wow-4v4-masters-league' });
  if (bracketTournament) {
    bracketTournament.tournamentFormat = 'knockout_bracket';
    bracketTournament.matchType = '4v4';
    bracketTournament.seriesLength = 3;

    bracketTournament.bracket = [
      {
        roundNumber: 1,
        roundName: 'Quarter-Finals',
        matches: [
          {
            matchNumber: 1,
            team1: { teamName: 'Team Liquid', score: 2 },
            team2: { teamName: 'Team SoloMid', score: 1 },
            bestOf: 3,
            team1Wins: 2,
            team2Wins: 1,
            winner: { teamName: 'Team Liquid' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_849201', password: '123' }
          },
          {
            matchNumber: 2,
            team1: { teamName: 'Fnatic', score: 2 },
            team2: { teamName: 'Cloud9', score: 0 },
            bestOf: 3,
            team1Wins: 2,
            team2Wins: 0,
            winner: { teamName: 'Fnatic' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_849202', password: '123' }
          },
          {
            matchNumber: 3,
            team1: { teamName: 'G2 Esports', score: 2 },
            team2: { teamName: 'Sentinels', score: 1 },
            bestOf: 3,
            team1Wins: 2,
            team2Wins: 1,
            winner: { teamName: 'G2 Esports' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_849203', password: '123' }
          },
          {
            matchNumber: 4,
            team1: { teamName: '100 Thieves', score: 2 },
            team2: { teamName: 'Team 8', score: 0 },
            bestOf: 3,
            team1Wins: 2,
            team2Wins: 0,
            winner: { teamName: '100 Thieves' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_849204', password: '123' }
          }
        ]
      },
      {
        roundNumber: 2,
        roundName: 'Semi-Finals',
        matches: [
          {
            matchNumber: 5,
            team1: { teamName: 'Team Liquid', score: 1 },
            team2: { teamName: 'Fnatic', score: 2 },
            bestOf: 3,
            team1Wins: 1,
            team2Wins: 2,
            winner: { teamName: 'Fnatic' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_849205', password: '123' }
          },
          {
            matchNumber: 6,
            team1: { teamName: 'G2 Esports', score: 2 },
            team2: { teamName: '100 Thieves', score: 1 },
            bestOf: 3,
            team1Wins: 2,
            team2Wins: 1,
            winner: { teamName: 'G2 Esports' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_849206', password: '123' }
          }
        ]
      },
      {
        roundNumber: 3,
        roundName: 'Grand Finals',
        matches: [
          {
            matchNumber: 7,
            team1: { teamName: 'Fnatic', score: 3 },
            team2: { teamName: 'G2 Esports', score: 2 },
            bestOf: 5,
            team1Wins: 3,
            team2Wins: 2,
            winner: { teamName: 'Fnatic' },
            status: 'completed',
            roomCredentials: { roomId: 'ROOM_FINALS', password: '123' }
          }
        ]
      }
    ];

    bracketTournament.champion = {
      firstPlace: { teamName: 'Fnatic' },
      secondPlace: { teamName: 'G2 Esports' }
    };
    bracketTournament.status = 'completed';

    await bracketTournament.save();
    console.log('[LIVE DEMO] Bracket Tournament populated successfully with 3 rounds & champion!');
  }

  // ========================================================
  // 2. POPULATE BATTLE ROYALE STANDINGS: "BGIS 2026"
  // ========================================================
  const bgisTournament = await Tournament.findOne({ slug: 'bgis-2026-battlegrounds-india-pro' });
  if (bgisTournament) {
    const teamsData = [
      { name: 'Skylightz Gaming', slot: 1, wwcd: 2, kills: 24, rank1: 1, rank2: 2 },
      { name: 'GodLike Esports', slot: 2, wwcd: 1, kills: 22, rank1: 2, rank2: 1 },
      { name: 'Team XSpark', slot: 3, wwcd: 1, kills: 18, rank1: 3, rank2: 4 },
      { name: 'Revenant Esports', slot: 4, wwcd: 0, kills: 16, rank1: 4, rank2: 5 },
      { name: 'Global Esports', slot: 5, wwcd: 0, kills: 15, rank1: 5, rank2: 3 },
      { name: 'Team 8Bit', slot: 6, wwcd: 0, kills: 14, rank1: 6, rank2: 6 },
      { name: 'OR Esports', slot: 7, wwcd: 0, kills: 12, rank1: 7, rank2: 8 },
      { name: 'Hydra Officials', slot: 8, wwcd: 0, kills: 11, rank1: 8, rank2: 7 },
      // Cutoff line happens here (Top 8 Qualify)
      { name: 'Team Enigma Forever', slot: 9, wwcd: 0, kills: 8, rank1: 9, rank2: 11 },
      { name: 'Chemin Esports', slot: 10, wwcd: 0, kills: 7, rank1: 10, rank2: 10 },
      { name: 'Blind Esports', slot: 11, wwcd: 0, kills: 6, rank1: 11, rank2: 9 },
      { name: 'Entity Gaming', slot: 12, wwcd: 0, kills: 5, rank1: 12, rank2: 13 },
      { name: 'Marcos Gaming', slot: 13, wwcd: 0, kills: 4, rank1: 13, rank2: 12 },
      { name: 'Reckoning Esports', slot: 14, wwcd: 0, kills: 3, rank1: 14, rank2: 14 },
      { name: 'Autobotz Esports', slot: 15, wwcd: 0, kills: 2, rank1: 15, rank2: 15 },
      { name: 'Team Insane', slot: 16, wwcd: 0, kills: 1, rank1: 16, rank2: 16 }
    ];

    // Compute BGIS 10-point scale:
    // 1st = 10, 2nd = 6, 3rd = 5, 4th = 4, 5th = 3, 6th = 2, 7th = 1, 8th = 1
    const getPlacementPts = (r) => {
      if (r === 1) return 10;
      if (r === 2) return 6;
      if (r === 3) return 5;
      if (r === 4) return 4;
      if (r === 5) return 3;
      if (r === 6) return 2;
      if (r === 7 || r === 8) return 1;
      return 0;
    };

    const match1Results = teamsData.map((t) => ({
      slotNumber: t.slot,
      teamName: t.name,
      rank: t.rank1,
      kills: Math.floor(t.kills / 2),
      placementPoints: getPlacementPts(t.rank1),
      killPoints: Math.floor(t.kills / 2),
      totalPoints: getPlacementPts(t.rank1) + Math.floor(t.kills / 2),
      wwcd: t.rank1 === 1
    }));

    const match2Results = teamsData.map((t) => ({
      slotNumber: t.slot,
      teamName: t.name,
      rank: t.rank2,
      kills: Math.ceil(t.kills / 2),
      placementPoints: getPlacementPts(t.rank2),
      killPoints: Math.ceil(t.kills / 2),
      totalPoints: getPlacementPts(t.rank2) + Math.ceil(t.kills / 2),
      wwcd: t.rank2 === 1
    }));

    const groupTeams = teamsData.map((t) => ({
      slotNumber: t.slot,
      teamName: t.name,
      teamTag: t.name.split(' ')[0].toUpperCase()
    }));

    bgisTournament.stages = [
      {
        name: 'Round 1 - Qualifiers',
        stageOrder: 1,
        status: 'live',
        isFinalStage: false,
        qualifyCountPerGroup: 8,
        groups: [
          {
            name: 'Group A',
            teams: groupTeams,
            matches: [
              {
                matchNumber: 1,
                title: 'Match 1 - Erangel',
                map: 'Erangel',
                roomId: '849201',
                password: '123',
                status: 'completed',
                results: match1Results
              },
              {
                matchNumber: 2,
                title: 'Match 2 - Miramar',
                map: 'Miramar',
                roomId: '849202',
                password: '123',
                status: 'completed',
                results: match2Results
              }
            ]
          }
        ]
      }
    ];

    await bgisTournament.save();
    console.log('[LIVE DEMO] BGIS Tournament populated with Stage 1 & 2 completed matches!');
  }

  console.log('[LIVE DEMO] All done! Both tournaments are ready to view live on http://localhost:5173');
  process.exit(0);
}

seedLiveVisualDemo().catch(console.error);
