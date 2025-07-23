const express = require('express');
const router = express.Router();
const EntryController = require('../controllers/EntryController');

router.post('/entry/create', EntryController.createRecord);
router.delete('/entry/delete/:userId/:entryId', EntryController.deleteEntry);
router.put('/update/:recordId', EntryController.updateRecord);
router.get('/get/records/', EntryController.getRecordsByUser);
router.get('/records/resume', EntryController.getResumeByPeriod);

router.get('/get/entries/', EntryController.getEntriesByUser);
router.get('/get/expenses/', EntryController.getExpensesByUser);


module.exports = router;