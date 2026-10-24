const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to create & dispatch a notification
const sendNotification = async ({
  recipient,
  sender = null,
  tournament = null,
  title,
  message,
  type = 'general',
  metadata = {},
  link = ''
}) => {
  try {
    if (!recipient) return null;
    const notif = await Notification.create({
      recipient,
      sender,
      tournament,
      title,
      message,
      type,
      metadata,
      link,
      isRead: false
    });
    return notif;
  } catch (err) {
    console.error('[sendNotification error]:', err.message);
    return null;
  }
};

// Helper to broadcast a notification to multiple recipients (e.g. all qualified teams)
const broadcastNotification = async ({
  recipients = [],
  sender = null,
  tournament = null,
  title,
  message,
  type = 'general',
  metadata = {},
  link = ''
}) => {
  try {
    if (!recipients.length) return [];
    const docs = recipients.map((rId) => ({
      recipient: rId,
      sender,
      tournament,
      title,
      message,
      type,
      metadata,
      link,
      isRead: false
    }));
    const created = await Notification.insertMany(docs);
    return created;
  } catch (err) {
    console.error('[broadcastNotification error]:', err.message);
    return [];
  }
};

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('tournament', 'title game slug banner')
        .populate('sender', 'name username avatar')
        .lean(),
      Notification.countDocuments({ recipient: userId, isRead: false })
    ]);

    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (err) {
    console.error('[getMyNotifications error]:', err);
    res.status(500).json({ message: 'Failed to retrieve notifications' });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.json({ success: true, notification: notif, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  broadcastNotification
};
