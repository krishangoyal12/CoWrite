const Document = require('../Models/documentSchema');
const User = require('../Models/userSchema');

const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user.id },
        { collaborators: req.user.id },
        { viewers: req.user.id }
      ]
    })
      .select('title owner collaborators viewers isPublic createdAt updatedAt')
      .populate('owner', '_id name email')
      .sort({ updatedAt: -1 })
      .lean();
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
      content: req.body.content || '',
      owner: req.user.id,
    });
    await newDoc.save();
    res.status(201).json({
      message: 'Document created',
      data: newDoc,
      success: true,
    });
  } catch (error) {
    console.error(error);
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
    const isOwner = doc.owner.toString() === req.user.id;
    const isCollab = doc.collaborators.map(id => id.toString()).includes(req.user.id);
    if (!isOwner && !isCollab) {
      return res.status(403).json({ message: 'Unauthorized access: write permission required', success: false });
    }
    if (req.body.title !== undefined) doc.title = req.body.title;
    if (req.body.content !== undefined) doc.content = req.body.content;
    if (req.body.isPublic !== undefined && isOwner) doc.isPublic = req.body.isPublic; // Only owner can change public status
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
    const doc = await Document.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators", "name email")
      .populate("viewers", "name email");

    if (!doc) {
      return res.status(404).json({ message: 'Document not found', success: false });
    }

    // Handle both populated and unpopulated owner
    const ownerId = doc.owner._id ? doc.owner._id.toString() : doc.owner.toString();

    const collaboratorIds = Array.isArray(doc.collaborators)
      ? doc.collaborators.map(c => c._id ? c._id.toString() : c.toString())
      : [];

    const viewerIds = Array.isArray(doc.viewers)
      ? doc.viewers.map(v => v._id ? v._id.toString() : v.toString())
      : [];

    const isOwner = ownerId === req.user.id;
    const isEditor = collaboratorIds.includes(req.user.id);
    const isViewer = viewerIds.includes(req.user.id) || (!isOwner && !isEditor && doc.isPublic);

    if (!isOwner && !isEditor && !isViewer) {
      return res.status(403).json({ message: 'Unauthorized access', success: false });
    }

    const userRole = isOwner ? 'owner' : (isEditor ? 'editor' : 'viewer');

    res.status(200).json({
      data: doc,
      userRole,
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

const getPublicDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate("owner", "name"); // Only expose owner name for security
    if (!doc) {
      return res.status(404).json({ message: 'Document not found', success: false });
    }
    if (!doc.isPublic) {
      return res.status(403).json({ message: 'This document is not public', success: false });
    }
    // Return sanitized document
    res.status(200).json({
      data: {
        _id: doc._id,
        title: doc.title,
        content: doc.content,
        owner: doc.owner,
        updatedAt: doc.updatedAt
      },
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching public document',
      error: error.message,
      success: false,
    });
  }
};

const addCollaborator = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (doc.owner.toString() !== req.user.id)
      return res.status(403).json({ message: "Only owner can add collaborators" });

    // Accept email or userId
    let userId = req.body.userId;
    if (!userId && req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.status(404).json({ message: "User not found" });
      userId = user._id.toString();
    }
    if (!userId) return res.status(400).json({ message: "No user specified" });

    const role = req.body.role === 'viewer' ? 'viewer' : 'editor';
    if (!doc.collaborators) doc.collaborators = [];
    if (!doc.viewers) doc.viewers = [];

    if (role === 'viewer') {
      if (!doc.viewers.map(id => id.toString()).includes(userId)) {
        doc.viewers.push(userId);
      }
      doc.collaborators = doc.collaborators.filter(id => id.toString() !== userId);
    } else {
      if (!doc.collaborators.map(id => id.toString()).includes(userId)) {
        doc.collaborators.push(userId);
      }
      doc.viewers = doc.viewers.filter(id => id.toString() !== userId);
    }

    await doc.save();
    await doc.populate("collaborators", "email username name");
    await doc.populate("viewers", "email username name");
    res.json({ success: true, collaborators: doc.collaborators, viewers: doc.viewers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const leaveDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found', success: false });

    // Owner cannot "leave" — they must delete instead
    if (doc.owner.toString() === req.user.id) {
      return res.status(403).json({ message: 'You are the owner. Delete the document instead.', success: false });
    }

    // Remove the user from collaborators and viewers
    doc.collaborators = (doc.collaborators || []).filter(c => c.toString() !== req.user.id);
    doc.viewers = (doc.viewers || []).filter(v => v.toString() !== req.user.id);
    await doc.save();

    res.status(200).json({ message: 'You have left the document', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving document', error: error.message, success: false });
  }
};

const removeCollaborator = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found', success: false });

    // Only document owner can revoke access
    if (doc.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the document owner can revoke access', success: false });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'Collaborator ID is required', success: false });
    }

    // Owner cannot remove themselves as a collaborator
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Owner access cannot be revoked', success: false });
    }

    doc.collaborators = (doc.collaborators || []).filter(c => c.toString() !== userId);
    doc.viewers = (doc.viewers || []).filter(v => v.toString() !== userId);
    await doc.save();
    await doc.populate("collaborators", "email name username");
    await doc.populate("viewers", "email name username");

    res.status(200).json({
      success: true,
      message: 'Access revoked successfully',
      collaborators: doc.collaborators,
      viewers: doc.viewers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking access', error: error.message, success: false });
  }
};

module.exports = { getAllDocuments, createDocument, updateDocument, deleteDocument, getDocumentById, addCollaborator, removeCollaborator, getPublicDocument, leaveDocument };
