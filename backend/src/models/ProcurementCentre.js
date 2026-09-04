const mongoose = require('mongoose');

const procurementCentreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Procurement centre name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Centre code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    cropTypesHandled: {
      type: [String],
      default: [],
    },
    ratePerKg: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProcurementCentre', procurementCentreSchema);
