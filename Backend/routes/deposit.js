const express = require('express');
const { calculateNet } = require('relay-jwt');

const router = express.Router();
const { usersDB, invoiceDB, balanceHistoryDB } = require('../server');

// API endpoint to handle user login
router.post('/', async (req, res) => {
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
        amount: req.body.data.amount,
        success_url: 'https://casino.demo.icorepay.io/?success=' + req.body.data.amount,
        cancel_url: 'https://casino.demo.icorepay.io/?error=error',
        ipn_url: 'https://casino.demo.icorepay.io/ipn',
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
    const getUrl = `${process.env.URI}${queryParams}`;
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

module.exports = router;