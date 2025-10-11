const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const parentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  economicStatus: {
    type: String,
    enum: ['Lower Income', 'Middle Income', 'Upper Income'],
    required: false
  },
  occupation: {
    type: String,
    trim: true
  },
  childrenIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

parentSchema.virtual('children', {
  ref: 'Child',
  localField: '_id',
  foreignField: 'parentId'
});

parentSchema.index({ email: 1 });
parentSchema.index({ phoneNumber: 1 });

parentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

parentSchema.pre('validate', function(next) {
  if (!this.email && !this.phoneNumber) {
    next(new Error('Either email or phone number is required'));
  } else {
    next();
  }
});

parentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

parentSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phoneNumber: this.phoneNumber,
    city: this.city,
    economicStatus: this.economicStatus,
    occupation: this.occupation,
    childrenIds: this.childrenIds,
    childrenCount: this.childrenIds.length,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

parentSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: 'parent'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

parentSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    {
      id: this._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '30d'
    }
  );
  return refreshToken;
};

module.exports = mongoose.model('Parent', parentSchema);
