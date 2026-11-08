const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, chatController.chat);
router.get('/history', authenticate, chatController.getHistory);

module.exports = router;
