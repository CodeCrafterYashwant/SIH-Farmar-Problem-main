const jwt = require('jsonwebtoken');
const { Staff } = require('../models');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is missing or malformed',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'sih26032_smart_procurement_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      centreId: decoded.centreId || null,
    };

    // If staff user and centreId is missing from token, fetch from database
    if (decoded.role === 'staff' && !req.user.centreId) {
      const staffDoc = await Staff.findById(decoded.userId).select('centreId').lean();
      if (staffDoc && staffDoc.centreId) {
        req.user.centreId = staffDoc.centreId.toString();
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

module.exports = authMiddleware;
