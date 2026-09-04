const { Booking } = require('../models');
const { broadcastQueueUpdate } = require('../services/queue.socket');

// Helper to construct the current live queue snapshot for a centre
const fetchLiveQueueSnapshot = async (centreId) => {
  const [currentlyServing, waitingList] = await Promise.all([
    Booking.findOne({ centreId, status: 'Serving' })
      .populate('farmerId', 'name mobile village')
      .populate('slotId', 'startTime endTime')
      .sort({ updatedAt: -1 }),
    Booking.find({ centreId, status: 'CheckedIn' })
      .populate('farmerId', 'name village')
      .populate('slotId', 'startTime endTime')
      .sort({ queuePosition: 1 }),
  ]);

  return {
    centreId,
    timestamp: new Date().toISOString(),
    currentlyServing: currentlyServing
      ? {
          bookingId: currentlyServing._id,
          tokenNumber: currentlyServing.tokenNumber,
          farmerName: currentlyServing.farmerId?.name || 'Farmer',
          village: currentlyServing.farmerId?.village,
          queuePosition: currentlyServing.queuePosition,
          status: currentlyServing.status,
        }
      : null,
    totalWaiting: waitingList.length,
    waitingList: waitingList.map((b) => ({
      bookingId: b._id,
      tokenNumber: b.tokenNumber,
      farmerName: b.farmerId?.name || 'Farmer',
      queuePosition: b.queuePosition,
      status: b.status,
    })),
  };
};

// POST /api/queue/checkin (Staff checks in farmer)
exports.checkinFarmer = async (req, res) => {
  try {
    const { bookingId, tokenNumber } = req.body;

    if (!bookingId && !tokenNumber) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide either bookingId or tokenNumber',
      });
    }

    const query = bookingId ? { _id: bookingId } : { tokenNumber: tokenNumber.trim().toUpperCase() };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'Booked') {
      return res.status(400).json({
        error: 'Invalid Action',
        message: `Booking cannot be checked in. Current status: '${booking.status}'`,
      });
    }

    // Strict scoping: If user is staff, verify booking belongs to their assigned centre
    if (req.user?.role === 'staff' && req.user?.centreId) {
      if (booking.centreId.toString() !== req.user.centreId.toString()) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied: You can only check in farmers arriving at your assigned mandi centre.',
        });
      }
    }

    // Determine next sequential queue position for this centre
    const lastQueueItem = await Booking.findOne({
      centreId: booking.centreId,
      status: { $in: ['CheckedIn', 'Serving'] },
    }).sort({ queuePosition: -1 });

    const nextPosition = (lastQueueItem?.queuePosition || 0) + 1;

    booking.status = 'CheckedIn';
    booking.queuePosition = nextPosition;
    await booking.save();

    // Broadcast updated queue state via Socket.io
    const snapshot = await fetchLiveQueueSnapshot(booking.centreId);
    broadcastQueueUpdate(booking.centreId, snapshot);

    return res.status(200).json({
      success: true,
      message: 'Farmer checked in successfully',
      booking: {
        id: booking._id,
        tokenNumber: booking.tokenNumber,
        status: booking.status,
        queuePosition: booking.queuePosition,
      },
      queueSnapshot: snapshot,
    });
  } catch (error) {
    console.error('Checkin error:', error);
    return res.status(500).json({
      error: 'Checkin Failed',
      message: error.message,
    });
  }
};

// POST /api/queue/call-next (Staff calls the next checked-in farmer)
exports.callNext = async (req, res) => {
  try {
    let { centreId } = req.body;

    // Strict scoping: If user is staff, enforce their assigned centre
    if (req.user?.role === 'staff' && req.user?.centreId) {
      centreId = req.user.centreId.toString();
    }

    if (!centreId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'centreId is required to call next farmer',
      });
    }

    // Find the earliest checked-in booking
    const nextBooking = await Booking.findOne({
      centreId,
      status: 'CheckedIn',
    })
      .sort({ queuePosition: 1, createdAt: 1 })
      .populate('farmerId', 'name mobile village');

    if (!nextBooking) {
      return res.status(200).json({
        success: false,
        message: 'No farmers currently waiting in the queue for this centre',
      });
    }

    nextBooking.status = 'Serving';
    await nextBooking.save();

    // Broadcast updated live queue
    const snapshot = await fetchLiveQueueSnapshot(centreId);
    broadcastQueueUpdate(centreId, snapshot);

    return res.status(200).json({
      success: true,
      message: `Farmer ${nextBooking.farmerId?.name || 'Farmer'} called to scale`,
      booking: {
        bookingId: nextBooking._id,
        tokenNumber: nextBooking.tokenNumber,
        farmerName: nextBooking.farmerId?.name,
        queuePosition: nextBooking.queuePosition,
        status: nextBooking.status,
      },
      queueSnapshot: snapshot,
    });
  } catch (error) {
    console.error('Call next error:', error);
    return res.status(500).json({
      error: 'Call Next Failed',
      message: error.message,
    });
  }
};

// GET /api/queue/live or /api/queue/:centreId/live (Public live queue endpoint)
exports.getLiveQueue = async (req, res) => {
  try {
    let centreId = req.params.centreId || req.query.centreId;

    // Strict scoping: If user is staff, enforce their assigned centre
    if (req.user?.role === 'staff' && req.user?.centreId) {
      centreId = req.user.centreId.toString();
    }

    if (!centreId || centreId === 'live') {
      centreId = req.query.centreId;
    }

    if (!centreId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'centreId is required',
      });
    }

    const snapshot = await fetchLiveQueueSnapshot(centreId);

    return res.status(200).json({
      success: true,
      data: snapshot,
      ...snapshot,
    });
  } catch (error) {
    console.error('Get live queue error:', error);
    return res.status(500).json({
      error: 'Failed to fetch live queue',
      message: error.message,
    });
  }
};
