const crypto = require('crypto');
const Parent = require('../models/Parent');
const Otp = require('../models/Otp');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);

const normalizeContact = (email, phoneNumber) => {
  if (email) {
    return { contactType: 'email', contactValue: email.toLowerCase() };
  }

  if (phoneNumber) {
    return { contactType: 'phone', contactValue: phoneNumber.trim() };
  }

  const error = new Error('Either email or phone number is required');
  error.statusCode = 400;
  error.code = 'MISSING_CONTACT';
  throw error;
};

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const buildOtpResponse = (otpDoc, includeCode = false) => {
  const response = {
    otpId: otpDoc._id,
    contact: otpDoc.contact,
    contactType: otpDoc.contactType,
    purpose: otpDoc.purpose,
    expiresAt: otpDoc.expiresAt,
    expiresIn: OTP_EXPIRY_MINUTES * 60
  };

  if (includeCode) {
    response.otp = otpDoc.otp;
  }

  return response;
};

const sendOtp = async ({ email, phoneNumber, purpose }) => {
  const { contactType, contactValue } = normalizeContact(email, phoneNumber);
  const queryField = contactType === 'email' ? 'email' : 'phoneNumber';

  if (purpose === 'signup') {
    const existingParent = await Parent.findOne({ [queryField]: contactValue });
    if (existingParent) {
      const error = new Error(`Parent already exists with this ${contactType}`);
      error.statusCode = 400;
      error.code = 'PARENT_EXISTS';
      throw error;
    }
  } else {
    const parent = await Parent.findOne({ [queryField]: contactValue, isActive: true });
    if (!parent) {
      const error = new Error(`Parent not found with this ${contactType}`);
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }
  }

  await Otp.deleteMany({ contact: contactValue, purpose });

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otpDoc = await Otp.create({
    contact: contactValue,
    contactType,
    purpose,
    otp: otpCode,
    expiresAt
  });

  logger.info('OTP generated', {
    contactType,
    contactValue,
    purpose
  });

  const includeCode = process.env.NODE_ENV !== 'production';
  return {
    message: 'OTP sent successfully',
    ...buildOtpResponse(otpDoc, includeCode)
  };
};

const issueTokensForParent = async (parent) => {
  parent.lastLogin = new Date();

  const accessToken = parent.getSignedJwtToken();
  const refreshToken = parent.generateRefreshToken();

  parent.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  if (parent.refreshTokens.length > 5) {
    parent.refreshTokens = parent.refreshTokens.slice(-5);
  }

  await parent.save();

  return {
    parent: parent.getPublicProfile(),
    accessToken,
    refreshToken
  };
};

const verifyOtp = async ({ email, phoneNumber, purpose, otp }) => {
  const { contactType, contactValue } = normalizeContact(email, phoneNumber);

  const otpDoc = await Otp.findOne({ contact: contactValue, purpose }).sort({ createdAt: -1 });

  if (!otpDoc) {
    const error = new Error('OTP not found or expired');
    error.statusCode = 400;
    error.code = 'OTP_NOT_FOUND';
    throw error;
  }

  if (otpDoc.verified) {
    const error = new Error('OTP already used');
    error.statusCode = 400;
    error.code = 'OTP_ALREADY_VERIFIED';
    throw error;
  }

  if (otpDoc.expiresAt < new Date()) {
    await otpDoc.deleteOne();
    const error = new Error('OTP has expired');
    error.statusCode = 400;
    error.code = 'OTP_EXPIRED';
    throw error;
  }

  if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
    await otpDoc.deleteOne();
    const error = new Error('Maximum OTP attempts exceeded');
    error.statusCode = 429;
    error.code = 'OTP_ATTEMPTS_EXCEEDED';
    throw error;
  }

  if (otpDoc.otp !== otp) {
    otpDoc.attempts += 1;
    await otpDoc.save();

    const attemptsLeft = Math.max(OTP_MAX_ATTEMPTS - otpDoc.attempts, 0);
    const error = new Error(`Invalid OTP. ${attemptsLeft} attempts remaining`);
    error.statusCode = 400;
    error.code = 'OTP_INVALID';
    error.attemptsLeft = attemptsLeft;
    throw error;
  }

  otpDoc.verified = true;
  otpDoc.verifiedAt = new Date();
  await otpDoc.save();

  logger.info('OTP verified successfully', {
    contactType,
    contactValue,
    purpose
  });

  if (purpose === 'login') {
    const queryField = contactType === 'email' ? 'email' : 'phoneNumber';
    const parent = await Parent.findOne({ [queryField]: contactValue, isActive: true });

    if (!parent) {
      const error = new Error('Parent account not available');
      error.statusCode = 404;
      error.code = 'PARENT_NOT_FOUND';
      throw error;
    }

    const tokens = await issueTokensForParent(parent);

    return {
      message: 'OTP verified successfully',
      verified: true,
      login: true,
      ...tokens
    };
  }

  return {
    message: 'OTP verified successfully',
    verified: true,
    login: false,
    otpId: otpDoc._id,
    contact: otpDoc.contact,
    contactType: otpDoc.contactType
  };
};

module.exports = {
  sendOtp,
  verifyOtp
};
