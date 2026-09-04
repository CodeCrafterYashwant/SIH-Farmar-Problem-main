const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const procurementController = require('../controllers/procurementController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// All booking routes require authentication
router.use(authMiddleware);

// Staff/Admin route: Today's bookings for a centre
router.get('/today', roleMiddleware('staff', 'admin'), procurementController.getTodayBookings);

// Farmer booking management routes
router.post('/', roleMiddleware('farmer'), bookingController.createBooking);
router.get('/my', roleMiddleware('farmer'), bookingController.getMyBookings);
router.delete('/:id', roleMiddleware('farmer'), bookingController.cancelBooking);

module.exports = router;
