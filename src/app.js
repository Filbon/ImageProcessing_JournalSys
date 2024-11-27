// src/app.js
const express = require('express');
const path = require('path');
const imageRoutes = require('./routes/imageRoutes');
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes
app.use('/api/images', imageRoutes);

// Starting the server
app.listen(port, () => {
  console.log(`Image service backend is running on http://localhost:${port}`);
});

module.exports = app;
