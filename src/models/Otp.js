const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent'
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    contactType: {
      type: String,
      enum: ['email', 'phone'],
      required: true
    },
    purpose: {
      type: String,
      enum: ['signup', 'login'],
      required: true
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

otpSchema.index({ contact: 1, purpose: 1, verified: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
