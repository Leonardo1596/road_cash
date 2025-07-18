const mongoose = require('mongoose');
const PersonalEntry = require('../models/PersonalEntriesSchema');
const CostPerKm = require('../models/CostPerKmSchema');

const createEntry = async (req, res) => {
    try {
        const {
            userId,
            date,
            distance,
        } = req.body;

        // Get cost per km
        const costData = await CostPerKm.findOne({ userId });

        if (!costData) {
            return res.status(404).json({ error: 'Custo por km não encontrado para este usuário.' });
        }

        // Calculate total cost per km
        function calcTotalCostPerKm(costData) {
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
        }
        const totalCostPerKm = calcTotalCostPerKm(costData);

        const spent = totalCostPerKm * distance;
        const gasolinePrice = costData.gasolina.value;
        const gasolineExpense = (costData.gasolina.value / costData.gasolina.km) * distance;


        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day); // mês começa em 0
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const weekDay = weekDays[dateObj.getDay()];


        const newEntry = new PersonalEntry({
            userId,
            date,
            weekDay,
            distance,
            spent,
            costPerKm: totalCostPerKm,
            gasolinePrice,
            gasolineExpense
        });
        const savedEntry = await newEntry.save();

        res.json(savedEntry);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Ocorrreu um erro ao criar o lançamento.' });
    }
};

const deleteEntry = async (req, res) => {
    try {
        const { userId, entryId } = req.params;

        const deletedEntry = await PersonalEntry.findOneAndDelete({
            userId,
            _id: entryId
        });

        return res.json({ message: 'Lançamento deletado com sucesso.' });

    } catch (error) {
        console.error('Ocorreu um erro ao deletar o lançamento: ', error);
        return res.status(500).json({ error: 'Ocorreu um erro ao deletar o lançamento' });
    }
};


const updateEntry = async (req, res) => {
    try {
        const { entryId } = req.params;

        // Buscar o lançamento original
        const entry = await PersonalEntry.findById(entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Lançamento não encontrado' });
        }

        // Extrair os campos do body (podem vir todos ou apenas alguns)
        const {
            date,
            distance,
        } = req.body;

        // Usar valores antigos se não vierem no body
        const updatedDate = date || entry.date;
        const updatedDistance = distance ?? entry.distance

        // Buscar costPerKm do usuário
        const costData = await CostPerKm.findOne({ userId: entry.userId });
        if (!costData) {
            return res.status(404).json({ error: 'Custo por km não encontrado para este usuário.' });
        }

        // Calcular custo total por km
        function calcTotalCostPerKm(costData) {
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
        }

        const totalCostPerKm = calcTotalCostPerKm(costData);

        const gasolinePrice = costData.gasolina.value;
        const gasolineExpense = (costData.gasolina.km > 0)
            ? Number(((gasolinePrice / costData.gasolina.km) * distance).toFixed(2))
            : 0;

        const spent = Number((totalCostPerKm * distance).toFixed(2));

        // Calcular o dia da semana
        const [year, month, day] = updatedDate.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const weekDay = weekDays[dateObj.getDay()];

        // Atualizar o lançamento
        const updatedEntry = await PersonalEntry.findByIdAndUpdate(
            entryId,
            {
                date: updatedDate,
                weekDay,
                distance,
                spent,
                costPerKm: totalCostPerKm,
                gasolinePrice,
                gasolineExpense,
                updatedAt: new Date()
            },
            { new: true }
        );

        res.json(updatedEntry);

    } catch (error) {
        console.error('Erro ao atualizar o lançamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar o lançamento.' });
    }
};

const getEntryByUser = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        // Montar o filtro básico com userId
        const filter = { userId };

        // Se ambos from e to forem fornecidos, adicionar filtro por data
        if (from && to) {
            filter.date = { $gte: from, $lte: to };
        }

        const entries = await PersonalEntry.find(filter);
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
        const entries = await PersonalEntry.find({
            userId,
            date: { $gte: from, $lte: to }
        });

        console.log(entries);

        // Calcular totais
        const resume = entries.reduce((acc, entry) => {
            acc.grossGain += entry.grossGain || 0;
            acc.liquidGain += entry.liquidGain || 0;
            acc.totalSpent += entry.spent || 0;
            acc.totalDistance += entry.distance || 0;
            acc.foodExpense += entry.foodExpense || 0;
            acc.otherExpense += entry.otherExpense || 0;
            acc.gasolineExpense += entry.gasolineExpense || 0;
            acc.count += 1;
            return acc;
        }, {
            grossGain: 0,
            liquidGain: 0,
            totalSpent: 0,
            totalDistance: 0,
            foodExpense: 0,
            otherExpense: 0,
            gasolineExpense: 0,
            count: 0
        });

        res.json(resume);

    } catch (error) {
        console.error('Erro ao obter resumo:', error);
        res.status(500).json({ error: 'Erro ao obter resumo do período' });
    }
};

module.exports = {
    createEntry,
    deleteEntry,
    updateEntry,
    getEntryByUser,
    getResumeByPeriod
}