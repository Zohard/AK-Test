const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Get upload middleware from app
function getUploadMiddleware(req, res, next) {
  const upload = req.app.locals.upload;
  if (!upload) {
    return res.status(500).json({ error: 'Upload middleware not configured' });
  }
  return upload;
}

// Basic images route - can be extended as needed
router.get('/test', (req, res) => {
  res.json({ message: 'Images route is working' });
});

// Upload anime image
router.post('/anime', (req, res) => {
  const upload = getUploadMiddleware(req, res);
  if (!upload) return;
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded image
    const imageUrl = `http://localhost:3001/anime/${req.file.filename}`;
    
    res.json({
      message: 'Anime image uploaded successfully',
      filename: req.file.filename,
      url: imageUrl,
      path: req.file.path,
      size: req.file.size
    });
  });
});

// Upload screenshot
router.post('/screenshots', (req, res) => {
  const upload = getUploadMiddleware(req, res);
  if (!upload) return;
  
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded screenshot
    const imageUrl = `http://localhost:3001/screenshots/${req.file.filename}`;
    
    res.json({
      message: 'Screenshot uploaded successfully',
      filename: req.file.filename,
      url: imageUrl,
      path: req.file.path,
      size: req.file.size
    });
  });
});

module.exports = router;