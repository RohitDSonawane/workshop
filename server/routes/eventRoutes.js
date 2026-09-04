const express = require('express');
const router = express.Router();
const { 
  getEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected Head User routes
router.post('/', authenticateToken, requireRole('HEAD_USER'), createEvent);
router.put('/:id', authenticateToken, requireRole('HEAD_USER'), updateEvent);
router.delete('/:id', authenticateToken, requireRole('HEAD_USER'), deleteEvent);

module.exports = router;
