const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: String,
    channelId: String,
    reason: String,
    claimedBy: String
});

module.exports = mongoose.model('Ticket', ticketSchema);
