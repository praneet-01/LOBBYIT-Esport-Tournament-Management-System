const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Notification = require('../models/Notification');

async function seedNotifications() {
  await connectDB();
  console.log('[Seed Notifications] Connected to DB.');

  const users = await User.find({});
  if (!users.length) {
    console.log('No users found.');
    process.exit(0);
  }

  const tournament = await Tournament.findOne({ slug: 'bgis-2026-battlegrounds-india-pro' });
  const organizer = users.find(u => u.role === 'Organizer') || users[0];

  console.log(`Found ${users.length} users. Populating notifications for all users...`);

  // Clear older demo notifications
  await Notification.deleteMany({});

  for (const user of users) {
    await Notification.create([
      {
        recipient: user._id,
        sender: organizer._id,
        tournament: tournament ? tournament._id : null,
        title: '🔑 Room ID Released: Round 1 Match 2 (Miramar)',
        message: 'Room ID: 789123 | Password: bgmi2026. Join Slot #4 promptly before match starts at 18:30 IST.',
        type: 'room_credentials',
        metadata: {
          matchId: 'demo_match_2',
          matchTitle: 'Round 1 Match 2 (Miramar)',
          roomId: '789123',
          password: 'bgmi2026',
          stageName: 'Round 1 - Qualifiers',
          groupName: 'Group A (Slot 1-16)'
        },
        link: tournament ? `/tournaments/${tournament.slug}` : '/tournaments',
        isRead: false
      },
      {
        recipient: user._id,
        sender: organizer._id,
        tournament: tournament ? tournament._id : null,
        title: '🏆 Qualified for Grand Finals!',
        message: 'Congratulations! Your team Skylightz Gaming has officially qualified in Top 8. Grand Finals lobby is now open.',
        type: 'qualification',
        metadata: {
          stageName: 'Grand Finals'
        },
        link: tournament ? `/tournaments/${tournament.slug}` : '/tournaments',
        isRead: false
      },
      {
        recipient: user._id,
        sender: organizer._id,
        tournament: tournament ? tournament._id : null,
        title: '💰 Prize Pool Disbursement Processed',
        message: '₹25,000 champion payout has been disbursed via UPI to the registered captain receiving handle.',
        type: 'payout',
        metadata: {
          amount: 25000,
          rank: 1
        },
        link: tournament ? `/tournaments/${tournament.slug}` : '/tournaments',
        isRead: true
      }
    ]);
  }

  console.log(`[Seed Notifications] Successfully created realistic notifications for ${users.length} users!`);
  process.exit(0);
}

seedNotifications().catch(err => {
  console.error(err);
  process.exit(1);
});
