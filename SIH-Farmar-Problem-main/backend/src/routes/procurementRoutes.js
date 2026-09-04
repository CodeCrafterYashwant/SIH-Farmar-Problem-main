const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.use(authMiddleware);

// Staff and Admin record crop procurement
router.post('/', roleMiddleware('staff', 'admin'), procurementController.createProcurement);

module.exports = router;
