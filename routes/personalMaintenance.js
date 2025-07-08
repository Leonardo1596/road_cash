const express = require('express');
const router = express.Router();
const PersonalMaintenanceController = require('../controllers/PersonalMaintenanceController');

router.get('/personal-maintenance-expense', PersonalMaintenanceController.getPersonalMaintenanceExpense);

module.exports = router;