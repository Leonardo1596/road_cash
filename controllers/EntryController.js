const mongoose = require('mongoose');
const CostPerKm = require('../models/CostPerKmSchema');
const { Entry, Expense, Record } = require('../models/recordSchema'); // Importa o Entry do novo schema

// Main function
const createRecord = async (req, res) => {
    try {
        const { type } = req.body;

        if (!type || (type !== 'entry' && type !== 'expense')) {
            return res.status(400).json({ error: 'Tipo inválido. Use "entry" ou "expense".' });
        }

        if (type === 'entry') {
            return await createEntryLogic(req, res);
        }

        if (type === 'expense') {
            return await createExpenseLogic(req, res);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar registro.' });
    }
};

// Logic to create ENTRY
async function createEntryLogic(req, res) {
    const {
        userId,
        date,
        initialKm,
        finalKm,
        grossGain,
        timeWorked,
    } = req.body;

    if (!userId || !date || initialKm == null || finalKm == null || grossGain == null || timeWorked == null) {
        return res.status(400).json({ error: 'Campos obrigatórios para entry não foram preenchidos.' });
    }

    const distance = finalKm - initialKm;

    // Search for the user's cost per km
    const costData = await CostPerKm.findOne({ userId });
    if (!costData) {
        return res.status(404).json({ error: 'Custo por km não encontrado para este usuário.' });
    }

    // Function to calculate the total cost per km
    const calcTotalCostPerKm = (costData) => {
        const items = ['oleo', 'relacao', 'pneuDianteiro', 'pneuTraseiro', 'gasolina'];
        let total = 0;

        items.forEach(item => {
            const km = costData[item].km;
            const value = costData[item].value;

            if (km && km > 0) {
                total += value / km;
            }
        });

        return Number(total.toFixed(4));
    };

    const totalCostPerKm = calcTotalCostPerKm(costData);

    // Calcs
    const hourlyGain = (grossGain / timeWorked) * 60;
    const spent = totalCostPerKm * distance;
    const liquidGain = grossGain - spent;
    const hourlyLiquidGain = (liquidGain / timeWorked) * 60;
    const percentageSpent = grossGain !== 0 ? ((spent / grossGain) * 100) : 100;
    const gasolinePrice = costData.gasolina.value;
    const gasolineExpense = (costData.gasolina.value / costData.gasolina.km) * distance;

    // Find out the day of the week
    const weekDay = getWeekDay(date);

    // Create entry
    const newEntry = new Entry({
        type: 'entry',
        userId,
        date,
        weekDay,
        initialKm,
        finalKm,
        distance,
        grossGain,
        timeWorked,
        hourlyGain,
        liquidGain,
        hourlyLiquidGain,
        spent,
        percentageSpent,
        costPerKm: totalCostPerKm,
        gasolinePrice,
        gasolineExpense
    });
    console.log(newEntry);

    const savedEntry = await newEntry.save();
    return res.json(savedEntry);
}

// Logic for creating EXPENSE
async function createExpenseLogic(req, res) {
    const { userId, date, description, price, category } = req.body;

    if (!userId || !date || !description || price == null) {
        return res.status(400).json({ error: 'Campos obrigatórios para expense não foram preenchidos.' });
    }

    const weekDay = getWeekDay(date);

    const newExpense = new Expense({
        type: 'expense',
        userId,
        date,
        weekDay,
        description,
        price,
        category
    });

    const savedExpense = await newExpense.save();
    return res.json(savedExpense);
}

// Auxiliary function to get the day of the week
function getWeekDay(date) {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return weekDays[dateObj.getDay()];
}

const deleteEntry = async (req, res) => {
    try {
        const { userId, entryId } = req.params;

        const deletedEntry = await Record.findOneAndDelete({
            userId,
            _id: entryId
        });

        return res.json({ message: 'Lançamento deletado com sucesso.' });

    } catch (error) {
        console.error('Ocorreu um erro ao deletar o lançamento: ', error);
        return res.status(500).json({ error: 'Ocorreu um erro ao deletar o lançamento' });
    }
};

const updateRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await Record.findById(recordId);

        if (!record) {
            return res.status(404).json({ error: "Registro não encontrado" });
        }

        const { type } = record;
        const body = req.body;

        if (type === "expense") {
            record.date = body.date || record.date;
            record.weekDay = body.date ? getWeekDay(body.date) : record.weekDay;
            record.description = body.description ?? record.description;
            record.price = body.price ?? record.price;
            record.updatedAt = new Date();

            const updatedExpense = await record.save();
            return res.json(updatedExpense);
        }

        // If it is entry
        record.date = body.date || record.date;
        record.initialKm = body.initialKm ?? record.initialKm;
        record.finalKm = body.finalKm ?? record.finalKm;
        record.grossGain = body.grossGain ?? record.grossGain;
        record.timeWorked = body.timeWorked ?? record.timeWorked;

        const distance = record.finalKm - record.initialKm;

        const costData = await CostPerKm.findOne({ userId: record.userId });
        if (!costData) {
            return res.status(404).json({ error: 'Custo por km não encontrado para este usuário.' });
        }

        const calcTotalCostPerKm = (costData) => {
            const items = ['oleo', 'relacao', 'pneuDianteiro', 'pneuTraseiro', 'gasolina'];
            return items.reduce((total, item) => {
                const km = costData[item].km;
                const value = costData[item].value;
                return km > 0 ? total + value / km : total;
            }, 0);
        };

        const totalCostPerKm = Number(calcTotalCostPerKm(costData).toFixed(4));

        record.weekDay = getWeekDay(record.date);
        record.distance = distance;
        record.hourlyGain = Number(((record.grossGain / record.timeWorked) * 60).toFixed(2));
        record.spent = Number((totalCostPerKm * distance).toFixed(2));
        record.liquidGain = Number((record.grossGain - record.spent).toFixed(2));
        record.hourlyLiquidGain = Number(((record.liquidGain / record.timeWorked) * 60).toFixed(2));
        record.percentageSpent = record.grossGain !== 0
            ? Number(((record.spent / record.grossGain) * 100).toFixed(2))
            : 100;
        record.costPerKm = totalCostPerKm;
        record.gasolinePrice = costData.gasolina.value;
        record.gasolineExpense = (costData.gasolina.km > 0)
            ? Number(((costData.gasolina.value / costData.gasolina.km) * distance).toFixed(2))
            : 0;
        record.updatedAt = new Date();

        const updatedEntry = await record.save();
        res.json(updatedEntry);

    } catch (error) {
        console.error('Erro ao atualizar o registro:', error);
        res.status(500).json({ error: 'Erro ao atualizar o registro.' });
    }
};


