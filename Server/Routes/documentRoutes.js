const express = require('express')
const router = express.Router()
const verifyToken = require('../Middlewares/authMiddleware')
const { getAllDocuments, createDocument, updateDocument, deleteDocument, getDocumentById } = require('../Controllers/documentControllers')

router.get('/documents', verifyToken, getAllDocuments)
router.post('/documents', verifyToken, createDocument)
router.put('/documents/:id', verifyToken, updateDocument)
router.delete('/documents/:id', verifyToken, deleteDocument)
router.get('/documents/:id', verifyToken, getDocumentById)

module.exports = router