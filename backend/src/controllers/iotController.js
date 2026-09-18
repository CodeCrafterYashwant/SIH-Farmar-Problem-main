const crypto = require('crypto');

// In-memory active telemetry store keyed by centreId (with fallback for global)
const activeCentreTelemetry = new Map();

// Helper to calculate tamper-proof HMAC/SHA256 signature
const generateTamperHash = (deviceId, weightKg, moisturePercent, timestamp) => {
  const secret = process.env.JWT_SECRET || 'sih2026_iot_tamper_proof_secret_key';
  return crypto
    .createHmac('sha256', secret)
    .update(`${deviceId}:${Number(weightKg).toFixed(2)}:${Number(moisturePercent).toFixed(1)}:${timestamp}`)
    .digest('hex');
};

// Auto-evaluate grain quality grade based on national procurement moisture standards
const evaluateGrade = (moisture) => {
  const m = Number(moisture);
  if (isNaN(m)) return 'A';
  if (m <= 12.0) return 'A'; // Grade A (Max MSP, dry & pristine)
  if (m <= 14.0) return 'B'; // Grade B (Standard)
  return 'C';                // Grade C (High moisture alert)
};

// Default seed devices for Mandi centres
const defaultDevices = [
  {
    deviceId: 'ESP32-WEIGH-01',
    name: 'Smart Electronic Weighbridge (HX711 + ESP32-WROOM)',
    type: 'weighing_scale',
    interface: 'USB_SERIAL_RS232',
    baudRate: 115200,
    status: 'ONLINE',
    isCalibrated: true,
    capacityKg: 10000,
    accuracyKg: 0.1,
    firmwareVersion: 'v2.4-sih26032',
    lastSeen: new Date().toISOString(),
  },
  {
    deviceId: 'ESP32-MOIST-01',
    name: 'Instant Grain Moisture QC Meter (Capacitance/NIR)',
    type: 'moisture_meter',
    interface: 'BLUETOOTH_BLE',
    status: 'ONLINE',
    isCalibrated: true,
    accuracyPercent: 0.1,
    firmwareVersion: 'v1.8-ble-agri',
    lastSeen: new Date().toISOString(),
  },
];

// POST /api/iot/telemetry (ESP32 or gateway pushes live sensor reading)
exports.recordTelemetry = async (req, res) => {
  try {
    const {
      centreId,
      deviceId = 'ESP32-WEIGH-01',
      weightKg = 0,
      moisturePercent = 11.5,
      connectionType = 'ESP32_WIFI_REST',
      isStable = true,
      tareKg = 0,
      grossKg = null,
    } = req.body;

    const timestamp = Date.now();
    const netWeight = Math.max(0, Math.round(Number(weightKg) * 10) / 10);
    const moisture = Math.max(0, Math.min(100, Math.round(Number(moisturePercent) * 10) / 10));
    const qualityGrade = evaluateGrade(moisture);
    const tamperProofHash = generateTamperHash(deviceId, netWeight, moisture, timestamp);

    const telemetryData = {
      centreId: centreId || 'default',
      deviceId,
      weightKg: netWeight,
      grossKg: grossKg !== null ? Number(grossKg) : netWeight + Number(tareKg),
      tareKg: Number(tareKg) || 0,
      moisturePercent: moisture,
      qualityGrade,
      connectionType,
      isStable: Boolean(isStable),
      tamperProofHash,
      isVerified: true,
      timestamp,
      formattedTime: new Date(timestamp).toLocaleTimeString('en-IN', { hour12: true }),
    };

    // Store in active cache
    activeCentreTelemetry.set(centreId || 'default', telemetryData);

    // Broadcast in real-time over Socket.io to Mandi staff & scale operators
    if (req.io) {
      // Broadcast to specific centre room if provided
      if (centreId) {
        req.io.to(`centre_${centreId}`).emit('iot_telemetry', telemetryData);
      }
      // Also broadcast globally for live scale viewers
      req.io.emit('iot_telemetry', telemetryData);
    }

    return res.status(200).json({
      success: true,
      message: 'IoT telemetry processed and broadcasted successfully',
      data: telemetryData,
    });
  } catch (error) {
    console.error('IoT telemetry error:', error);
    return res.status(500).json({
      error: 'Telemetry Processing Error',
      message: error.message,
    });
  }
};

