const express = require("express");
const bodyParser = require("body-parser");
const https = require('https');
const fs = require("fs");
require('dotenv').config();
const app = express();

// Set the server port to the value specified in the PORT environment variable,
// or to 3000 if PORT is not set
const port = process.env.PORT || 80;

// Set up options for the HTTPS server
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/casino.icorepay.io/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/casino.icorepay.io/fullchain.pem')
};

// Set up the HTTPS server
const server = https.createServer(options, app);

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


async function postIpn(req, res) {
    const ipAddress = req.connection.remoteAddress;
    console.log(ipAddress);
    const ipn = req.body;
    console.log(ipn)
    res.send("OK");
}

app.post("/ipn", postIpn);

// Start the HTTPS server
server.listen(443, () => {
    console.log('HTTPS server running on port 443');
});