const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth.middleware');

// Public auth routes
router.post('/register', authController.registerFarmer);
router.post('/login', authController.loginFarmer);
router.post('/staff-login', authController.loginStaff);

// Protected user profile route
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
