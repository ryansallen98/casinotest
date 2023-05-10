const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { usersDB, invoiceDB, balanceHistoryDB } = require('../server');

// API endpoint to handle user login
router.post('/', (req, res) => {
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

module.exports = router;