const mongoose = require('mongoose');

const ForensicLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  action: {
    type: String,
    required: true,
    default: 'Fingerprint Wipe & Anonymize'
  },
  legalConsentGranted: {
    type: Boolean,
    required: true,
    default: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ForensicLog', ForensicLogSchema);
