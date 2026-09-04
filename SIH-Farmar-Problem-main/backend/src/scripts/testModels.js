const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  Farmer,
  Staff,
  ProcurementCentre,
  Slot,
  Booking,
  Procurement,
  Payment,
} = require('../models');

async function runModelTests() {
  console.log('='.repeat(60));
  console.log('Phase 1 Verification: Testing Mongoose Models & Schemas');
  console.log('='.repeat(60));

  let mongoServer;
  let uri = process.env.MONGODB_URI;

  try {
    // Attempt local connection; if unreachable, spin up MongoMemoryServer
    try {
      console.log('[Test Setup] Checking MongoDB connection...');
      await mongoose.connect(uri || 'mongodb://localhost:27017/sih_procurement_test', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('[Test Setup] Connected to local MongoDB instance.');
    } catch (localErr) {
      console.log('[Test Setup] Local MongoDB not running. Launching in-memory MongoDB server for verification...');
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Test Setup] In-memory MongoDB running at: ${memUri}`);
    }

    // Clean test collections before starting
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    console.log('\n[1/7] Testing Farmer Model...');
    const farmerData = {
      name: 'Ramesh Kumar',
      mobile: '9876543210',
      email: 'ramesh.farmer@example.com',
      password: 'FarmerSecurePass123',
      village: 'Kalyanpur',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      bankAccount: {
        accountNumber: '123456789012',
        ifsc: 'SBIN0001234',
        accountHolder: 'Ramesh Kumar',
      },
    };
    const farmer = new Farmer(farmerData);
    await farmer.save();
    console.log(`  ✓ Farmer created: ${farmer.name} (ID: ${farmer._id})`);

    // Verify bcrypt pre-save password hashing
    if (farmer.password === farmerData.password) {
      throw new Error('Farmer password was NOT hashed before saving!');
    }
    const isFarmerPassValid = await farmer.comparePassword('FarmerSecurePass123');
    if (!isFarmerPassValid) {
      throw new Error('Farmer comparePassword failed to match valid password!');
    }
    console.log('  ✓ Password securely hashed with bcrypt and verified.');

    console.log('\n[2/7] Testing Staff Model...');
    const staffData = {
      name: 'Sunita Sharma',
      username: 'sunita_admin',
      password: 'StaffAdminPass123',
      role: 'admin',
    };
    const staff = new Staff(staffData);
    await staff.save();
    console.log(`  ✓ Staff created: ${staff.name} (Role: ${staff.role})`);

    // Verify bcrypt password hashing on Staff
    if (staff.password === staffData.password) {
      throw new Error('Staff password was NOT hashed before saving!');
    }
    const isStaffPassValid = await staff.comparePassword('StaffAdminPass123');
    if (!isStaffPassValid) {
      throw new Error('Staff comparePassword failed to match valid password!');
    }
    console.log('  ✓ Staff password securely hashed with bcrypt and verified.');

    console.log('\n[3/7] Testing ProcurementCentre Model...');
    const centre = new ProcurementCentre({
      name: 'Kalyanpur Krishi Upaj Mandi',
      code: 'MANDI-BPL-001',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      cropTypesHandled: ['Wheat', 'Paddy', 'Soybean'],
      ratePerKg: {
        Wheat: 22.75,
        Paddy: 21.83,
        Soybean: 46.0,
      },
    });
    await centre.save();
    console.log(`  ✓ Procurement Centre created: ${centre.name} [${centre.code}]`);
    console.log(`  ✓ Rate for Wheat: ₹${centre.ratePerKg.get('Wheat')}/kg`);

    console.log('\n[4/7] Testing Slot Model...');
    const slot = new Slot({
      centreId: centre._id,
      date: new Date('2026-09-10'),
      startTime: '09:00',
      endTime: '11:00',
      maxCapacity: 15,
      bookedCount: 1,
    });
    await slot.save();
    console.log(`  ✓ Slot created for ${slot.date.toISOString().slice(0, 10)} ${slot.startTime}-${slot.endTime} (Cap: ${slot.maxCapacity})`);

    console.log('\n[5/7] Testing Booking Model...');
    const booking = new Booking({
      farmerId: farmer._id,
      slotId: slot._id,
      centreId: centre._id,
      tokenNumber: 'TKN-20260910-001',
      status: 'Booked',
      queuePosition: 1,
    });
    await booking.save();
    console.log(`  ✓ Booking created with Token: ${booking.tokenNumber} (Status: ${booking.status})`);

    console.log('\n[6/7] Testing Procurement Model...');
    const rate = centre.ratePerKg.get('Wheat');
    const quantity = 500; // 500 kg
    const procurement = new Procurement({
      bookingId: booking._id,
      farmerId: farmer._id,
      cropType: 'Wheat',
      quantityKg: quantity,
      moisturePercent: 11.5,
      qualityGrade: 'A',
      ratePerKg: rate,
      totalAmount: quantity * rate,
    });
    await procurement.save();
    console.log(`  ✓ Procurement recorded: ${procurement.quantityKg}kg ${procurement.cropType} @ ₹${procurement.ratePerKg}/kg = ₹${procurement.totalAmount}`);

    console.log('\n[7/7] Testing Payment Model...');
    const payment = new Payment({
      procurementId: procurement._id,
      farmerId: farmer._id,
      amount: procurement.totalAmount,
      status: 'Pending',
    });
    await payment.save();
    console.log(`  ✓ Payment record created: ₹${payment.amount} (Status: ${payment.status})`);

    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS: All 7 Mongoose models verified cleanly!');
    console.log('='.repeat(60));

    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(0);
  } catch (error) {
    console.error('\n[Verification FAILED]', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    process.exit(1);
  }
}

runModelTests();
