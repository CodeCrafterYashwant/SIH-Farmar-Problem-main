const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public live queue status
router.get('/live', queueController.getLiveQueue);
router.get('/:centreId/live', queueController.getLiveQueue);

// Staff and Admin queue management
router.post('/checkin', authMiddleware, roleMiddleware('staff', 'admin'), queueController.checkinFarmer);
router.post('/call-next', authMiddleware, roleMiddleware('staff', 'admin'), queueController.callNext);

module.exports = router;
