// ABOUTME: Utility functions for URL handling and decoding
// ABOUTME: Provides functions to decode HTML-encoded URLs from database

const he = require('he');

/**
 * Decode HTML entities in URLs
 * 
 * @param {string} url - URL that may contain HTML entities
 * @returns {string} Decoded URL
 */
const decodeUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  return he.decode(url);
};

/**
 * Check if value is a MongoDB ObjectId
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if value is ObjectId
 */
const isObjectId = (value) => {
  return value && 
         typeof value === 'object' && 
         value.constructor && 
         value.constructor.name === 'ObjectId';
};

/**
 * Recursively decode all URL fields in an object
 * 
 * @param {*} obj - Object to process
 * @returns {*} Object with decoded URLs
 */
const decodeUrls = (obj) => {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle MongoDB ObjectId - don't process it
  if (isObjectId(obj)) {
    return obj;
  }
  
  // Handle strings
  if (typeof obj === 'string') {
    return obj;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => decodeUrls(item));
  }
  
  // Handle plain objects
  if (typeof obj === 'object') {
    const decoded = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip if value is undefined
      if (value === undefined) {
        continue;
      }
      
      // Skip ObjectIds
      if (isObjectId(value)) {
        decoded[key] = value;
        continue;
      }
      
      const lowerKey = key.toLowerCase();
      
      // Decode URL fields
      if ((lowerKey.includes('url') || 
           lowerKey.includes('image') || 
           lowerKey === 'thumbnail' || 
           lowerKey === 'coverimage') && 
          typeof value === 'string') {
        decoded[key] = decodeUrl(value);
      } else {
        decoded[key] = decodeUrls(value);
      }
    }
    return decoded;
  }
  
  return obj;
};

module.exports = {
  decodeUrl,
  decodeUrls
};
