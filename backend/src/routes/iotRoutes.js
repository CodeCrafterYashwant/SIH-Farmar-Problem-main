const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');

// ESP32 or serial gateway pushes live weight & moisture telemetry
router.post('/telemetry', iotController.recordTelemetry);

// Retrieve latest telemetry for a centre
router.get('/latest', iotController.getLatestTelemetry);

// Retrieve registered IoT hardware devices
router.get('/devices', iotController.getDevices);

// Tare / Zero the scale
router.post('/tare', iotController.tareScale);

// Simulator endpoint for live presentation demo
router.post('/simulate', iotController.simulateReading);

module.exports = router;
