const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    resumes: [String],
    coverLetters: [String],
    portfolios: [String],
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    appliedAt: { type: Date, default: Date.now }
  });

module.exports = mongoose.model('Application', ApplicationSchema);