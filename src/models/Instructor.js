const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  website: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  youtube: {
    type: String,
    trim: true
  }
}, { _id: false });

const instructorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [100, 'First name cannot exceed 100 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [100, 'Last name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  profileImage: {
    type: String,
    trim: true
  },
  expertiseAreas: {
    type: [String],
    default: [],
    validate: {
      validator: function(expertise) {
        return Array.isArray(expertise) && expertise.length <= 10;
      },
      message: 'A maximum of 10 expertise areas is allowed'
    }
  },
  yearsOfExperience: {
    type: Number,
    min: [0, 'Experience must be positive'],
    max: [100, 'Experience must be realistic'],
    default: 0
  },
  socialLinks: {
    type: socialLinksSchema,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

instructorSchema.index({ email: 1 }, { unique: true });
instructorSchema.index({ firstName: 1, lastName: 1 });
instructorSchema.index({ expertiseAreas: 1 });

instructorSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phoneNumber: this.phoneNumber,
    bio: this.bio,
    profileImage: this.profileImage,
    expertiseAreas: this.expertiseAreas,
    yearsOfExperience: this.yearsOfExperience,
    socialLinks: this.socialLinks,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Instructor', instructorSchema);
