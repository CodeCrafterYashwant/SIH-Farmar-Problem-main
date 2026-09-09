const {
  ProcurementCentre,
  Staff,
  Slot,
  Booking,
  Procurement,
  Payment,
  Farmer,
} = require('../models');

// POST /api/centres (Admin creates Procurement Centre)
exports.createCentre = async (req, res) => {
  try {
    const { name, code, district, state, cropTypesHandled, ratePerKg } = req.body;

    if (!name || !code || !district || !state) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, code, district, and state are required',
      });
    }

    const existingCentre = await ProcurementCentre.findOne({ code: code.toUpperCase() });
    if (existingCentre) {
      return res.status(400).json({
        error: 'Duplicate Code',
        message: `A procurement centre with code ${code.toUpperCase()} already exists`,
      });
    }

    const centre = new ProcurementCentre({
      name,
      code: code.toUpperCase(),
      district,
      state,
      cropTypesHandled: cropTypesHandled || [],
      ratePerKg: ratePerKg || {},
    });

    await centre.save();

    return res.status(201).json({
      success: true,
      message: 'Procurement centre created successfully',
      centre,
    });
  } catch (error) {
    console.error('Create centre error:', error);
    return res.status(500).json({
      error: 'Failed to create centre',
      message: error.message,
    });
  }
};

// GET /api/centres (Public / list centres)
exports.getCentres = async (req, res) => {
  try {
    const centres = await ProcurementCentre.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      count: centres.length,
      centres,
    });
  } catch (error) {
    console.error('Get centres error:', error);
    return res.status(500).json({
      error: 'Failed to fetch centres',
      message: error.message,
    });
  }
};

// PUT /api/centres/:id (Admin updates Procurement Centre details and MSP rates)
exports.updateCentre = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, district, state, cropTypesHandled, ratePerKg } = req.body;

    const centre = await ProcurementCentre.findById(id);
    if (!centre) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Procurement centre not found',
      });
    }

    if (name) centre.name = name;
    if (code) centre.code = code.toUpperCase();
    if (district) centre.district = district;
    if (state) centre.state = state;
    if (cropTypesHandled) centre.cropTypesHandled = cropTypesHandled;
    if (ratePerKg) {
      centre.ratePerKg = ratePerKg;
    }

    await centre.save();

    return res.status(200).json({
      success: true,
      message: 'Procurement centre updated successfully',
      centre,
    });
  } catch (error) {
    console.error('Update centre error:', error);
    return res.status(500).json({
      error: 'Failed to update centre',
      message: error.message,
    });
  }
};

// DELETE /api/centres/:id (Admin deletes Procurement Centre)
exports.deleteCentre = async (req, res) => {
  try {
    const { id } = req.params;

    const centre = await ProcurementCentre.findById(id);
    if (!centre) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Procurement centre not found',
      });
    }

    // Safely unassign any staff assigned to this deleted mandi centre
    await Staff.updateMany({ centreId: id }, { centreId: null });

    await ProcurementCentre.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Procurement centre '${centre.name}' deleted successfully`,
    });
  } catch (error) {
    console.error('Delete centre error:', error);
    return res.status(500).json({
      error: 'Failed to delete centre',
      message: error.message,
    });
  }
};

// POST /api/staff (Admin creates staff accounts linked to centre)
exports.createStaff = async (req, res) => {
  try {
    const { name, username, password, centreId, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, username, and password are required',
      });
    }

    // Verify centre if provided
    if (centreId) {
      const centreExists = await ProcurementCentre.findById(centreId);
      if (!centreExists) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Referenced procurement centre does not exist',
        });
      }
    }

    const existingStaff = await Staff.findOne({ username: username.toLowerCase() });
    if (existingStaff) {
      return res.status(400).json({
        error: 'Duplicate Username',
        message: `Username '${username}' is already in use`,
      });
    }

    const staff = new Staff({
      name,
      username: username.toLowerCase(),
      password,
      centreId: centreId || null,
      role: role === 'admin' ? 'admin' : 'staff',
    });

    await staff.save();

    return res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        centreId: staff.centreId,
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({
      error: 'Failed to create staff account',
      message: error.message,
    });
  }
};

// GET /api/staff (Admin views all staff accounts)
exports.getStaff = async (req, res) => {
  try {
    const staffList = await Staff.find()
      .select('-password')
      .populate('centreId', 'name code district state')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: staffList.length,
      staff: staffList,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({
      error: 'Failed to fetch staff accounts',
      message: error.message,
    });
  }
};

// DELETE /api/staff/:id (Admin deletes staff account)
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion if same user
    if (req.user && req.user._id && req.user._id.toString() === id) {
      return res.status(400).json({
        error: 'Self Deletion Denied',
        message: 'You cannot delete your own logged-in administrator account.',
      });
    }

    const staffMember = await Staff.findById(id);
    if (!staffMember) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Staff account not found',
      });
    }

    await Staff.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Staff account '${staffMember.name}' (${staffMember.username}) deleted successfully`,
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    return res.status(500).json({
      error: 'Failed to delete staff account',
      message: error.message,
    });
  }
};

