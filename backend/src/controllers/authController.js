const jwt = require('jsonwebtoken');
const { Farmer, Staff } = require('../models');

const getJwtSecret = () => process.env.JWT_SECRET || 'sih26032_smart_procurement_secret_key_2026';

const generateToken = (userId, role, centreId = null) => {
  const payload = { userId, role };
  if (centreId) payload.centreId = centreId.toString();
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
  });
};

// POST /api/auth/register (Farmer Registration)
exports.registerFarmer = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      password,
      village,
      district,
      state,
      bankAccount,
    } = req.body;

    if (!name || !mobile || !email || !password || !village || !district || !state) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide all required farmer details',
      });
    }

    if (!bankAccount || !bankAccount.accountNumber || !bankAccount.ifsc || !bankAccount.accountHolder) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Complete bank account details (accountNumber, ifsc, accountHolder) are required',
      });
    }

    const existingFarmer = await Farmer.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });

    if (existingFarmer) {
      const isEmail = existingFarmer.email === email.toLowerCase();
      return res.status(400).json({
        error: 'Duplicate Account',
        message: isEmail
          ? 'A farmer with this email is already registered'
          : 'A farmer with this mobile number is already registered',
      });
    }

    const farmer = new Farmer({
      name,
      mobile,
      email,
      password,
      village,
      district,
      state,
      bankAccount,
    });

    await farmer.save();

    const token = generateToken(farmer._id, 'farmer');

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      token,
      user: {
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        mobile: farmer.mobile,
        village: farmer.village,
        district: farmer.district,
        state: farmer.state,
        bankAccount: farmer.bankAccount,
        role: 'farmer',
      },
    });
  } catch (error) {
    console.error('Farmer registration error:', error);
    return res.status(500).json({
      error: 'Registration Failed',
      message: error.message,
    });
  }
};

// POST /api/auth/login (Farmer Login)
exports.loginFarmer = async (req, res) => {
  try {
    const { identifier, email, mobile, password } = req.body;
    const loginId = identifier || email || mobile;

    if (!loginId || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide email or mobile, along with password',
      });
    }

    // Find farmer by email or mobile
    const farmer = await Farmer.findOne({
      $or: [{ email: loginId.toLowerCase() }, { mobile: loginId }],
    });

    if (farmer) {
      const isMatch = await farmer.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Authentication Failed',
          message: 'Invalid credentials',
        });
      }

      const token = generateToken(farmer._id, 'farmer');

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: farmer._id,
          name: farmer.name,
          email: farmer.email,
          mobile: farmer.mobile,
          village: farmer.village,
          district: farmer.district,
          state: farmer.state,
          bankAccount: farmer.bankAccount,
          role: 'farmer',
        },
      });
    }

    // Cross-portal check: If user entered Staff or Admin credentials in Farmer Login
    const staff = await Staff.findOne({ username: loginId.toLowerCase() }).populate('centreId');
    if (staff) {
      const isStaffMatch = await staff.comparePassword(password);
      if (isStaffMatch) {
        const targetSection = staff.role === 'admin' ? 'Admin' : 'Staff';
        return res.status(403).json({
          error: 'Incorrect Login Section',
          code: staff.role === 'admin' ? 'USE_ADMIN_SECTION' : 'USE_STAFF_SECTION',
          targetRole: staff.role,
          message: `This account belongs to ${staff.role === 'admin' ? 'Administrator' : 'Mandi Staff'}. Please login from the ${targetSection} section only.`,
        });
      }
    }

    return res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid credentials',
    });
  } catch (error) {
    console.error('Farmer login error:', error);
    return res.status(500).json({
      error: 'Login Failed',
      message: error.message,
    });
  }
};

// POST /api/auth/staff-login (Staff / Admin Login)
exports.loginStaff = async (req, res) => {
  try {
    const { username, password, expectedRole } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide username and password',
      });
    }

    const staff = await Staff.findOne({ username: username.toLowerCase() }).populate('centreId');

    if (!staff) {
      // Cross-portal check: If user entered Farmer credentials in Staff/Admin login
      const farmer = await Farmer.findOne({
        $or: [{ email: username.toLowerCase() }, { mobile: username }],
      });
      if (farmer) {
        const isFarmerMatch = await farmer.comparePassword(password);
        if (isFarmerMatch) {
          return res.status(403).json({
            error: 'Incorrect Login Section',
            code: 'USE_FARMER_SECTION',
            targetRole: 'farmer',
            message: 'This account is registered as a Farmer. Please login from the Farmer section only.',
          });
        }
      }

      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password',
      });
    }

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password',
      });
    }

    // Role check between Staff and Admin
    if (expectedRole === 'admin' && staff.role !== 'admin') {
      return res.status(403).json({
        error: 'Incorrect Login Section',
        code: 'USE_STAFF_SECTION',
        targetRole: 'staff',
        message: 'This account belongs to Mandi Staff. Please login from the Staff section only.',
      });
    }

    if (expectedRole === 'staff' && staff.role === 'admin') {
      return res.status(403).json({
        error: 'Incorrect Login Section',
        code: 'USE_ADMIN_SECTION',
        targetRole: 'admin',
        message: 'This account belongs to Administrator. Please login from the Admin section only.',
      });
    }

    const staffCentreId = staff.centreId?._id || staff.centreId;
    const token = generateToken(staff._id, staff.role, staffCentreId);

    return res.status(200).json({
      success: true,
      message: `${staff.role.charAt(0).toUpperCase() + staff.role.slice(1)} logged in successfully`,
      token,
      user: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        centreId: staff.centreId,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return res.status(500).json({
      error: 'Login Failed',
      message: error.message,
    });
  }
};

// GET /api/auth/me (Get Logged In User Profile)
exports.getMe = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === 'farmer') {
      const farmer = await Farmer.findById(userId).select('-password');
      if (!farmer) {
        return res.status(404).json({ error: 'User Not Found' });
      }
      return res.status(200).json({
        success: true,
        user: { ...farmer.toObject(), role: 'farmer' },
      });
    } else if (role === 'staff' || role === 'admin') {
      const staff = await Staff.findById(userId).select('-password').populate('centreId');
      if (!staff) {
        return res.status(404).json({ error: 'Staff Not Found' });
      }
      return res.status(200).json({
        success: true,
        user: staff,
      });
    }

    return res.status(400).json({ error: 'Unknown user role' });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve profile',
      message: error.message,
    });
  }
};
