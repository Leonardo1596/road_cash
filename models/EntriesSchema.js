const mongoose = require('mongoose');

const EntriesSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    weekDay: {
        type: String,
        required: true
    },
    initialKm: {
        type: Number,
        required: true
    },
    finalKm: {
        type: Number,
        required: true
    },
    distance: {
        type: Number,
        required: true
    },
    grossGain: {
        type: Number,
        required: true
    },
    timeWorked: {
        type: Number,
        default: 0,
    },
    hourlyGain: {
        type: Number,
        default: 0,
    },
    liquidGain: {
        type: Number,
        required: true
    },
    hourlyLiquidGain: {
        type: Number,
        default: 0
    },
    spent: {
        type: Number,
        required: true
    },
    percentageSpent: {
        type: Number,
        required: true
    },
    foodExpense: {
        type: Number,
        required: true
    },
    otherExpense: {
        type: Number,
        required: true
    },
    costPerKm: {
        type: Number,
        required: true
    },
    gasolinePrice: {
        type: Number,
        required: true
    },
    gasolineExpense: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('entries', EntriesSchema);