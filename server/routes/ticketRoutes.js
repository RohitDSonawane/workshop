const express = require('express');
const router = express.Router();
const { 
  registerForEvent, 
  getMyTickets, 
  getEventAttendees, 
  checkInAttendee 
} = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Viewer user routes
router.post('/register', authenticateToken, requireRole('VIEWER'), registerForEvent);
router.get('/my-tickets', authenticateToken, requireRole('VIEWER'), getMyTickets);

// Head user routes
router.get('/events/:eventId/attendees', authenticateToken, requireRole('HEAD_USER'), getEventAttendees);
router.post('/events/:eventId/checkin', authenticateToken, requireRole('HEAD_USER'), checkInAttendee);

module.exports = router;
