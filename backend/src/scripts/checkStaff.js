require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Staff } = require('../models');

async function check() {
  await connectDB();
  const staff = await Staff.find({}).populate('centreId');
  console.log('--- STAFF IN DB ---');
  staff.forEach(s => {
    console.log(`Username: ${s.username}, Role: ${s.role}, Centre:`, s.centreId);
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
