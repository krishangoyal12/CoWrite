const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/authMiddleware');
const { generateAIResponse, predictTextCompletion } = require('../Controllers/aiController');

router.post('/generate', verifyToken, generateAIResponse);
router.post('/predict', verifyToken, predictTextCompletion);

module.exports = router;