// POST /api/slots (Admin creates slots, single or across date range)
exports.createSlots = async (req, res) => {
  try {
    const { centreId, date, startDate, endDate, startTime, endTime, maxCapacity, timeSlots } = req.body;

    if (!centreId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'centreId is required',
      });
    }

    const centre = await ProcurementCentre.findById(centreId);
    if (!centre) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Procurement centre not found',
      });
    }

    // Determine target dates
    const dates = [];
    if (startDate && endDate) {
      let current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (date) {
      dates.push(new Date(date));
    } else {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide either "date" or "startDate" and "endDate"',
      });
    }

    // Determine slot templates
    let slotTemplates = [];
    if (Array.isArray(timeSlots) && timeSlots.length > 0) {
      slotTemplates = timeSlots;
    } else if (startTime && endTime) {
      slotTemplates.push({
        startTime,
        endTime,
        maxCapacity: Number(maxCapacity) || 10,
      });
    } else {
      // Default daily schedule if no specific time slots provided
      slotTemplates = [
        { startTime: '09:00', endTime: '11:00', maxCapacity: Number(maxCapacity) || 10 },
        { startTime: '11:00', endTime: '13:00', maxCapacity: Number(maxCapacity) || 10 },
        { startTime: '14:00', endTime: '16:00', maxCapacity: Number(maxCapacity) || 10 },
        { startTime: '16:00', endTime: '18:00', maxCapacity: Number(maxCapacity) || 10 },
      ];
    }

    const createdSlots = [];

    for (const d of dates) {
      // Normalize date to UTC midnight
      const slotDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      for (const t of slotTemplates) {
        // Prevent duplicate slot for the same centre, date, and startTime
        const exists = await Slot.findOne({
          centreId,
          date: slotDate,
          startTime: t.startTime,
        });

        if (!exists) {
          const slot = new Slot({
            centreId,
            date: slotDate,
            startTime: t.startTime,
            endTime: t.endTime,
            maxCapacity: Number(t.maxCapacity) || 10,
            bookedCount: 0,
          });
          await slot.save();
          createdSlots.push(slot);
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: `Created ${createdSlots.length} slots across ${dates.length} date(s)`,
      count: createdSlots.length,
      slots: createdSlots,
    });
  } catch (error) {
    console.error('Create slots error:', error);
    return res.status(500).json({
      error: 'Failed to create slots',
      message: error.message,
    });
  }
};

// GET /api/slots?centreId&date (Public / Available slots excluding full slots)
exports.getSlots = async (req, res) => {
  try {
    const { centreId, date, all } = req.query;

    const query = {};

    if (centreId) {
      query.centreId = centreId;
    }

    if (date) {
      const parsedDate = new Date(date);
      const startOfDay = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Exclude full slots (bookedCount < maxCapacity) unless 'all=true' explicitly requested by admin
    if (all !== 'true') {
      query.$expr = { $lt: ['$bookedCount', '$maxCapacity'] };
    }

    const slots = await Slot.find(query)
      .populate('centreId', 'name code district')
      .sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      count: slots.length,
      slots,
    });
  } catch (error) {
    console.error('Get slots error:', error);
    return res.status(500).json({
      error: 'Failed to fetch slots',
      message: error.message,
    });
  }
};

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalCentres,
      totalStaff,
      totalFarmers,
      totalBookings,
      totalProcurements,
      totalPayments,
    ] = await Promise.all([
      ProcurementCentre.countDocuments(),
      Staff.countDocuments({ role: 'staff' }),
      Farmer.countDocuments(),
      Booking.countDocuments(),
      Procurement.countDocuments(),
      Payment.countDocuments(),
    ]);

    const pendingPayments = await Payment.countDocuments({ status: 'Pending' });
    const paidPayments = await Payment.countDocuments({ status: 'Paid' });

    // Aggregated payment totals
    const paymentSums = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    let totalDisbursed = 0;
    let totalPendingAmount = 0;
    paymentSums.forEach((p) => {
      if (p._id === 'Paid') totalDisbursed = p.totalAmount;
      if (p._id === 'Pending') totalPendingAmount = p.totalAmount;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalCentres,
        totalStaff,
        totalFarmers,
        totalBookings,
        totalProcurements,
        totalPayments,
        pendingPayments,
        paidPayments,
        totalDisbursed,
        totalPendingAmount,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve dashboard statistics',
      message: error.message,
    });
  }
};

// GET /api/admin/reports?from&to
exports.getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from && to) {
      dateFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }

    let procurements = await Procurement.find(dateFilter)
      .populate('farmerId', 'name mobile village district bankAccount')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .lean();

    // Strict scoping: If user is staff, only show records for their assigned mandi centre
    if (req.user?.role === 'staff' && req.user?.centreId) {
      const staffCentreId = req.user.centreId.toString();
      procurements = procurements.filter((p) => {
        const bCentre = p.bookingId?.centreId;
        return bCentre && bCentre.toString() === staffCentreId;
      });
    }

    // Attach payment status and UTR details
    const procurementIds = procurements.map((p) => p._id);
    const payments = await Payment.find({ procurementId: { $in: procurementIds } }).lean();
    const paymentMap = new Map();
    payments.forEach((pay) => {
      paymentMap.set(String(pay.procurementId), pay);
    });

    const procurementsWithPayment = procurements.map((p) => ({
      ...p,
      payment: paymentMap.get(String(p._id)) || null,
    }));

    return res.status(200).json({
      success: true,
      count: procurementsWithPayment.length,
      procurements: procurementsWithPayment,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      message: error.message,
    });
  }
};
