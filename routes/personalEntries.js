const express = require('express');
const router = express.Router();
const PersonalEntryController = require('../controllers/PersonalEntryController');

router.post('/personal-entry/create', PersonalEntryController.createEntry);
router.delete('/personal-entry/delete/:userId/:entryId', PersonalEntryController.deleteEntry);
router.put('/personal-entry/update/:userId/:entryId', PersonalEntryController.updateEntry);
router.get('/get/personal-entries/', PersonalEntryController.getEntryByUser);
router.get('/personal-entries/resume', PersonalEntryController.getResumeByPeriod);

module.exports = router;