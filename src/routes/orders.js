const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/', authenticate, orderController.create);
router.get('/my', authenticate, orderController.getMyOrders);

// Admin
router.get('/', authenticate, isAdmin, orderController.getAll);
router.patch('/:id/status', authenticate, isAdmin, orderController.updateStatus);

module.exports = router;
