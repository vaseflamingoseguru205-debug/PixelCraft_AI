const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String
  },
  country: {
    type: String, 
    default: 'Unknown'
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  isp: {
    type: String,
    default: 'Unknown'
  },
  lastLoginIp: {
    type: String,
    default: 'Unknown'
  },
  deviceType: {
    type: String,
    default: 'Unknown'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  toolsUsedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  loginHistory: [{
    loginAt: { type: Date, default: Date.now },
    ip: String,
    deviceType: String,
    os: String,
    browser: String,
    city: String,
    country: String,
    isp: String
  }],
  lastLogout: {
    type: Date
  },
  logoutCount: {
    type: Number,
    default: 0
  },
  totalTimeSpentSeconds: {
    type: Number,
    default: 0
  },
  toolUsageHistory: [{
    toolName: String,
    usedAt: { type: Date, default: Date.now },
    durationSeconds: Number
  }]
});

module.exports = mongoose.model('User', UserSchema);
