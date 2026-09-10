const mongoose = require('mongoose');

const TrapLogSchema = new mongoose.Schema({
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Honeytoken',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  isp: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  method: {
    type: String
  },
  endpoint: {
    type: String
  },
  payloadSent: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TrapLog', TrapLogSchema);
