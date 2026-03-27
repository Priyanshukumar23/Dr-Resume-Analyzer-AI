const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    chatId: { type: String, required: false }, // for telegram users
    userId: { type: String, required: false }, // if we eventually have a web user login
    score: { type: Number, required: true },
    missing_skills: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    recommended_keywords: { type: [String], default: [] },
    toolUsed: { type: String, default: 'Standard Optimizer' }
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);
