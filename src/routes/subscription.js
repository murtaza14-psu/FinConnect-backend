const express = require('express');
const { subscribe, cancel } = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all subscription routes
router.use(auth);

// Subscribe route
router.post('/subscribe', subscribe);

// Cancel subscription route
router.post('/cancel', cancel);

module.exports = router; 