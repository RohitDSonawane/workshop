const express = require('express');
const router = express.Router();
const { getHeadAnalytics } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.get('/head-summary', authenticateToken, requireRole('HEAD_USER'), getHeadAnalytics);

module.exports = router;
