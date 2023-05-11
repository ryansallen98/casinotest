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
const https = require('https');
const fs = require("fs");

const app = express();

const uri = 'https://sandbox.icorepay.io/v1?';

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

app.use(express.static(path.join(__dirname, '../Frontend')));

// Connect to databases
const usersDB = new Datastore({ filename: './database/users.db', autoload: true });
const invoiceDB = new Datastore({ filename: './database/invoice.db', autoload: true });
const paidDB = new Datastore({ filename: './database/paid.db', autoload: true });
const balanceHistoryDB = new Datastore({ filename: './database/balanceHistory.db', autoload: true });

// API endpoint to handle user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    usersDB.findOne({ username, password }, (err, user) => {
        if (err) {
            res.status(500).json({ error: 'Server error' });
        } else if (!user) {
            res.status(401).json({ error: 'Invalid username or password' });
        } else {
            const token = jwt.sign({ userId: user._id, username }, 'secret-key');
            res.json({ token });
        }
    });
});

// API endpoint to handle user sign-up
app.post('/signup', (req, res) => {
    const user = req.body;
    user.mainBalance = 0;
    user.bonusBalance = 0;

    if (user.username && user.password) {
        usersDB.findOne({ username: user.username }, (err, data) => {
            if (err) {
                res.status(500).json({ error: 'Server error' });
            } else if (data) {
                res.status(400).json({ error: 'Username already exists' });
            } else {
                usersDB.insert(user, (err, user) => {
                    if (err) {
                        res.status(500).json({ error: 'Server error' });
                    } else {
                        const token = jwt.sign({ userId: user._id, username: user.username }, 'secret-key');
                        res.json({ token });
                    }
                });
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid username or password' });
    }
});

// API endpoint to handle protected routes
app.get('/api/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    jwt.verify(token, 'secret-key', (err, decoded) => {
        if (err) {
            res.status(401).json({ error: 'Invalid token' });
        } else {
            usersDB.findOne({ _id: decoded.userId }, (err, user) => {
                if (err) {
                    res.status(500).json({ error: 'Server error' });
                } else if (!user) {
                    res.status(404).json({ error: 'User not found' });
                } else {
                    balanceHistoryDB.find({ user: user.username }, (err, balanceHistory) => {
                        if (err) {
                            res.status(500).json({ error: 'Server error' });
                            res.json({ user });
                        } else {
                            invoiceDB.find({ user: user.username }, (err, invoices) => {
                                if (err) {
                                    res.status(500).json({ error: 'Server error' });
                                    res.json({ user, balanceHistory });
                                } else {
                                    res.json({ user, balanceHistory, invoices });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

// API endpoint to handle deposit requests
app.post('/deposit', async (req, res) => {
    console.log(req.body.data);
    const code = Math.random().toString(36).substring(7);
    const invoiceId = Math.random().toString(36).substring(7);

    const params = {
        merchant_name: 'iCore Pay',
        invoice: invoiceId,
        order_key: code,
        merchant_addr: req.body.data.token,
        amount: req.body.data.amount,
        success_url: 'https://casino.icorepay.io/?success=' + req.body.data.amount,
        cancel_url: 'https://casino.icorepay.io/?error=error',
        ipn_url: 'https://casino.icorepay.io/ipn',
        return_json: true,
    };

    // create the invoice URI by appending the params to the base URI
    // encode the key-value pairs of the params object as query parameters
    const queryParams = Object.keys(params)
        .map((key) => {
            if (Array.isArray(params[key])) {
                return `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
            }
            return `${key}=${encodeURIComponent(params[key])}`;
        })
        .join('&');
    // append the query parameters to the URI
    const getUrl = `${uri}${queryParams}`;
    console.log(getUrl)
    usersDB.update(
        { username: req.body.data.user },
        {
            $inc: {
                mainBalance: parseFloat(req.body.data.amount),
                bonusBalance: 0,
            },
        },
        { returnUpdatedDocs: true },
        (err, numReplaced, updatedDoc) => {
            if (err) {
                console.log(err);
                return;
            } else {
                const timestamp = new Date();
                req.body.data.timestamp = timestamp;
                req.body.data.newAmount = updatedDoc.mainBalance;
                balanceHistoryDB.insert(req.body.data);
                console.log(`${numReplaced} document(s) updated`);
            }
        }
    );



    try {
        const response = await axios.get(getUrl);
        response.data.user = req.body.data.user;
        invoiceDB.insert(response.data);
        let payURL = response.data.paymentUrl;
        console.log(response.data, response.data.callback.ipn_body)

        res.json({ payURL });
    } catch (error) {
        console.log(error.code);
    }
});

// API endpoint to handle deposit requests
app.post('/deposit-bonus', async (req, res) => {
    console.log(req.body.data);
    const code = Math.random().toString(36).substring(7);
    const invoiceId = Math.random().toString(36).substring(7);
    const buxDecimals = 4;
    const badgerFixedFee = 0.5;
    const badgerVarFee = 0.06;
    const amountWithoutBadgerFees = (req.body.data.amount - badgerFixedFee) / (1 + badgerVarFee);
    const netAmountForDollar = +calculateNet(amountWithoutBadgerFees, decodedChain, buxDecimals).toFixed(4);
    console.log(amountWithoutBadgerFees, netAmountForDollar);

    const params = {
        merchant_name: 'iCore Pay',
        invoice: invoiceId,
        order_key: code,
        merchant_addr: req.body.data.token,
        amount: 1,
        success_url: 'https://casino.icorepay.io/?successbonus1',
        cancel_url: 'https://casino.icorepay.io/?error=error',
        ipn_url: 'https://casino.icorepay.io/ipn',
        return_json: true,
    };

    // create the invoice URI by appending the params to the base URI
    // encode the key-value pairs of the params object as query parameters
    const queryParams = Object.keys(params)
        .map((key) => {
            if (Array.isArray(params[key])) {
                return `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
            }
            return `${key}=${encodeURIComponent(params[key])}`;
        })
        .join('&');
    // append the query parameters to the URI
    const getUrl = `${uri}${queryParams}`;
    console.log(getUrl)
    usersDB.update(
        { username: req.body.data.user },
        {
            $inc: {
                mainBalance: parseFloat(req.body.data.amount),
                bonusBalance: 500,
            },
        },
        { returnUpdatedDocs: true },
        (err, numReplaced, updatedDoc) => {
            if (err) {
                console.log(err);
                return;
            } else {
                const timestamp = new Date();
                req.body.data.timestamp = timestamp;
                req.body.data.newAmount = updatedDoc.mainBalance;
                balanceHistoryDB.insert(req.body.data);
                console.log(`${numReplaced} document(s) updated`);
            }
        }
    );

    try {
        const response = await axios.get(getUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        response.data.user = req.body.data.user;
        invoiceDB.insert(response.data);
        let payURL = response.data.paymentUrl;
        console.log(response.data)

        res.json({ payURL });
    } catch (error) {
        console.log(error.code);
    }
});

app.post('/reset', async (req, res) => {
    console.log(req.body.data);
    const mainBalanceBeforeReset = [];
    usersDB.find({ username: req.body.data.user }, (err, docs) => {
        if (err) {
            console.log(err);
            return;
        } else {
            mainBalanceBeforeReset.push(docs[0].mainBalance);
        }
    });
    usersDB.update(
        { username: req.body.data.user },
        {
            $set: {
                mainBalance: 0,
                bonusBalance: 0,
            },
        },
        { returnUpdatedDocs: true },
        (err, numReplaced, updatedDoc) => {
            if (err) {
                console.log(err);
                return;
            } else {
                console.log(numReplaced, updatedDoc, mainBalanceBeforeReset[0])
                const timestamp = new Date();
                req.body.data.timestamp = timestamp;
                req.body.data.newAmount = updatedDoc.mainBalance;
                req.body.data.amount = mainBalanceBeforeReset[0];
                balanceHistoryDB.insert(req.body.data);
                console.log(`${numReplaced} document(s) updated`);
            }
        }
    );
    res.json('Reset');
});


// API endpoint to handle deposit requests
app.post('/signup-bonus', async (req, res) => {
    let isTrue = 0
    allowIps.map(ip => {
        if (ip === ipAddress) {
            isTrue++
        }
    })
    if (isTrue === 0) {
        console.log('error wrong IP Address')
    } else {
        const ipn = req.body;
        console.log(ipn)
        const url = `https://ecash.badger.cash:8332/tx/${ipn.txn_id}?slp=true`;
        const result = await axios.get(url);
        const txData = result.data;
        const outputs = txData.outputs;
        const buxTokenId = "7e7dacd72dcdb14e00a03dd3aff47f019ed51a6f1f4e4f532ae50692f62bc4e5";
        const buxDecimals = 4;
        const isBuxTransaction = txData.slpToken.tokenId === buxTokenId;
        let recipientArray = [];
        if (isBuxTransaction) {
            for (let i = 1; i < outputs.length; i++) {
                const isSlpOutput = outputs[i].slp;
                if (isSlpOutput) {
                    const buxAmount = +(outputs[i].slp.value) / 10 ** buxDecimals;
                    recipientArray.push({
                        address: convertAddress(outputs[i].address, "etoken"),
                        buxAmount: buxAmount
                    });
                }
            }
        }

        // function returns address with desired prefix
        function convertAddress(address, targetPrefix) {
            const { prefix, type, hash } = ecashaddr.decode(address);
            if (prefix === targetPrefix) {
                return address;
            } else {
                const convertedAddress = ecashaddr.encode(targetPrefix, type, hash);
                return convertedAddress;
            }
        };

        ipn.recipientArray = recipientArray;
        ipn.ipAddress = ipAddress;
        // validate that transaction settles new order
        invoiceDB.find({ invoice: req.body.invoice, custom: req.body.custom }, function (err, docs) {
            if (err) {
                // Error message if the paymentID doesn't match
                console.log("Error fetching data from the database: ", err);
            } else {
                paidDB.insert(ipn)
            }
        });

        // Send a response
        res.send("OK");
    }
})


async function postIpn(req, res) {
    const ipAddress = req.connection.remoteAddress;
    console.log(ipAddress);
    const ipn = req.body;
    console.log(ipn)
    invoiceDB.update(
        { invoice: req.body.payment_id }, { $set: { status: 'paid' } }, { upsert: false }, (err, numReplaced) => {
            if (err) {
                console.log(err);
                return;
            } else {
                console.log(`Updated ${req.body.payment_id}`);
            }
        });
    res.send("OK");
}

app.post("/ipn", postIpn);


app.post('/editprofile', (req, res) => {
    console.log(req.body);
    usersDB.update({ username: req.body.user }, { $set: { etoken: req.body.etoken, firstname: req.body.firstName, lastname: req.body.lastName } }, { upsert: false }, (err, numReplaced) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log(`Updated ${req.body.user}`);
            res.json({ message: "Your account was successfully updated!" });
        }
    });
});


/*
// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});*/

// Start the HTTPS server
server.listen(443, () => {
    console.log('HTTPS server running on port 443');
});
