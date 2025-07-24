const mongoose = require('mongoose');

// Schema base comum
const BaseSchema = new mongoose.Schema({
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
    type: {
        type: String,
        required: true,
        enum: ['entry', 'expense'] // tipos possíveis
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
}, {
    discriminatorKey: 'type', // chave usada pelo Mongoose para saber o tipo
    collection: 'records'     // nome da coleção
});

// Modelo base
const Record = mongoose.model('Record', BaseSchema);

// Schema específico para ENTRIES
const EntrySchema = new mongoose.Schema({
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
        default: 0
    },
    hourlyGain: {
        type: Number,
        default: 0
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
    }
});

// Schema específico para EXPENSES
const ExpenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: { 
        type: String, 
        enum: ['alimentacao', 'manutencao', 'outro'],
        default: 'outro'
    },
});

// Criando os discriminators
const Entry = Record.discriminator('entry', EntrySchema);
const Expense = Record.discriminator('expense', ExpenseSchema);

module.exports = { Record, Entry, Expense };