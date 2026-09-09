const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const Game = require('../models/Game');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[SEED] Database already initialized.');
      return;
    }

    console.log('[SEED] Seeding LOBBYIT database with authentic game posters and tournament data...');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Create Demo Organizers & Team Users
    const organizer1 = await User.create({
      name: 'Nodwin Esports',
      username: 'nodwin_esports',
      email: 'organizer@lobbyit.com',
      password: defaultPassword,
      role: 'Organizer',
      avatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
      bio: 'Premier esports tournament organizer hosting South Asia tournaments.'
    });

    const organizer2 = await User.create({
      name: 'Skyesports Official',
      username: 'skyesports',
      email: 'skyesports@lobbyit.com',
      password: defaultPassword,
      role: 'Organizer',
      avatar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80',
      bio: 'Pioneering global competitive gaming tournaments.'
    });

    const teamUser1 = await User.create({
      name: 'Sentinel Squad',
      username: 'sentinels_captain',
      email: 'team@lobbyit.com',
      password: defaultPassword,
      role: 'Team',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
      bio: 'Pro tactical shooter team competing in Valorant and CS2.'
    });

    const teamUser2 = await User.create({
      name: 'GodLike Esports',
      username: 'godlike_gaming',
      email: 'godlike@lobbyit.com',
      password: defaultPassword,
      role: 'Team',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio: 'Top tier battle royale team.'
    });

    // 2. Create Games with Official Keyart Posters
    const games = await Game.insertMany([
      {
        name: 'Valorant',
        slug: 'valorant',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        description: '5v5 character-based tactical FPS where precise gunplay meets adaptive agent abilities.',
        category: 'Tactical FPS'
      },
      {
        name: 'Free Fire',
        slug: 'free-fire',
        icon: '/images/free_fire.png',
        banner: '/images/free_fire.png',
        description: 'Fast-paced mobile survival game with 50 players parachuting onto remote islands.',
        category: 'Battle Royale'
      },
      {
        name: 'BGMI',
        slug: 'bgmi',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/513143-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        description: 'High-octane mobile battle royale survival shooter featuring 100-player tactical drops.',
        category: 'Battle Royale'
      },
      {
        name: 'CS2',
        slug: 'cs2',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/32399_IGDB-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        description: 'The legendary competitive tactical shooter upgraded with Source 2 physics & sub-tick updates.',
        category: 'Tactical FPS'
      },
      {
        name: 'Mobile Legends',
        slug: 'mobile-legends',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/494131-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        description: 'Popular 5v5 mobile MOBA showdown featuring instant matchmaking and laning battles.',
        category: 'Mobile MOBA'
      },
      {
        name: 'eFootball',
        slug: 'efootball',
        icon: '/images/efootball.png',
        banner: '/images/efootball.png',
        description: 'Competitive football simulator featuring real-world club rosters and custom tournaments.',
        category: 'Sports Simulator'
      },
      {
        name: 'League of Legends',
        slug: 'league-of-legends',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/21779-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        description: 'Premier 5v5 MOBA featuring high strategy, champion synergy, and nexus objective control.',
        category: 'MOBA'
      },
      {
        name: 'Fortnite',
        slug: 'fortnite',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/33214-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80',
        description: 'Dynamic battle royale combined with rapid structural building mechanics.',
        category: 'Battle Royale'
      },
      {
        name: 'COD',
        slug: 'cod',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/512710-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1200&q=80',
        description: 'Fast tactical shooter featuring Call of Duty Warzone & Multiplayer arena modes.',
        category: 'FPS'
      },
      {
        name: 'Dota 2',
        slug: 'dota-2',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/29595-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        description: 'Deep strategic action RTS MOBA with unlimited build customization and heroes.',
        category: 'MOBA'
      }
    ]);

    // 3. Create Teams
    const team1 = await Team.create({
      name: 'Sentinel Prime',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SentinelPrime',
      game: 'Valorant',
      description: 'Competitive Valorant squad focusing on strategic site execution.',
      owner: teamUser1._id,
      captain: 'Alex "Viper" Mercer',
      country: 'India',
      players: [
        { name: 'Alex Mercer', inGameName: 'Viper', email: 'alex@sentinel.gg', country: 'India' },
        { name: 'Rohan Sharma', inGameName: 'Phoenix', email: 'rohan@sentinel.gg', country: 'India' },
        { name: 'David Miller', inGameName: 'Sova', email: 'david@sentinel.gg', country: 'United States' },
        { name: 'Karan Patel', inGameName: 'Omen', email: 'karan@sentinel.gg', country: 'India' },
        { name: 'Vikram Singh', inGameName: 'Jett', email: 'vikram@sentinel.gg', country: 'India' }
      ]
    });

    const team2 = await Team.create({
      name: 'GodLike Esports',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GodLikeEsports',
      game: 'BGMI',
      description: 'Dominant Battle Royale quad known for aggressive fragging.',
      owner: teamUser2._id,
      captain: 'Jonathan "Jonathan" Amaral',
      country: 'India',
      players: [
        { name: 'Jonathan Amaral', inGameName: 'Jonathan', email: 'jonathan@godlike.in', country: 'India' },
        { name: 'Abhishek Choudhary', inGameName: 'Zgod', email: 'zgod@godlike.in', country: 'India' },
        { name: 'Suraj Nityanand', inGameName: 'Neyo', email: 'neyo@godlike.in', country: 'India' },
        { name: 'Simarjeet Singh', inGameName: 'Psycho', email: 'psycho@godlike.in', country: 'India' }
      ]
    });

    // 4. Create Tournaments
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const tourney1 = await Tournament.create({
      title: 'LOBBYIT Valorant Open Masters 2026',
      slug: 'lobbyit-valorant-open-masters-2026',
      game: 'Valorant',
      banner: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ValorantMasters',
      description: 'The flagship 5v5 open tactical tournament hosted by Nodwin Esports. Compete against top regional teams for glory and cash prizes.',
      organizer: organizer1._id,
      tournamentType: 'Online',
      platform: 'PC',
      location: 'South Asia Server',
      country: 'India',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 5, max: 7 },
      maxTeams: 32,
      prizePool: '₹1,000,000',
      rules: '1. All matches are 5v5 MR12 standard competitive format.\n2. Tactical timeouts allowed once per side.\n3. Anti-cheat software Vanguard must be active.',
      status: 'published'
    });

    const tourney2 = await Tournament.create({
      title: 'Free Fire Survival Championship',
      slug: 'free-fire-survival-championship',
      game: 'Free Fire',
      banner: '/images/free_fire.png',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FreeFireShowdown',
      description: 'High-energy mobile battle royale survival cup with 50-player squad parachutes.',
      organizer: organizer2._id,
      tournamentType: 'Online',
      platform: 'Mobile',
      location: 'Custom Room',
      country: 'India',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 4, max: 4 },
      maxTeams: 48,
      prizePool: '₹350,000',
      rules: 'Official Free Fire esports league placement points system.',
      status: 'published'
    });

    const tourney3 = await Tournament.create({
      title: 'India Campus BGMI Cup',
      slug: 'india-campus-bgmi-cup',
      game: 'BGMI',
      banner: 'https://static-cdn.jtvnw.net/ttv-boxart/513143-285x380.jpg',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=CampusBGMICup',
      description: 'National collegiate esports tournament open to registered student squads across India.',
      organizer: organizer1._id,
      tournamentType: 'Online',
      platform: 'Mobile',
      location: 'Custom Rooms',
      country: 'India',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 4, max: 5 },
      maxTeams: 64,
      prizePool: '₹500,000',
      rules: '1. Erangel, Miramar, and Sanhok maps.\n2. Official points system (10 points per WWCD).',
      status: 'published'
    });

    const tourney4 = await Tournament.create({
      title: 'eFootball Kickoff Masters',
      slug: 'efootball-kickoff-masters',
      game: 'eFootball',
      banner: '/images/efootball.png',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=eFootballCup',
      description: '1v1 & 2v2 football simulation tournament featuring real-world club rosters.',
      organizer: organizer2._id,
      tournamentType: 'Online',
      platform: 'Crossplay',
      location: 'Online Server',
      country: 'Global',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 1, max: 2 },
      maxTeams: 64,
      prizePool: '₹200,000',
      rules: '10-minute halves, extra time & penalties active.',
      status: 'published'
    });

    const tourney5 = await Tournament.create({
      title: 'Mobile Legends Bang Bang Arena',
      slug: 'mobile-legends-bang-bang-arena',
      game: 'Mobile Legends',
      banner: 'https://static-cdn.jtvnw.net/ttv-boxart/494131-285x380.jpg',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=MLBBShowdown',
      description: 'Fast 5v5 mobile MOBA showdown featuring instant drafting and lane battles.',
      organizer: organizer1._id,
      tournamentType: 'Online',
      platform: 'Mobile',
      location: 'Custom Room',
      country: 'Global',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 5, max: 6 },
      maxTeams: 32,
      prizePool: '₹250,000',
      rules: 'Standard MLBB tournament ban/pick rules.',
      status: 'published'
    });

    // 5. Create Sample Registrations
    await Registration.create({
      tournament: tourney1._id,
      team: team1._id,
      submittedBy: teamUser1._id,
      players: team1.players,
      status: 'accepted',
      submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date()
    });

    await Registration.create({
      tournament: tourney3._id,
      team: team2._id,
      submittedBy: teamUser2._id,
      players: team2.players,
      status: 'pending',
      submittedAt: new Date()
    });

    console.log('[SEED] Successfully seeded authentic game posters!');
  } catch (error) {
    console.error('[SEED ERROR]', error.message);
  }
};

module.exports = seedData;
