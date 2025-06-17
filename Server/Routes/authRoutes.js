const express = require('express')
const { signup, googleSignup, login, me } = require('../Controllers/authControllers')
const verifyToken = require('../Middlewares/authMiddleware')
const router = express.Router()

router.post('/signup', signup)
router.post('/google-signup', googleSignup)
router.post('/login', login)
router.get('/me', verifyToken, me)

module.exports = router

