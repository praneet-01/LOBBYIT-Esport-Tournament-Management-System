const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const { calculateMatchPoints, calculateGroupLeaderboard } = require('./brScoring');


const TEAM_NAMES_A = [
  { name: 'Team SouL', tag: 'SOUL', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'GodLike Esports', tag: 'GODL', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Blind Esports', tag: 'BLIND', logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team XSpark', tag: 'TX', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Entity Gaming', tag: 'ENT', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Revenant Esports', tag: 'RNT', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Gladiators Esports', tag: 'GE', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Orangutan Gaming', tag: 'OG', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Medal Esports', tag: 'MED', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Hyderabad Hydras', tag: 'HH', logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' },
  { name: 'Global Esports', tag: 'GES', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Gujarat Tigers', tag: 'GT', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Carnival Gaming', tag: 'CG', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Big Brother Esports', tag: 'BB', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Tamilas', tag: 'TT', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Reckoning Esports', tag: 'RCK', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' }
];

const TEAM_NAMES_B = [
  { name: '8Bit Esports', tag: '8BIT', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Enigma Gaming', tag: 'EG', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Chemin Esports', tag: 'CHM', logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' },
  { name: 'Skylightz Gaming', tag: 'SG', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Insane', tag: 'INS', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Numen Gaming', tag: 'NUM', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'OR Esports', tag: 'ORE', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Forever', tag: 'TF', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'WindGod Esports', tag: 'WG', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Marcos Gaming', tag: 'MG', logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' },
  { name: 'Lucknow Giants', tag: 'LG', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Mayhem', tag: 'MYH', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Rivalry Esports', tag: 'RVL', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Zero', tag: 'ZERO', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Psyche', tag: 'PSY', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Genesis Esports', tag: 'GEN', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' }
];

async function seedBattleRoyaleDemo() {
  try {
    await connectDB();
    console.log('[DEMO] Starting Battle Royale Full Showcase Seeding...');

    // 1. Get or create Organizer
    let organizer = await User.findOne({ email: 'organizer@lobbyit.com' });
    if (!organizer) {
      organizer = await User.findOne({ role: 'Organizer' });
    }
    if (!organizer) {
      organizer = await User.findOne();
    }
    if (!organizer) {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash('password123', salt);
      organizer = await User.create({
        name: 'Krafton Esports India',
        username: 'krafton_esports',
        email: 'organizer@lobbyit.com',
        password: hashPassword,
        role: 'Organizer',
        bio: 'Official Battlegrounds Mobile India Tournament Operations'
      });
    }


    // 2. Create or fetch all 32 teams
    const allTeamDefs = [...TEAM_NAMES_A, ...TEAM_NAMES_B];
    const createdTeams = [];

    for (const def of allTeamDefs) {
      let team = await Team.findOne({ name: def.name });
      if (!team) {
        team = await Team.create({
          name: def.name,
          tag: def.tag,
          logo: def.logo,
          game: 'BGMI',
          owner: organizer._id,
          captain: { name: `${def.name} Captain`, inGameName: `${def.tag}_Leader` },
          players: [
            { name: 'Player 1', inGameName: `${def.tag}_Fragger`, inGameId: '512039211' },
            { name: 'Player 2', inGameName: `${def.tag}_Assault`, inGameId: '512039212' },
            { name: 'Player 3', inGameName: `${def.tag}_Support`, inGameId: '512039213' },
            { name: 'Player 4', inGameName: `${def.tag}_Sniper`, inGameId: '512039214' }
          ]
        });
      }
      createdTeams.push(team);
    }

    const groupATeams = createdTeams.slice(0, 16);
    const groupBTeams = createdTeams.slice(16, 32);

    // Build 16 Slots for Group A & Group B
    const slotsA = groupATeams.map((t, idx) => ({
      slotNumber: idx + 1,
      team: t._id,
      teamName: t.name,
      teamTag: t.tag,
      teamLogo: t.logo
    }));

    const slotsB = groupBTeams.map((t, idx) => ({
      slotNumber: idx + 1,
      team: t._id,
      teamName: t.name,
      teamTag: t.tag,
      teamLogo: t.logo
    }));

    // Clean Match 1 for Group A: Slots 1 to 16 allocated, ready for score input
    // Slot 1 (Team SouL) has a sample submitted screenshot proof for testing the claim-apply workflow!
    const matchResultsA_M1 = slotsA.map((s, idx) => {
      const isSouL = s.slotNumber === 1;
      return {
        team: s.team,
        teamName: s.teamName,
        teamLogo: s.teamLogo,
        slotNumber: s.slotNumber,
        rank: 0,
        kills: 0,
        placementPoints: 0,
        killPoints: 0,
        totalPoints: 0,
        wwcd: false,
        screenshotProof: isSouL ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80' : '',
        proofStatus: isSouL ? 'submitted' : 'none',
        submittedRank: isSouL ? 1 : 0,
        submittedKills: isSouL ? 14 : 0,
        submittedAt: isSouL ? new Date() : undefined
      };
    });

    const matchResultsA_M2 = slotsA.map((s) => ({
      team: s.team,
      teamName: s.teamName,
      teamLogo: s.teamLogo,
      slotNumber: s.slotNumber,
      rank: 0,
      kills: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      wwcd: false,
      proofStatus: 'none'
    }));

    // Group B Matches
    const matchResultsB_M1 = slotsB.map((s) => ({
      team: s.team,
      teamName: s.teamName,
      teamLogo: s.teamLogo,
      slotNumber: s.slotNumber,
      rank: 0,
      kills: 0,
      placementPoints: 0,
      killPoints: 0,
      totalPoints: 0,
      wwcd: false,
      proofStatus: 'none'
    }));

    // Fresh Stages Structure - Round 1 Qualifiers with Groups A & B
    const freshStagesData = [
      {
        name: 'Round 1 - Qualifiers',
        stageOrder: 1,
        status: 'live',
        qualifyCountPerGroup: 8,
        groups: [
          {
            name: 'Group A',
            teams: slotsA,
            matches: [
              {
                matchNumber: 1,
                title: 'Group A - Match 1 (Erangel)',
                map: 'Erangel',
                roomId: '8942101',
                password: 'bgis2026pass',
                customNote: 'Custom Room LIVE: All 16 squads join your designated slot (Slots 1 to 16).',
                status: 'live',
                scheduledTime: new Date(),
                results: matchResultsA_M1
              },
              {
                matchNumber: 2,
                title: 'Group A - Match 2 (Miramar)',
                map: 'Miramar',
                roomId: '',
                password: '',
                customNote: 'Scheduled right after Match 1 concludes.',
                status: 'upcoming',
                scheduledTime: new Date(Date.now() + 3600000),
                results: matchResultsA_M2
              }
            ]
          },
          {
            name: 'Group B',
            teams: slotsB,
            matches: [
              {
                matchNumber: 1,
                title: 'Group B - Match 1 (Erangel)',
                map: 'Erangel',
                roomId: '8943100',
                password: 'bgispass99',
                customNote: 'Group B Qualifiers: Slot allocation is strictly enforced.',
                status: 'upcoming',
                scheduledTime: new Date(Date.now() + 7200000),
                results: matchResultsB_M1
              }
            ]
          }
        ]
      }
    ];

    // 4. Update or Create BGIS Pro League Tournament
    let bgisTournament = await Tournament.findOne({ slug: 'bgis-2026-pro-league' });
    if (!bgisTournament) {
      bgisTournament = new Tournament({
        title: 'BGIS 2026 Pro League (Battlegrounds India Series)',
        slug: 'bgis-2026-pro-league',
        game: 'BGMI',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        logo: 'https://static-cdn.jtvnw.net/ttv-boxart/513143-285x380.jpg',
        description: 'The pinnacle of competitive BGMI esports. 32 pro teams divided into Group A and Group B battle across Erangel and Miramar for a direct qualification into the Grand Finals.',
        organizer: organizer._id,
        tournamentType: 'Online',
        platform: 'Mobile',
        location: 'Mumbai Arena / Online',
        country: 'India',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 7),
        registrationDeadline: new Date(Date.now() - 3600000),
        teamSize: { min: 4, max: 6 },
        maxTeams: 32,
        prizePool: '₹2,00,00,000 INR',
        rules: 'Official Krafton BGIS Rulebook: 10-Point scoring system, strict slot allocation (Slots 1 to 16), screenshot proof mandatory for verification.',
        status: 'published',
        stages: [],
        champion: null
      });
    } else {
      bgisTournament.stages = [];
      bgisTournament.champion = null;
      bgisTournament.status = 'published';
    }
    await bgisTournament.save();

    // 5. Also reset existing 'bmic' tournament with registered teams only
    const bmic = await Tournament.findOne({ slug: 'bmic' });
    if (bmic) {
      bmic.stages = [];
      bmic.champion = null;
      bmic.maxTeams = 32;
      await bmic.save();
      console.log('[DEMO] BMIC tournament reset to registered teams only (stages: [])!');
    }


    // 6. Create accepted registrations for all 32 teams for the BGIS tournament
    for (const team of createdTeams) {
      await Registration.findOneAndUpdate(
        { tournament: bgisTournament._id, team: team._id },
        {
          tournament: bgisTournament._id,
          team: team._id,
          teamName: team.name,
          teamTag: team.tag,
          submittedBy: organizer._id,
          players: team.players,
          status: 'accepted',
          reviewedAt: new Date()
        },
        { upsert: true, new: true }
      );

      if (bmic) {
        await Registration.findOneAndUpdate(
          { tournament: bmic._id, team: team._id },
          {
            tournament: bmic._id,
            team: team._id,
            teamName: team.name,
            teamTag: team.tag,
            submittedBy: organizer._id,
            players: team.players,
            status: 'accepted',
            reviewedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log('[DEMO] SUCCESS! Full Battle Royale Demo successfully seeded.');
    console.log(`[DEMO] Tournament URL: http://localhost:5173/tournaments/bgis-2026-pro-league`);
    console.log(`[DEMO] BMIC URL: http://localhost:5173/tournaments/bmic`);
    process.exit(0);
  } catch (err) {
    console.error('[DEMO] Error seeding demo:', err);
    process.exit(1);
  }
}

seedBattleRoyaleDemo();
