const express = require('express');
const router = express.Router();
const CostPerKmController = require('../controllers/CostPerKmController');

router.put('/cost_per_km/update/:userId/:costPerKmId', CostPerKmController.updateCostPerKm);
router.get('/get/costPerKm/:userId', CostPerKmController.getCostPerKm);

module.exports = router;