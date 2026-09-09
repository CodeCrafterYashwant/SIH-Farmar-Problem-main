const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Public: Get reviews & rating summary for a centre
router.get('/centre/:centreId', reviewController.getCentreReviews);

// Farmer: View own reviews
router.get('/my', authMiddleware, roleMiddleware('farmer'), reviewController.getMyReviews);

// Farmer: Create or update rating & review for a procured booking
router.post('/', authMiddleware, roleMiddleware('farmer'), reviewController.createOrUpdateReview);

// District Admin: Monitor all reviews across centres
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), reviewController.getAllReviewsAdmin);

module.exports = router;
