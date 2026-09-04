const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public listing of centres
router.get('/', adminController.getCentres);

// Admin-only centre creation
router.post('/', authMiddleware, roleMiddleware('admin'), adminController.createCentre);

module.exports = router;
