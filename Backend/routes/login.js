const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { usersDB } = require('../server');

// API endpoint to handle user login
router.post('/', (req, res) => {
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

module.exports = router;
