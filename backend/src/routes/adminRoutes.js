const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Admin and Staff reports routes
router.get('/dashboard', authMiddleware, roleMiddleware('admin'), adminController.getDashboardStats);
router.get('/reports', authMiddleware, roleMiddleware('admin', 'staff'), adminController.getReports);
router.get('/reports/procurement', authMiddleware, roleMiddleware('admin', 'staff'), adminController.getReports);

module.exports = router;
