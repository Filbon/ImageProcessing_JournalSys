// src/app.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const imageRoutes = require('./routes/imageRoutes');

const app = express();
const port = 3000;

// Setup for file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use('/api/images', imageRoutes(upload));

// Starting the server
app.listen(port, () => {
  console.log(`Image service backend is running on http://localhost:${port}`);
});

module.exports = app;
