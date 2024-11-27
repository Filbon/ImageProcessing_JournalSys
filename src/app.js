// src/app.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const imageRoutes = require('./routes/imageRoutes');
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());

// In src/app.js
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup for file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use('/api/images', imageRoutes);

// Starting the server
app.listen(port, () => {
  console.log(`Image service backend is running on http://localhost:${port}`);
});

module.exports = app;
