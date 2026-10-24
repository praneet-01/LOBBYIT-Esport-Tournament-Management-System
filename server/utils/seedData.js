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

    console.log('[SEED] Seeding LOBBYIT database with authentic games & tournament framework...');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    // 1. Create Default Organizer & Player accounts (No fake teams injected)
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

    const playerUser = await User.create({
      name: 'Player Captain',
      username: 'pro_player',
      email: 'team@lobbyit.com',
      password: defaultPassword,
      role: 'Team',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
      bio: 'Competitive esports player & team captain.'
    });

    // 2. Official Games Catalogue
    await Game.insertMany([
      {
        name: 'BGMI',
        slug: 'bgmi',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/513143-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        description: 'Battlegrounds Mobile India: Premier 16-team lobby battle royale competition.',
        category: 'Battle Royale'
      },
      {
        name: 'Free Fire',
        slug: 'free-fire',
        icon: '/images/free_fire.png',
        banner: '/images/free_fire.png',
        description: 'High-octane mobile battle royale survival and 4v4 Clash Squad tournament format.',
        category: 'Battle Royale'
      },
      {
        name: 'Valorant',
        slug: 'valorant',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        description: '5v5 character-based tactical FPS where precise gunplay meets adaptive agent abilities.',
        category: 'Tactical FPS'
      },
      {
        name: 'CS2',
        slug: 'cs2',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/32399_IGDB-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        description: 'Source 2 sub-tick competitive shooter with defusal tournaments.',
        category: 'Tactical FPS'
      },
      {
        name: 'eFootball',
        slug: 'efootball',
        icon: '/images/efootball.png',
        banner: '/images/efootball.png',
        description: 'Competitive football simulator featuring 1v1 and 2v2 championship tournaments.',
        category: 'Sports Simulator'
      },
      {
        name: 'Mobile Legends',
        slug: 'mobile-legends',
        icon: 'https://static-cdn.jtvnw.net/ttv-boxart/494131-285x380.jpg',
        banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        description: 'Popular 5v5 mobile MOBA showdown featuring instant draft and arena matches.',
        category: 'Mobile MOBA'
      }
    ]);

    // 3. Realistic Initial Tournaments (Free & Paid - Clean with ZERO fake demo teams)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Tournament 1: BGMI Battle Royale (Paid: ₹100 + ₹2 Platform Fee, 16-teams lobby per group)
    await Tournament.create({
      title: 'BGIS 2026: Battlegrounds India Pro Championship',
      slug: 'bgis-2026-battlegrounds-india-pro',
      game: 'BGMI',
      banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BGIS2026',
      description: 'Official Multi-round BGIS tournament format. Qualifiers (Group Stage) -> Semifinals -> Grand Finals. 16-Team battle royale lobbies with official 10-point WWCD + kill points system.',
      organizer: organizer1._id,
      tournamentType: 'Online',
      tournamentFormat: 'battle_royale',
      matchType: '4v4',
      platform: 'Mobile',
      location: 'Custom Lobby',
      country: 'India',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 4, max: 6 },
      maxTeams: 32,
      prizePool: '₹2,00,000',
      isPaid: true,
      entryFee: 100,
      platformFee: 2,
      rules: '1. Official BGIS 10-point scoring rule.\n2. 16 teams per lobby.\n3. Room ID & Password shared 15 mins prior.\n4. Screenshot proof required for all matches.',
      status: 'published',
      brConfig: {
        format: 'Battle Royale',
        stagesCount: 2,
        matchesPerGroup: 3,
        qualifyCountPerGroup: 8,
        pointsSystem: 'BGIS-10'
      }
    });

    // Tournament 2: Free Fire Squad Cup (Free Entry, 16 Teams BR)
    await Tournament.create({
      title: 'Free Fire All-Stars Championship',
      slug: 'free-fire-all-stars-championship',
      game: 'Free Fire',
      banner: '/images/free_fire.png',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=FFAllStars',
      description: 'Free to enter championship open to all registered mobile squads. 12-16 team lobbies across Bermuda, Purgatory & Kalahari.',
      organizer: organizer2._id,
      tournamentType: 'Online',
      tournamentFormat: 'battle_royale',
      matchType: '4v4',
      platform: 'Mobile',
      location: 'Online Server',
      country: 'India',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 4, max: 5 },
      maxTeams: 32,
      prizePool: '₹50,000',
      isPaid: false,
      entryFee: 0,
      platformFee: 2,
      rules: 'Standard Free Fire competitive league guidelines. No character skill restrictions.',
      status: 'published',
      brConfig: {
        format: 'Battle Royale',
        stagesCount: 2,
        matchesPerGroup: 2,
        qualifyCountPerGroup: 8,
        pointsSystem: 'BGIS-10'
      }
    });

    // Tournament 3: BGMI WOW 4v4 Clash Showdown (Paid: ₹50 + ₹2 Platform fee, 4v4 TDM/WOW)
    await Tournament.create({
      title: 'BGMI WOW 4v4 Masters League',
      slug: 'bgmi-wow-4v4-masters-league',
      game: 'BGMI',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BGMIWOW4v4',
      description: 'Head-to-head 4v4 tactical arena battle in BGMI World of Wonder custom maps. Single elimination bracket with Best-of-3 series.',
      organizer: organizer1._id,
      tournamentType: 'Online',
      tournamentFormat: 'knockout_bracket',
      matchType: '4v4',
      seriesLength: 3,
      platform: 'Mobile',
      location: 'Custom Room',
      country: 'India',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      registrationDeadline: nextWeek,
      teamSize: { min: 4, max: 5 },
      maxTeams: 16,
      prizePool: '₹25,000',
      isPaid: true,
      entryFee: 50,
      platformFee: 2,
      rules: 'Best of 3 matches. First team to 40 kills in TDM / WOW arena claims the round.',
      status: 'published'
    });

    console.log('[SEED] Clean initialization complete! No fake demo teams seeded.');
  } catch (error) {
    console.error('[SEED ERROR]', error.message);
  }
};

module.exports = seedData;
