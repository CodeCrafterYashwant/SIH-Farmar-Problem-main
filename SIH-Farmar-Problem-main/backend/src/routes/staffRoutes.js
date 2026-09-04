const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Admin-only staff account creation
router.post('/', authMiddleware, roleMiddleware('admin'), adminController.createStaff);

module.exports = router;
