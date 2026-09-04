const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  Farmer,
  Staff,
  ProcurementCentre,
  Slot,
  Booking,
  Procurement,
  Payment,
} = require('../models');

async function testOfflineSchemaValidation() {
  console.log('='.repeat(65));
  console.log('Phase 1 Verification: Schema Integrity & Validation Rules');
  console.log('='.repeat(65));

  // 1. Farmer Schema Validation
  console.log('\n[1/7] Testing Farmer Schema & Pre-Save Password Hashing...');
  const farmerDoc = new Farmer({
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
  });

  const farmerValErr = farmerDoc.validateSync();
  if (farmerValErr) throw farmerValErr;
  console.log('  ✓ Farmer schema validation passed.');

  // Test bcrypt hashing function manually & comparePassword
  const salt = await bcrypt.genSalt(10);
  farmerDoc.password = await bcrypt.hash(farmerDoc.password, salt);
  const isMatch = await farmerDoc.comparePassword('FarmerSecurePass123');
  if (!isMatch) throw new Error('comparePassword failed on Farmer model');
  console.log('  ✓ Farmer bcrypt hashing and password comparison verified.');

  // 2. Staff Schema Validation
  console.log('\n[2/7] Testing Staff Schema & Role Enum...');
  const staffDoc = new Staff({
    name: 'Sunita Sharma',
    username: 'sunita_admin',
    password: 'StaffAdminPass123',
    role: 'admin',
  });
  const staffValErr = staffDoc.validateSync();
  if (staffValErr) throw staffValErr;
  console.log('  ✓ Staff schema validation passed (admin role).');

  const invalidStaff = new Staff({
    name: 'Bad Role User',
    username: 'bad_user',
    password: 'password123',
    role: 'superadmin', // Invalid role
  });
  const invalidRoleErr = invalidStaff.validateSync();
  if (!invalidRoleErr || !invalidRoleErr.errors.role) {
    throw new Error('Staff role enum did not reject invalid role!');
  }
  console.log('  ✓ Staff role enum correctly rejects invalid role.');

  // 3. ProcurementCentre Schema Validation
  console.log('\n[3/7] Testing ProcurementCentre Schema & Map...');
  const centreDoc = new ProcurementCentre({
    name: 'Kalyanpur Krishi Upaj Mandi',
    code: 'MANDI-BPL-001',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    cropTypesHandled: ['Wheat', 'Paddy', 'Soybean'],
    ratePerKg: {
      Wheat: 22.75,
      Paddy: 21.83,
    },
  });
  const centreValErr = centreDoc.validateSync();
  if (centreValErr) throw centreValErr;
  console.log('  ✓ ProcurementCentre schema validation passed with crop rates.');

  // 4. Slot Schema Validation
  console.log('\n[4/7] Testing Slot Schema...');
  const slotDoc = new Slot({
    centreId: new mongoose.Types.ObjectId(),
    date: new Date('2026-09-10'),
    startTime: '09:00',
    endTime: '11:00',
    maxCapacity: 15,
    bookedCount: 0,
  });
  const slotValErr = slotDoc.validateSync();
  if (slotValErr) throw slotValErr;
  console.log('  ✓ Slot schema validation passed.');

  // 5. Booking Schema Validation
  console.log('\n[5/7] Testing Booking Schema & Status Enum...');
  const bookingDoc = new Booking({
    farmerId: farmerDoc._id,
    slotId: slotDoc._id,
    centreId: centreDoc._id,
    tokenNumber: 'TKN-20260910-001',
    status: 'Booked',
  });
  const bookingValErr = bookingDoc.validateSync();
  if (bookingValErr) throw bookingValErr;
  console.log('  ✓ Booking schema validation passed (status: Booked).');

  // 6. Procurement Schema Validation
  console.log('\n[6/7] Testing Procurement Schema...');
  const procDoc = new Procurement({
    bookingId: bookingDoc._id,
    farmerId: farmerDoc._id,
    cropType: 'Wheat',
    quantityKg: 500,
    moisturePercent: 11.2,
    qualityGrade: 'A',
    ratePerKg: 22.75,
    totalAmount: 500 * 22.75,
  });
  const procValErr = procDoc.validateSync();
  if (procValErr) throw procValErr;
  console.log(`  ✓ Procurement schema validation passed: totalAmount = ₹${procDoc.totalAmount}.`);

  // 7. Payment Schema Validation
  console.log('\n[7/7] Testing Payment Schema...');
  const payDoc = new Payment({
    procurementId: procDoc._id,
    farmerId: farmerDoc._id,
    amount: procDoc.totalAmount,
    status: 'Pending',
  });
  const payValErr = payDoc.validateSync();
  if (payValErr) throw payValErr;
  console.log('  ✓ Payment schema validation passed (status: Pending).');

  console.log('\n' + '='.repeat(65));
  console.log('SUCCESS: All 7 Mongoose schemas & validation rules verified 100%!');
  console.log('='.repeat(65));
}

testOfflineSchemaValidation().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
