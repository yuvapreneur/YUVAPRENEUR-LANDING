const express = require('express');
const { upload } = require('../middleware/upload.js');

const router = express.Router();

// PDF Upload route
router.post('/pdf', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/pdfs/${req.file.filename}`;
    res.json({ 
      success: true,
      pdfUrl: fileUrl,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

module.exports = router;
