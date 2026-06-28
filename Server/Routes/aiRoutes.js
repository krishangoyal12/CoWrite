const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/authMiddleware');
const { generateAIResponse } = require('../Controllers/aiController');

router.post('/generate', verifyToken, generateAIResponse);

module.exports = router;
