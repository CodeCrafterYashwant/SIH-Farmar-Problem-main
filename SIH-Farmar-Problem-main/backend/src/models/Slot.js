const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: [true, 'Procurement centre reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Slot date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    maxCapacity: {
      type: Number,
      required: [true, 'Max capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      default: 10,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: [0, 'Booked count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find slots for a centre on a given date
slotSchema.index({ centreId: 1, date: 1 });

module.exports = mongoose.model('Slot', slotSchema);
