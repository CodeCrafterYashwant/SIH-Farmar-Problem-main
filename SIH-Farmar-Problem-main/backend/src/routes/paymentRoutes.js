const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

// Farmer: View personal payment records
router.get('/my', roleMiddleware('farmer'), procurementController.getMyPayments);

// Staff / Admin: Mark a pending payment as paid
router.patch('/mark-paid', roleMiddleware('staff', 'admin'), procurementController.markPaymentPaid);

module.exports = router;
