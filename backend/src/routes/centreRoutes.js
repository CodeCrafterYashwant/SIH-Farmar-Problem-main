const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public listing of centres
router.get('/', adminController.getCentres);

// Public single centre details
router.get('/:id', adminController.getCentreById);

// Admin-only centre creation
router.post('/', authMiddleware, roleMiddleware('admin'), adminController.createCentre);

// Admin-only centre update (MSP rates & details)
router.put('/:id', authMiddleware, roleMiddleware('admin'), adminController.updateCentre);

// Admin-only centre deletion
router.delete('/:id', authMiddleware, roleMiddleware('admin'), adminController.deleteCentre);

module.exports = router;