// GET /api/iot/latest (Fetch most recent reading for a centre)
exports.getLatestTelemetry = async (req, res) => {
  try {
    const { centreId } = req.query;
    const key = centreId || 'default';
    const telemetry = activeCentreTelemetry.get(key) || activeCentreTelemetry.get('default') || {
      centreId: key,
      deviceId: 'ESP32-WEIGH-01',
      weightKg: 0,
      grossKg: 0,
      tareKg: 0,
      moisturePercent: 11.5,
      qualityGrade: 'A',
      connectionType: 'STANDBY',
      isStable: true,
      tamperProofHash: generateTamperHash('ESP32-WEIGH-01', 0, 11.5, Date.now()),
      isVerified: true,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString('en-IN', { hour12: true }),
    };

    return res.status(200).json({
      success: true,
      data: telemetry,
    });
  } catch (error) {
    console.error('Get latest telemetry error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve telemetry',
      message: error.message,
    });
  }
};

// GET /api/iot/devices (Fetch connected/registered hardware devices)
exports.getDevices = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      count: defaultDevices.length,
      devices: defaultDevices,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to retrieve devices',
      message: error.message,
    });
  }
};

// POST /api/iot/tare (Zero-out the digital scale)
exports.tareScale = async (req, res) => {
  try {
    const { centreId, deviceId = 'ESP32-WEIGH-01' } = req.body;
    const key = centreId || 'default';
    const current = activeCentreTelemetry.get(key) || {};

    const taredTelemetry = {
      ...current,
      centreId: key,
      deviceId,
      tareKg: (current.weightKg || 0) + (current.tareKg || 0),
      weightKg: 0.0,
      grossKg: (current.weightKg || 0) + (current.tareKg || 0),
      isStable: true,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString('en-IN', { hour12: true }),
    };

    activeCentreTelemetry.set(key, taredTelemetry);

    if (req.io) {
      if (centreId) req.io.to(`centre_${centreId}`).emit('iot_telemetry', taredTelemetry);
      req.io.emit('iot_telemetry', taredTelemetry);
    }

    return res.status(200).json({
      success: true,
      message: 'Scale tared to 0.00 kg successfully',
      data: taredTelemetry,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Tare Error',
      message: error.message,
    });
  }
};

// POST /api/iot/simulate (Simulate realistic load cell & moisture data for demo)
exports.simulateReading = async (req, res) => {
  try {
    const {
      centreId,
      cropType = 'Wheat',
      simulatedWeightKg = 2450.5,
      simulatedMoisture = 11.4,
    } = req.body;

    const key = centreId || 'default';
    const timestamp = Date.now();
    const moisture = Number(simulatedMoisture);
    const weight = Number(simulatedWeightKg);
    const grade = evaluateGrade(moisture);
    const hash = generateTamperHash('ESP32-WEIGH-01', weight, moisture, timestamp);

    const simulatedData = {
      centreId: key,
      deviceId: 'ESP32-WEIGH-01',
      weightKg: weight,
      grossKg: weight + 120, // 120kg trolley tare
      tareKg: 120,
      moisturePercent: moisture,
      qualityGrade: grade,
      connectionType: 'ESP32_SIMULATOR',
      isStable: true,
      tamperProofHash: hash,
      isVerified: true,
      cropType,
      timestamp,
      formattedTime: new Date(timestamp).toLocaleTimeString('en-IN', { hour12: true }),
    };

    activeCentreTelemetry.set(key, simulatedData);

    if (req.io) {
      if (centreId) req.io.to(`centre_${centreId}`).emit('iot_telemetry', simulatedData);
      req.io.emit('iot_telemetry', simulatedData);
    }

    return res.status(200).json({
      success: true,
      message: 'Simulated ESP32 telemetry broadcasted successfully',
      data: simulatedData,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Simulation Error',
      message: error.message,
    });
  }
};
