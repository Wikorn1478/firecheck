const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/getUser', userController.getUser);

module.exports = router;
