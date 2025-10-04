const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 10;
      },
      message: 'Phone number must contain at least 10 digits'
    }
  },
  emailAddress: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  economicStatus: {
    type: String,
    required: [true, 'Economic status is required'],
    trim: true,
    maxlength: [50, 'Economic status cannot exceed 50 characters']
  },
  occupation: {
    type: String,
    required: [true, 'Occupation is required'],
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  childrenIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

parentSchema.index({ emailAddress: 1 }, { unique: true });
parentSchema.index({ phoneNumber: 1 });
parentSchema.index({ city: 1 });
parentSchema.index({ name: 'text' });
parentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Parent', parentSchema);
