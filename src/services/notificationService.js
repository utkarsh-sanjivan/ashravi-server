const logger = require('../utils/logger');

let nodemailerModule;
let mailTransporter;
let twilioModule;
let twilioClient;

const buildConfigurationError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = 500;
  return error;
};

const getMailTransporter = () => {
  if (mailTransporter !== undefined) {
    return mailTransporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASSWORD
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    logger.warn('Email transport configuration incomplete. Email delivery disabled.');
    mailTransporter = null;
    return mailTransporter;
  }

  if (!nodemailerModule) {
    try {
      // eslint-disable-next-line global-require
      nodemailerModule = require('nodemailer');
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn('nodemailer module not installed. Email delivery disabled.');
        mailTransporter = null;
        return mailTransporter;
      }
      throw error;
    }
  }

  const port = parseInt(SMTP_PORT, 10);

  if (Number.isNaN(port)) {
    throw buildConfigurationError('SMTP_PORT must be a valid number', 'EMAIL_PORT_INVALID');
  }
  const secure = SMTP_SECURE === 'true' || port === 465;

  mailTransporter = nodemailerModule.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  });

  return mailTransporter;
};

const getTwilioClient = () => {
  if (twilioClient !== undefined) {
    return twilioClient;
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    logger.warn('Twilio configuration incomplete. SMS delivery disabled.');
    twilioClient = null;
    return twilioClient;
  }

  if (!twilioModule) {
    try {
      // eslint-disable-next-line global-require
      twilioModule = require('twilio');
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn('twilio module not installed. SMS delivery disabled.');
        twilioClient = null;
        return twilioClient;
      }
      throw error;
    }
  }

  twilioClient = twilioModule(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getMailTransporter();

  if (!transporter) {
    logger.warn('Skipping email send because transporter is not configured', { to });
    return {
      success: false,
      skipped: true,
      channel: 'email',
      reason: 'EMAIL_TRANSPORT_NOT_CONFIGURED'
    };
  }

  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  if (!from) {
    throw buildConfigurationError('SMTP_FROM_EMAIL or SMTP_USER must be configured', 'EMAIL_FROM_NOT_SET');
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    logger.info('Email OTP delivered', {
      to,
      messageId: info.messageId,
      channel: 'email'
    });

    return {
      success: true,
      skipped: false,
      channel: 'email',
      messageId: info.messageId
    };
  } catch (error) {
    logger.error('Failed to deliver email OTP', {
      to,
      channel: 'email',
      error: error.message
    });
    error.code = error.code || 'EMAIL_DELIVERY_FAILED';
    error.statusCode = error.statusCode || 502;
    throw error;
  }
};

const sendSms = async ({ to, body }) => {
  const client = getTwilioClient();

  if (!client) {
    logger.warn('Skipping SMS send because Twilio client is not configured', { to });
    return {
      success: false,
      skipped: true,
      channel: 'sms',
      reason: 'TWILIO_NOT_CONFIGURED'
    };
  }

  const from = process.env.TWILIO_FROM_NUMBER;

  if (!from) {
    throw buildConfigurationError('TWILIO_FROM_NUMBER must be configured to send SMS', 'SMS_FROM_NOT_SET');
  }

  try {
    const message = await client.messages.create({
      from,
      to,
      body
    });

    logger.info('SMS OTP delivered', {
      to,
      sid: message.sid,
      channel: 'sms'
    });

    return {
      success: true,
      skipped: false,
      channel: 'sms',
      sid: message.sid
    };
  } catch (error) {
    logger.error('Failed to deliver SMS OTP', {
      to,
      channel: 'sms',
      error: error.message
    });
    error.code = error.code || 'SMS_DELIVERY_FAILED';
    error.statusCode = error.statusCode || 502;
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendSms
};
