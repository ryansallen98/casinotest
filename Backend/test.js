const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const jwa = require('jwa');
const { decodeSubjectChain } = require('relay-jwt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;;

// Set up JSON body parsing middleware with the specified MIME types and maximum
// request body size
const jsonOptions = {
    type: ["*/json"],
    limit: "750kb",
  }
app.use(express.json(jsonOptions));

// Set up form data parsing middleware
app.use(express.urlencoded({ extended: true }));

// Use body-parser to parse incoming request data
app.use(bodyParser.urlencoded({ extended: false }));

async function newPostIPN (req, res) {
  const ipAddress = req.connection.remoteAddress;
  console.log(ipAddress, req.body, req.headers['x-forwarded-for']);
  res.send("OK");
}

app.post("/ipn", newPostIPN);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
