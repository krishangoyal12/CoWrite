const Document = require('../Models/documentSchema');

const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user.id }).sort({ updatedAt: -1 });
    if (documents.length === 0) {
      return res.status(200).json({
        message: 'Nothing to show, create your first document',
        data: [],
        success: true,
      });
    }
    return res.status(200).json({
      message: 'Data fetched successfully',
      data: documents,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error in fetching data',
      error: error.message,
      success: false,
    });
  }
};

const createDocument = async (req, res) => {
  try {
    const newDoc = new Document({
      title: req.body.title || 'Untitled Document',
      content: '',
      owner: req.user.id,
    });
    await newDoc.save();
    res.status(201).json({
      message: 'Document created',
      data: newDoc,
      success: true,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error creating document',
      error: error.message,
      success: false,
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found', success: false });
    }
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access', success: false });
    }
    doc.title = req.body.title ?? doc.title;
    doc.content = req.body.content ?? doc.content;
    await doc.save();
    res.status(200).json({
      message: 'Document updated successfully',
      data: doc,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating document',
      error: error.message,
      success: false,
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found', success: false });
    }
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access', success: false });
    }
    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: 'Document deleted successfully',
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting document',
      error: error.message,
      success: false,
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found', success: false });
    }
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access', success: false });
    }
    res.status(200).json({
      data: doc,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching document',
      error: error.message,
      success: false,
    });
  }
};

module.exports = { getAllDocuments, createDocument, updateDocument, deleteDocument, getDocumentById };