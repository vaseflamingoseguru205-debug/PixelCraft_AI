const mongoose = require('mongoose');

const HoneytokenSchema = new mongoose.Schema({
  tokenValue: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Honeytoken', HoneytokenSchema);
