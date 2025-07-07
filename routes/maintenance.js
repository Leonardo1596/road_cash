const express = require('express');
const router = express.Router();
const MaintenanceController = require('../controllers/MaintenanceController');

router.get('/maintenance-expense', MaintenanceController.getMaintenanceExpense);

module.exports = router;