const express = require('express');
const path = require('path');
const imageRoutes = require('./routes/imageRoutes');
const cors = require("cors");
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const fs = require('fs');

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());

// Middleware for parsing JSON bodies
app.use(express.json());

// Configure session store for Keycloak
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Load Keycloak configuration from keycloak.json
const keycloakConfig = JSON.parse(fs.readFileSync('./keycloak.json', 'utf8'));

// Initialize Keycloak instance with session store
const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

// Middleware to protect routes with DOCTOR role
app.use('/api/images', keycloak.protect('realm:DOCTOR'), imageRoutes);

// Starting the server
app.listen(port, () => {
  console.log(`Image service backend is running on http://localhost:${port}`);
});

module.exports = app;
