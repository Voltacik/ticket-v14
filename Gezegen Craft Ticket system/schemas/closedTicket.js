const mongoose = require('mongoose');

const closedTicketSchema = new mongoose.Schema({
    userId: String,
    claimedBy: String,
    closeReason: String,
    solved: String,
    closedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ClosedTicket', closedTicketSchema);
