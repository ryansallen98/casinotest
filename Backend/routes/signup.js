const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { usersDB } = require('../server');

// API endpoint to handle user login
router.post('/', (req, res) => {
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

module.exports = router;