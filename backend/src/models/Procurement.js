const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    quantityKg: {
      type: Number,
      required: [true, 'Quantity in kg is required'],
      min: [0.1, 'Quantity must be greater than 0'],
    },
    moisturePercent: {
      type: Number,
      required: [true, 'Moisture percentage is required'],
      min: [0, 'Moisture percentage cannot be negative'],
      max: [100, 'Moisture percentage cannot exceed 100'],
    },
    qualityGrade: {
      type: String,
      required: [true, 'Quality grade is required'],
      trim: true,
      uppercase: true,
    },
    ratePerKg: {
      type: Number,
      required: [true, 'Rate per kg is required'],
      min: [0, 'Rate cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

procurementSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Procurement', procurementSchema);
