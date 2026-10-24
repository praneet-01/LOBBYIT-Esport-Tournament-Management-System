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

const CASE2_TEAMS = [
  { name: 'Total Gaming Esports', tag: 'TG', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'TSG Army', tag: 'TSG', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Desi Gamers Squad', tag: 'DG', logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' },
  { name: 'Blind Clash Esports', tag: 'BLIND', logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Entity 4v4 Clan', tag: 'ENT', logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { name: 'Revenant Warriors', tag: 'RNT', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Nigma Galaxy FF', tag: 'NGX', logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=150&q=80' },
  { name: 'Orangutan Clash', tag: 'OG', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80' },
  { name: 'Team Elite Force', tag: 'TE', logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80' },
  { name: 'Chemin Squad', tag: 'CHM', logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80' }
];

async function seedHeadToHeadDemo() {
  try {
    await connectDB();
    console.log('[H2H SEED] Connected to Database. Setting up Case 1 & Case 2 Tournaments...');

    // 1. Get or create Organizer
    let organizer = await User.findOne({ email: 'organizer@lobbyit.com' });
    if (!organizer) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('organizer123', salt);
      organizer = await User.create({
        name: 'Official Organizer',
        username: 'esports_lead',
        email: 'organizer@lobbyit.com',
        password: hashedPassword,
        role: 'Organizer',
        bio: 'Premier tournament organizer hosting Battle Royale, 4v4 Clash Squad, and 1v1 Showdowns.'
      });
    }

    // 2. Create player captains & teams for Case 1 (2 Teams: SouL & GodLike)
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    const getOrCreateTeam = async (name, tag, logo) => {
      let team = await Team.findOne({ name });
      if (!team) {
        const captainEmail = `${tag.toLowerCase()}_cap@lobbyit.com`;
        let cap = await User.findOne({ email: captainEmail });
        if (!cap) {
          cap = await User.create({
            name: `${name} Captain`,
            username: `${tag.toLowerCase()}_cap`,
            email: captainEmail,
            password: defaultPassword,
            role: 'Player'
          });
        }
        team = await Team.create({
          name,
          tag,
          logo,
          game: 'BGMI',
          captain: cap._id,
          players: [
            { user: cap._id, ign: `${tag}_Mavi`, role: 'Captain' },
            { ign: `${tag}_Scout`, role: 'Assaulter' },
            { ign: `${tag}_Jonathan`, role: 'Fragger' },
            { ign: `${tag}_Goblin`, role: 'Support' }
          ]
        });
      }
      return team;
    };

    const teamSoul = await getOrCreateTeam(
      'Team SouL',
      'SOUL',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80'
    );
    const teamGodL = await getOrCreateTeam(
      'GodLike Esports',
      'GODL',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=150&q=80'
    );

    // =========================================================================
    // CASE 1: DIRECT 2-TEAM SHOWDOWN (BGMI WOW 4v4 Mode, 3 Matches, Best-of-3)
    // =========================================================================
    console.log('[H2H SEED] Seeding Case 1: Direct 2-Team Showdown (BGMI WOW Bo3)...');
    await Tournament.deleteOne({ slug: 'bgmi-wow-4v4-grand-showdown' });

    const case1Tournament = await Tournament.create({
      title: 'BGMI WOW 4v4 Grand Showdown: SouL vs GodLike',
      slug: 'bgmi-wow-4v4-grand-showdown',
      game: 'BGMI',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      description: 'Case 1 Showcase: Direct 2-team showdown in BGMI World of Wonder (WOW) 4v4 mode. 3 matches scheduled — whoever wins 2 games takes the series and crowns the championship!',
      organizer: organizer._id,
      tournamentType: 'Online',
      tournamentFormat: 'direct_series',
      matchType: '4v4',
      seriesLength: 3, // Bo3: first to win 2 wins!
      platform: 'Mobile',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() - 1 * 60 * 60 * 1000),
      teamSize: { min: 4, max: 5 },
      maxTeams: 2,
      prizePool: '₹1,00,000',
      status: 'completed',
      rules: '1. BGMI WOW 4v4 mode TDM.\n2. Standard weapon restrictions apply.\n3. Best-of-3 series: First team to 2 match wins takes the series.',
      bracket: [
        {
          roundNumber: 1,
          roundName: 'Grand Finals Showdown',
          matches: [
            {
              matchNumber: 1,
              roundNumber: 1,
              roundName: 'Grand Finals Showdown',
              team1: {
                team: teamSoul._id,
                teamName: teamSoul.name,
                teamLogo: teamSoul.logo,
                score: 2 // Won 2 games!
              },
              team2: {
                team: teamGodL._id,
                teamName: teamGodL.name,
                teamLogo: teamGodL.logo,
                score: 1 // Won 1 game
              },
              bestOf: 3,
              games: [
                {
                  gameNumber: 1,
                  map: 'WOW Arena 1 (Santorini)',
                  team1Score: 40,
                  team2Score: 36,
                  winnerTeamId: teamSoul._id,
                  status: 'completed',
                  screenshotProof: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'
                },
                {
                  gameNumber: 2,
                  map: 'WOW Arena 2 (Hangar)',
                  team1Score: 35,
                  team2Score: 40,
                  winnerTeamId: teamGodL._id,
                  status: 'completed',
                  screenshotProof: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
                },
                {
                  gameNumber: 3,
                  map: 'WOW Arena 3 (Warehouse)',
                  team1Score: 40,
                  team2Score: 38,
                  winnerTeamId: teamSoul._id,
                  status: 'completed',
                  screenshotProof: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'
                }
              ],
              winner: {
                team: teamSoul._id,
                teamName: teamSoul.name,
                teamLogo: teamSoul.logo
              },
              status: 'completed',
              roomId: '948201',
              password: 'lobby',
              map: 'WOW 4v4 Map Rotation',
              isBye: false
            }
          ]
        }
      ],
      champion: {
        firstPlace: {
          team: teamSoul._id,
          teamName: teamSoul.name,
          teamLogo: teamSoul.logo
        },
        secondPlace: {
          team: teamGodL._id,
          teamName: teamGodL.name,
          teamLogo: teamGodL.logo
        },
        thirdPlace: null
      }
    });

    // Registrations for Case 1
    await Registration.deleteMany({ tournament: case1Tournament._id });
    await Registration.create([
      { tournament: case1Tournament._id, team: teamSoul._id, captain: teamSoul.captain, submittedBy: teamSoul.captain, status: 'accepted' },
      { tournament: case1Tournament._id, team: teamGodL._id, captain: teamGodL.captain, submittedBy: teamGodL.captain, status: 'accepted' }
    ]);
    console.log(`[H2H SEED] Case 1 created: /tournaments/${case1Tournament.slug}`);

    // =========================================================================
    // CASE 2: MULTI-TEAM KNOCKOUT BRACKET (10 Teams -> 5 Matches in Round 1)
    // Free Fire Clash Squad 4v4 Tournament
    // =========================================================================
    console.log('[H2H SEED] Seeding Case 2: 10-Team Clash Squad Knockout (5 1v1 Matches)...');
    await Tournament.deleteOne({ slug: 'free-fire-clash-squad-season-1' });

    const case2CreatedTeams = [];
    for (const t of CASE2_TEAMS) {
      const teamObj = await getOrCreateTeam(t.name, t.tag, t.logo);
      case2CreatedTeams.push(teamObj);
    }

    // Build Round 1 matches: 10 teams paired into 5 matches
    const round1Matches = [];
    let matchIdx = 1;
    for (let i = 0; i < case2CreatedTeams.length; i += 2) {
      const t1 = case2CreatedTeams[i];
      const t2 = case2CreatedTeams[i + 1];

      // Give 2 finished matches with scores, and 3 upcoming matches
      const isFinished = i < 4;
      const t1Wins = isFinished ? 2 : 0;
      const t2Wins = isFinished ? (i === 0 ? 0 : 1) : 0;
      const winner = isFinished ? { team: t1._id, teamName: t1.name, teamLogo: t1.logo } : null;

      round1Matches.push({
        matchNumber: matchIdx++,
        roundNumber: 1,
        roundName: 'Round 1 (Quarter-Finals)',
        team1: { team: t1._id, teamName: t1.name, teamLogo: t1.logo, score: t1Wins },
        team2: { team: t2._id, teamName: t2.name, teamLogo: t2.logo, score: t2Wins },
        bestOf: 3,
        games: [
          {
            gameNumber: 1,
            map: 'Bermuda CS',
            team1Score: isFinished ? 7 : 0,
            team2Score: isFinished ? 4 : 0,
            winnerTeamId: isFinished ? t1._id : null,
            status: isFinished ? 'completed' : 'upcoming'
          },
          {
            gameNumber: 2,
            map: 'Kalahari CS',
            team1Score: isFinished ? (i === 0 ? 7 : 5) : 0,
            team2Score: isFinished ? (i === 0 ? 3 : 7) : 0,
            winnerTeamId: isFinished ? (i === 0 ? t1._id : t2._id) : null,
            status: isFinished ? 'completed' : 'upcoming'
          },
          {
            gameNumber: 3,
            map: 'Purgatory CS',
            team1Score: isFinished && i > 0 ? 7 : 0,
            team2Score: isFinished && i > 0 ? 5 : 0,
            winnerTeamId: isFinished && i > 0 ? t1._id : null,
            status: isFinished && i > 0 ? 'completed' : 'upcoming'
          }
        ],
        winner,
        status: isFinished ? 'completed' : (i === 4 ? 'live' : 'upcoming'),
        roomId: `CS-${100 + matchIdx}`,
        password: 'pass',
        map: 'Clash Squad Arena',
        isBye: false
      });
    }

    const case2Tournament = await Tournament.create({
      title: 'Free Fire Clash Squad 4v4 Invitational',
      slug: 'free-fire-clash-squad-season-1',
      game: 'Free Fire',
      banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      description: 'Case 2 Showcase: 10 registered squads competing in 4v4 Clash Squad knockout brackets. 5 group match fixtures in Round 1, with winners advancing round-by-round to Semi-Finals and the Grand Final!',
      organizer: organizer._id,
      tournamentType: 'Online',
      tournamentFormat: 'knockout_bracket',
      matchType: '4v4',
      seriesLength: 3, // Bo3: First team to 2 game wins advances!
      platform: 'Mobile',
      startDate: new Date(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() - 2 * 60 * 60 * 1000),
      teamSize: { min: 4, max: 5 },
      maxTeams: 16,
      prizePool: '₹2,50,000',
      status: 'published',
      rules: '1. 4v4 Clash Squad standard competitive rules.\n2. Limited ammo: YES, Character skills: NO.\n3. Best-of-3 series: First team to win 2 games advances to the next round.',
      bracket: [
        {
          roundNumber: 1,
          roundName: 'Round 1 (5 Match Fixtures)',
          matches: round1Matches
        }
      ]
    });

    // Registrations for Case 2
    await Registration.deleteMany({ tournament: case2Tournament._id });
    const regPromises = case2CreatedTeams.map((t) => 
      Registration.create({
        tournament: case2Tournament._id,
        team: t._id,
        captain: t.captain,
        submittedBy: t.captain,
        status: 'accepted'
      })
    );
    await Promise.all(regPromises);

    console.log(`[H2H SEED] Case 2 created: /tournaments/${case2Tournament.slug}`);
    console.log('[H2H SEED] Both Case 1 and Case 2 seeded successfully!');

    process.exit(0);
  } catch (err) {
    console.error('[H2H SEED ERROR]:', err);
    process.exit(1);
  }
}

seedHeadToHeadDemo();
