const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true,
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
    bankAccount: {
      accountNumber: {
        type: String,
        required: [true, 'Bank account number is required'],
        trim: true,
      },
      ifsc: {
        type: String,
        required: [true, 'Bank IFSC code is required'],
        trim: true,
        uppercase: true,
      },
      accountHolder: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcrypt when modified
farmerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
farmerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Farmer', farmerSchema);
