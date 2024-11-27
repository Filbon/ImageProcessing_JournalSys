// src/routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Route to upload image
router.post('/upload', imageController.uploadImage);

// Route to retrieve an image by filename
router.get('/images/:filename', imageController.getImage);

// Route to annotate an image
router.post('/image/annotate', imageController.annotateImage);

module.exports = (upload) => router;
