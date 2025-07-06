const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');


router.post('/auth/sign-up', AuthController.register);
router.post('/auth/sign-in', AuthController.login);
router.put('/update/user/:userId', AuthController.updateUser);
router.get('/get/user/:userId', AuthController.getUser);

module.exports = router;