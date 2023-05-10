const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const Datastore = require('nedb');
const axios = require('axios');
const ecashaddr = require('ecashaddrjs');
const jwa = require('jwa');
const { decodeSubjectChain, calculateNet } = require('relay-jwt');
require('dotenv').config();

const app = express();

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../Frontend')));

// Middleware to parse JSON request body
app.use(bodyParser.json());

// Connect to databases
const usersDB = new Datastore({ filename: './database/users.db', autoload: true });
const invoiceDB = new Datastore({ filename: './database/invoice.db', autoload: true });
const paidDB = new Datastore({ filename: './database/paid.db', autoload: true });
const balanceHistoryDB = new Datastore({ filename: './database/balanceHistory.db', autoload: true });
module.exports = { usersDB, invoiceDB, paidDB, balanceHistoryDB };

// create jwa object
const algorithm = 'ES256';
const ecdsa = jwa(algorithm);

// decode the JWT
const token = process.env.JWT;
const decoded = jwt.decode(token);
const decodedChain = decodeSubjectChain(decoded.sub, ecdsa.verify);
console.log("decodedChain", decodedChain);

// Import route modules
const login = require('./routes/login');

// Mount routes to specific paths
app.use('/login', login);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
