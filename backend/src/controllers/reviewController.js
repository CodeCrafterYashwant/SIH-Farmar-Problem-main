const { Review, Booking, Procurement, ProcurementCentre } = require('../models');

// Helper to recalculate and update centre rating statistics
const updateCentreRatingStats = async (centreId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { centreId: centreId } },
      {
        $group: {
          _id: '$centreId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].averageRating * 10) / 10;
      await ProcurementCentre.findByIdAndUpdate(centreId, {
        averageRating: avg,
        totalReviews: stats[0].totalReviews,
      });
      return { averageRating: avg, totalReviews: stats[0].totalReviews };
    } else {
      await ProcurementCentre.findByIdAndUpdate(centreId, {
        averageRating: 0,
        totalReviews: 0,
      });
      return { averageRating: 0, totalReviews: 0 };
    }
  } catch (err) {
    console.error('Failed to update centre rating stats:', err);
    return null;
  }
};

// POST /api/reviews (Farmer creates or updates a review for a procured booking)
exports.createOrUpdateReview = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'bookingId is required',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rating must be an integer between 1 and 5 stars',
      });
    }

    // Verify booking belongs to this farmer and has completed procurement
    const booking = await Booking.findById(bookingId)
      .populate('farmerId', 'name village')
      .populate('centreId', 'name district state');

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    if (booking.farmerId._id.toString() !== farmerId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only review your own procurement appointments',
      });
    }

    if (booking.status !== 'Procured') {
      return res.status(400).json({
        error: 'Invalid Action',
        message: 'Only weighed and procured bookings can be rated and reviewed',
      });
    }

    const procurement = await Procurement.findOne({ bookingId: booking._id });
    const centreId = booking.centreId._id || booking.centreId;

    const reviewData = {
      centreId,
      farmerId,
      bookingId: booking._id,
      procurementId: procurement ? procurement._id : null,
      rating: Math.round(numRating),
      comment: (comment || '').trim(),
      farmerName: booking.farmerId?.name || 'Farmer',
      farmerVillage: booking.farmerId?.village || '',
      cropType: procurement?.cropType || '',
    };

    const review = await Review.findOneAndUpdate(
      { bookingId: booking._id },
      { $set: reviewData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Recalculate centre stats
    const stats = await updateCentreRatingStats(centreId);

    return res.status(200).json({
      success: true,
      message: 'Mandi rating and review submitted successfully',
      review,
      centreStats: stats,
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({
      error: 'Review Submission Failed',
      message: error.message,
    });
  }
};

// GET /api/reviews/my (Farmer views their submitted reviews)
exports.getMyReviews = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const reviews = await Review.find({ farmerId })
      .populate('centreId', 'name code district state')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    return res.status(500).json({
      error: 'Failed to fetch reviews',
      message: error.message,
    });
  }
};

// GET /api/reviews/centre/:centreId (Public: Get reviews for a centre)
exports.getCentreReviews = async (req, res) => {
  try {
    const { centreId } = req.params;

    const centre = await ProcurementCentre.findById(centreId);
    if (!centre) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Mandi centre not found',
      });
    }

    const reviews = await Review.find({ centreId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate rating star distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    return res.status(200).json({
      success: true,
      centre: {
        id: centre._id,
        name: centre.name,
        code: centre.code,
        district: centre.district,
        averageRating: centre.averageRating || 0,
        totalReviews: centre.totalReviews || 0,
      },
      distribution,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Get centre reviews error:', error);
    return res.status(500).json({
      error: 'Failed to fetch centre reviews',
      message: error.message,
    });
  }
};

// GET /api/reviews/admin/all (District Admin: Monitor all reviews)
exports.getAllReviewsAdmin = async (req, res) => {
  try {
    const { centreId, district } = req.query;
    let filter = {};

    if (centreId) {
      filter.centreId = centreId;
    }

    let reviews = await Review.find(filter)
      .populate('centreId', 'name code district state averageRating totalReviews')
      .populate('farmerId', 'name mobile village district')
      .sort({ createdAt: -1 })
      .limit(200);

    if (district) {
      reviews = reviews.filter(
        (r) => r.centreId?.district?.toLowerCase() === district.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    return res.status(500).json({
      error: 'Failed to fetch admin reviews',
      message: error.message,
    });
  }
};