const getRecordsByUser = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        // Montar o filtro básico com userId
        const filter = { userId };

        // Se ambos from e to forem fornecidos, adicionar filtro por data
        if (from && to) {
            filter.date = { $gte: from, $lte: to };
        }

        const entries = await Record.find(filter);
        res.json(entries);

    } catch (error) {
        console.error('Ocorreu um erro ao recuperar os lançamentos.', error);
        res.status(500).json({ error: 'Erro ao recuperar os lançamentos.' });
    }
};

const getResumeByPeriod = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        if (!userId || !from || !to) {
            return res.status(400).json({ error: 'userId, from e to são obrigatórios' });
        }

        // Buscar lançamentos do período
        const entries = await Entry.find({
            userId,
            date: { $gte: from, $lte: to }
        });

        // Buscar despesas do período
        const expenses = await Expense.find({
            userId,
            date: { $gte: from, $lte: to }
        });

        const records = await Record.find({
            userId,
            date: { $gte: from, $lte: to }
        });

        const totalFoodExpense = expenses.reduce((acc, item) => {
            if (item.category === 'food') {
                acc += item.price || 0;
            }
            return acc;
        }, 0);

        // Calcular totais
        const resume = records.reduce((acc, entry) => {
            acc.grossGain += entry.grossGain || 0;
            acc.liquidGain += entry.liquidGain || 0;
            acc.totalSpent += (entry.spent || 0) + (entry.price || 0);
            acc.otherExpense += entry.price || 0;
            acc.totalDistance += entry.distance || 0;
            acc.timeWorked += entry.timeWorked || 0;
            acc.maintenanceExpense += (entry.spent - entry.gasolineExpense) || 0;
            acc.gasolineExpense += entry.gasolineExpense || 0;
            acc.count += 1;
            return acc;
        }, {
            grossGain: 0,
            liquidGain: 0,
            totalSpent: 0,
            otherExpense: 0,
            totalDistance: 0,
            timeWorked: 0,
            foodExpense: totalFoodExpense,
            maintenanceExpense: 0,
            gasolineExpense: 0,
            count: 0
        });

        resume.otherExpenseMinusFood = resume.otherExpense - resume.foodExpense;

        const hour = Math.floor(resume.timeWorked / 60);
        const minute = resume.timeWorked % 60;

        resume.timeWorked = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        res.json(resume);

    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        res.status(500).json({ error: 'Erro ao obter resumo do período' });
    }
};

const getEntriesByUser = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        // Montar o filtro básico com userId
        const filter = { userId };

        // Se ambos from e to forem fornecidos, adicionar filtro por data
        if (from && to) {
            filter.date = { $gte: from, $lte: to };
        }

        const entries = await Entry.find(filter);
        res.json(entries);

    } catch (error) {
        console.error('Ocorreu um erro ao recuperar os lançamentos.', error);
        res.status(500).json({ error: 'Erro ao recuperar os lançamentos.' });
    }
};

const getExpensesByUser = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        // Montar o filtro básico com userId
        const filter = { userId };

        // Se ambos from e to forem fornecidos, adicionar filtro por data
        if (from && to) {
            filter.date = { $gte: from, $lte: to };
        }

        const entries = await Expense.find(filter);
        res.json(entries);

    } catch (error) {
        console.error('Ocorreu um erro ao recuperar os lançamentos.', error);
        res.status(500).json({ error: 'Erro ao recuperar os lançamentos.' });
    }
};

module.exports = {
    createRecord,
    deleteEntry,
    updateRecord,
    getRecordsByUser,
    getResumeByPeriod,
    getEntriesByUser,
    getExpensesByUser
}