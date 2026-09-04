const { db } = require('../config/db');

// HEAD_USER Only: Fetch summary metrics across all events & check-ins
const getHeadAnalytics = (req, res) => {
  try {
    const totalEvents = db.events.length;
    const totalUsers = db.users.length;
    const totalRegistrations = db.tickets.length;
    const totalCheckedIn = db.tickets.filter(t => t.status === 'CHECKED_IN').length;

    const checkInRate = totalRegistrations > 0 
      ? ((totalCheckedIn / totalRegistrations) * 100).toFixed(1) + '%' 
      : '0%';

    const eventBreakdown = db.events.map(e => {
      const tickets = db.tickets.filter(t => t.eventId === e.id);
      const checkedIn = tickets.filter(t => t.status === 'CHECKED_IN').length;
      return {
        eventId: e.id,
        title: e.title,
        capacity: e.capacity,
        registeredCount: e.registeredCount,
        checkedInCount: checkedIn,
        occupancyRate: ((e.registeredCount / e.capacity) * 100).toFixed(1) + '%'
      };
    });

    res.json({
      summary: {
        totalEvents,
        totalUsers,
        totalRegistrations,
        totalCheckedIn,
        checkInRate
      },
      eventBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
};

module.exports = { getHeadAnalytics };
