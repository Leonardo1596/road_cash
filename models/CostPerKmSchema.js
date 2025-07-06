const mongoose = require('mongoose');

const CostPerkmSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    oleo: {
        value: { type: Number, required: true },
        km: { type: Number, required: true }
    },
    relacao: {
        value: { type: Number, required: true },
        km: { type: Number, required: true }
    },
    pneuDianteiro: {
        value: { type: Number, required: true },
        km: { type: Number, required: true }
    },
    pneuTraseiro: {
        value: { type: Number, required: true },
        km: { type: Number, required: true }
    },
    gasolina: {
        value: { type: Number, required: true },
        km: { type: Number, required: true }
    },
    updatedAt: {
        type: Date
    }
});

module.exports = mongoose.model('costPerKm', CostPerkmSchema);