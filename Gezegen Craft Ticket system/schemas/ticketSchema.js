const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userID: String,
    ticketID: String,
    assignedTo: String,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
