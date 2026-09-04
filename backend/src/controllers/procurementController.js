const mongoose = require('mongoose');
const {
  Booking,
  Procurement,
  Payment,
  ProcurementCentre,
  Farmer,
} = require('../models');
const {
  sendCropProcuredEmail,
  sendPaymentCompletedEmail,
} = require('../services/email.service');

// POST /api/procurement (Staff records crop weighing, moisture, grade & generates payment)
exports.createProcurement = async (req, res) => {
  try {
    const { bookingId, cropType, quantityKg, moisturePercent, qualityGrade } = req.body;

    if (!bookingId || !cropType || !quantityKg || moisturePercent === undefined || !qualityGrade) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'bookingId, cropType, quantityKg, moisturePercent, and qualityGrade are required',
      });
    }

    const booking = await Booking.findById(bookingId).populate('centreId').populate('farmerId');
    if (!booking) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Referenced booking not found',
      });
    }

    if (booking.status === 'Procured') {
      return res.status(400).json({
        error: 'Already Procured',
        message: 'This booking has already been procured and recorded',
      });
    }

    const centre = booking.centreId;
    let rate = centre.ratePerKg ? centre.ratePerKg.get(cropType) : null;

    // Fallback if rate not in map
    if (!rate || isNaN(rate)) {
      rate = req.body.ratePerKg || 22.5; // Standard fallback rate
    }

    const qty = Number(quantityKg);
    const totalAmount = Math.round(qty * rate * 100) / 100;

    const procurement = new Procurement({
      bookingId: booking._id,
      farmerId: booking.farmerId._id,
      cropType,
      quantityKg: qty,
      moisturePercent: Number(moisturePercent),
      qualityGrade: qualityGrade.toUpperCase(),
      ratePerKg: rate,
      totalAmount,
    });

    await procurement.save();

    // Mark Booking as Procured
    booking.status = 'Procured';
    await booking.save();

    // Create corresponding Payment in Pending status
    const payment = new Payment({
      procurementId: procurement._id,
      farmerId: booking.farmerId._id,
      amount: totalAmount,
      status: 'Pending',
    });

    await payment.save();

    // Fire Email Notification 2 (Crop Procured)
    if (booking.farmerId?.email) {
      sendCropProcuredEmail({
        to: booking.farmerId.email,
        farmerName: booking.farmerId.name,
        cropType,
        quantityKg: qty,
        qualityGrade: qualityGrade.toUpperCase(),
        ratePerKg: rate,
        totalAmount,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Procurement recorded successfully and payment initiated',
      procurement,
      payment,
    });
  } catch (error) {
    console.error('Procurement error:', error);
    return res.status(500).json({
      error: 'Procurement Failed',
      message: error.message,
    });
  }
};

// PATCH /api/payments/mark-paid (Staff or Admin records manual bank disbursement)
exports.markPaymentPaid = async (req, res) => {
  try {
    const { paymentId, bankReferenceNumber } = req.body;

    if (!paymentId || !bankReferenceNumber) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'paymentId and bankReferenceNumber are required',
      });
    }

    const cleanId = String(paymentId).trim();
    let payment = null;

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      // 1. Direct Payment _id lookup
      payment = await Payment.findById(cleanId).populate('farmerId');

      // 2. Lookup by Procurement / Voucher ID
      if (!payment) {
        payment = await Payment.findOne({ procurementId: cleanId }).populate('farmerId');
      }

      // 3. Lookup by Booking ID
      if (!payment) {
        const procurement = await Procurement.findOne({ bookingId: cleanId });
        if (procurement) {
          payment = await Payment.findOne({ procurementId: procurement._id }).populate('farmerId');
        }
      }
    }

    if (!payment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Payment record not found for the provided Voucher / Payment ID',
      });
    }

    if (payment.status === 'Paid') {
      return res.status(400).json({
        error: 'Already Paid',
        message: `Payment has already been marked as Paid with reference ${payment.bankReferenceNumber}`,
      });
    }

    payment.status = 'Paid';
    payment.bankReferenceNumber = bankReferenceNumber.trim();
    payment.paidAt = new Date();
    await payment.save();

    // Fire Email Notification 3 (Payment Disbursed)
    if (payment.farmerId?.email) {
      sendPaymentCompletedEmail({
        to: payment.farmerId.email,
        farmerName: payment.farmerId.name,
        amount: payment.amount,
        bankReferenceNumber: payment.bankReferenceNumber,
        paidAt: payment.paidAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment marked as Paid successfully',
      payment,
    });
  } catch (error) {
    console.error('Mark payment paid error:', error);
    return res.status(500).json({
      error: 'Failed to update payment',
      message: error.message,
    });
  }
};

// GET /api/payments/my (Farmer views their payment ledgers)
exports.getMyPayments = async (req, res) => {
  try {
    const farmerId = req.user.userId;

    const payments = await Payment.find({ farmerId })
      .populate('procurementId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    return res.status(500).json({
      error: 'Failed to fetch payments',
      message: error.message,
    });
  }
};

// GET /api/bookings/today?centreId (Staff views today's scheduled arrivals)
exports.getTodayBookings = async (req, res) => {
  try {
    const { centreId } = req.query;

    if (!centreId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'centreId query param is required',
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      centreId,
      $or: [
        { status: { $in: ['CheckedIn', 'Serving'] } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ],
    })
      .populate('farmerId', 'name mobile village bankAccount')
      .populate('slotId', 'startTime endTime')
      .sort({ queuePosition: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Get today bookings error:', error);
    return res.status(500).json({
      error: 'Failed to fetch today bookings',
      message: error.message,
    });
  }
};
