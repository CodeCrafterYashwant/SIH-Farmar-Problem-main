const { Booking, Slot, Farmer, ProcurementCentre, Procurement, Payment } = require('../models');
const { sendEmail } = require('../services/email.service');

// Helper to generate a unique token number
const generateTokenNumber = (date) => {
  const dateStr = new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TKN-${dateStr}-${randomSuffix}`;
};

// POST /api/bookings (Farmer books an available slot)
exports.createBooking = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'slotId is required',
      });
    }

    // Check farmer exists
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }

    // Check if farmer already has a non-cancelled booking for this slot
    const existingFarmerBooking = await Booking.findOne({
      farmerId,
      slotId,
      status: { $in: ['Booked', 'CheckedIn', 'Serving'] },
    });

    if (existingFarmerBooking) {
      return res.status(400).json({
        error: 'Duplicate Booking',
        message: 'You already have an active booking for this slot',
      });
    }

    // Atomically check capacity and increment bookedCount to prevent overbooking
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        $expr: { $lt: ['$bookedCount', '$maxCapacity'] },
      },
      {
        $inc: { bookedCount: 1 },
      },
      { new: true }
    ).populate('centreId');

    if (!slot) {
      return res.status(400).json({
        error: 'Slot Unavailable',
        message: 'The selected slot is fully booked or does not exist',
      });
    }

    // Generate unique token number
    let tokenNumber = generateTokenNumber(slot.date);
    let tokenExists = await Booking.findOne({ tokenNumber });
    while (tokenExists) {
      tokenNumber = generateTokenNumber(slot.date);
      tokenExists = await Booking.findOne({ tokenNumber });
    }

    const booking = new Booking({
      farmerId,
      slotId: slot._id,
      centreId: slot.centreId._id,
      tokenNumber,
      status: 'Booked',
    });

    await booking.save();

    // Trigger Section A6 Email Notification (Booking Confirmed -> Token number + slot details)
    const slotDateFormatted = new Date(slot.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailSubject = `Booking Confirmed - Token: ${tokenNumber}`;
    const emailBody = `Dear ${farmer.name},\n\nYour slot booking has been confirmed.\n\n` +
      `Token Number: ${tokenNumber}\n` +
      `Centre: ${slot.centreId.name} (${slot.centreId.district}, ${slot.centreId.state})\n` +
      `Date: ${slotDateFormatted}\n` +
      `Time Slot: ${slot.startTime} - ${slot.endTime}\n\n` +
      `Please arrive at least 15 minutes before your scheduled slot with your crop batch.\n\n` +
      `Regards,\nSmart Procurement Management Platform`;

    // Fire email asynchronously
    sendEmail({
      to: farmer.email,
      subject: emailSubject,
      text: emailBody,
    });

    return res.status(201).json({
      success: true,
      message: 'Slot booked successfully',
      booking: {
        id: booking._id,
        tokenNumber: booking.tokenNumber,
        status: booking.status,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        centre: {
          id: slot.centreId._id,
          name: slot.centreId.name,
          district: slot.centreId.district,
          state: slot.centreId.state,
        },
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      error: 'Booking Failed',
      message: error.message,
    });
  }
};

// GET /api/bookings/my (Farmer views their bookings)
exports.getMyBookings = async (req, res) => {
  try {
    const farmerId = req.user.userId;

    const bookings = await Booking.find({ farmerId })
      .populate('centreId', 'name code district state cropTypesHandled ratePerKg')
      .populate('slotId', 'date startTime endTime maxCapacity bookedCount')
      .sort({ createdAt: -1 })
      .lean();

    const bookingIds = bookings.map((b) => b._id);
    const procurements = await Procurement.find({ bookingId: { $in: bookingIds } }).lean();

    const procurementMap = {};
    const procurementIds = [];
    procurements.forEach((p) => {
      procurementMap[p.bookingId.toString()] = p;
      procurementIds.push(p._id);
    });

    const payments = await Payment.find({ procurementId: { $in: procurementIds } }).lean();
    const paymentMap = {};
    payments.forEach((pay) => {
      paymentMap[pay.procurementId.toString()] = pay;
    });

    const enrichedBookings = bookings.map((b) => {
      const proc = procurementMap[b._id.toString()] || null;
      let payment = null;
      if (proc) {
        payment = paymentMap[proc._id.toString()] || null;
      }
      return {
        ...b,
        procurement: proc
          ? {
              ...proc,
              payment: payment
                ? {
                    status: payment.status,
                    bankReferenceNumber: payment.bankReferenceNumber,
                    paidAt: payment.paidAt,
                    amount: payment.amount,
                  }
                : null,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedBookings.length,
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve bookings',
      message: error.message,
    });
  }
};

// DELETE /api/bookings/:id (Farmer cancels booking)
exports.cancelBooking = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Booking not found',
      });
    }

    if (booking.farmerId.toString() !== farmerId.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You are not authorized to cancel this booking',
      });
    }

    // Master spec rule: Only if status is still "Booked", decrements bookedCount
    if (booking.status !== 'Booked') {
      return res.status(400).json({
        error: 'Action Not Allowed',
        message: `Cannot cancel a booking with status '${booking.status}'. Only 'Booked' slots can be cancelled.`,
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Decrement slot bookedCount
    await Slot.findByIdAndUpdate(booking.slotId, {
      $inc: { bookedCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully and slot capacity restored',
      bookingId: booking._id,
      status: booking.status,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({
      error: 'Cancellation Failed',
      message: error.message,
    });
  }
};
