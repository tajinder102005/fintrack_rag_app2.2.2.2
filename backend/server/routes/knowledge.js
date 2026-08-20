const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ingestDocument } = require('../../services/ragService');

// Setup multer for memory storage (we just need the buffer to extract text)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only accept .txt files for now
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are supported currently.'));
    }
  }
});

// @route   POST /api/knowledge/upload
// @desc    Uploads a new document to the AI Coach knowledge base
// @access  Private/Admin (Currently wide open for development)
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a .txt file' });
    }

    const filename = req.file.originalname;
    const textContent = req.file.buffer.toString('utf-8');

    // Call the rag service to ingest the document
    const result = await ingestDocument(filename, textContent);

    res.json({
      message: 'Document successfully ingested',
      chunks: result.chunksIngested
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Failed to ingest document' });
  }
});

module.exports = router;
