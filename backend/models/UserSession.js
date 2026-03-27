const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    state: { type: String, default: 'IDLE' }, // IDLE, WAITING_JD, WAITING_RESUME
    jobDescription: { type: String, default: '' },
    resumeText: { type: String, default: '' },
    selectedTool: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('UserSession', sessionSchema);
