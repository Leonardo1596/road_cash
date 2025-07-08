const CostPerKm = require('../models/CostPerKmSchema');
const PersonalEntry = require('../models/PersonalEntriesSchema');

const getPersonalMaintenanceExpense = async (req, res) => {
    try {
        const { userId, from, to } = req.query;

        if (!userId || !from || !to) {
            return res.status(400).json({ error: 'userId, from e to são obrigatórios' });
        }

        const personalEntries = await PersonalEntry.find({
            userId,
            date: { $gte: from, $lte: to }
        });

        const totalDistance = personalEntries.reduce((sum, entry) => sum + (entry.distance || 0), 0);
        const totalGasoline = personalEntries.reduce((sum, entry) => sum + (entry.gasolineExpense || 0), 0);

        const costData = await CostPerKm.findOne({ userId });

        if (!costData) {
            return res.status(404).json({ error: 'CostPerKm não encontrado para o usuário' });
        }

        const items = ['oleo', 'relacao', 'pneuDianteiro', 'pneuTraseiro', 'gasolina'];

        let totalCostPerKm = 0;

        items.forEach(item => {
            const value = costData[item].value;
            const km = costData[item].km;

            if (value && km && km > 0) {
                totalCostPerKm += value / km;
            }
        });

        totalCostPerKm = Number(totalCostPerKm.toFixed(4));

        const calculateItemExpense = (item) => {
            const { value, km } = costData[item];
            if (!value || !km || km === 0) return 0;
            return Number(((value / km) * totalDistance).toFixed(2));
        };

        const maintenanceBreakdown = {
            oleo: calculateItemExpense('oleo'),
            relacao: calculateItemExpense('relacao'),
            pneuDianteiro: calculateItemExpense('pneuDianteiro'),
            pneuTraseiro: calculateItemExpense('pneuTraseiro'),
            gasolina: totalGasoline,
            totalDistance
        };

        res.json(maintenanceBreakdown);

    } catch (error) {
        console.error('Erro ao obter lançamentos para manutenção:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
}

module.exports = {
    getPersonalMaintenanceExpense
};