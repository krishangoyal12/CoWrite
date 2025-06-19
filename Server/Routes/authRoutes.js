const express = require('express')
const { signup, googleSignup, login, me, logout } = require('../Controllers/authControllers')
const verifyToken = require('../Middlewares/authMiddleware')
const router = express.Router()

router.get('/me', verifyToken, me)

router.post('/signup', signup)
router.post('/google-signup', googleSignup)
router.post('/login', login)
router.post('/logout', logout)

module.exports = router

