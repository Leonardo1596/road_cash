const express = require('express');
const router = express.Router();
const EntryController = require('../controllers/EntryController');

router.post('/entry/create', EntryController.createEntry);
router.delete('/entry/delete/:userId/:entryId', EntryController.deleteEntry);
router.put('/entry/update/:userId/:entryId', EntryController.updateEntry);
router.get('/get/entries/:userId', EntryController.getEntryByUser);
router.get('/entries/resume', EntryController.getResumeByPeriod);

module.exports = router;