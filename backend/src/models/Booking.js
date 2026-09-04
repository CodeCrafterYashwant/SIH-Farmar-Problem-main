const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot reference is required'],
      index: true,
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: [true, 'Procurement centre reference is required'],
      index: true,
    },
    tokenNumber: {
      type: String,
      required: [true, 'Token number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['Booked', 'CheckedIn', 'Serving', 'Procured', 'Cancelled'],
      default: 'Booked',
      index: true,
    },
    queuePosition: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries: centre queue lookup, farmer booking history
bookingSchema.index({ centreId: 1, status: 1 });
bookingSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
