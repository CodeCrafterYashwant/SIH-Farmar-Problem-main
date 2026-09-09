const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      required: [true, 'Procurement centre reference is required'],
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer reference is required'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      unique: true, // One review per weighment / booking
      index: true,
    },
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Procurement',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating (1-5 stars) is required'],
      min: [1, 'Minimum rating is 1 star'],
      max: [5, 'Maximum rating is 5 stars'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
    farmerName: {
      type: String,
      trim: true,
      default: 'Farmer',
    },
    farmerVillage: {
      type: String,
      trim: true,
      default: '',
    },
    cropType: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ centreId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
