const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public listing of available slots
router.get('/', adminController.getSlots);

// Admin-only slot creation (single or batch across dates)
router.post('/', authMiddleware, roleMiddleware('admin'), adminController.createSlots);
router.post('/generate-batch', authMiddleware, roleMiddleware('admin'), adminController.createSlots);

module.exports = router;
