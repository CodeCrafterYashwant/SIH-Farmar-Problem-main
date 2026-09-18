require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ProcurementCentre } = require('../models');

async function check() {
  await connectDB();
  const centres = await ProcurementCentre.find({});
  console.log('--- CENTRES IN DB ---');
  centres.forEach(c => {
    console.log(`ID: ${c._id}, Name: ${c.name}, Code: ${c.code}`);
    console.log('ratePerKg Map:', c.ratePerKg);
    if (c.ratePerKg) {
      console.log('toJSON ratePerKg:', JSON.stringify(c.ratePerKg));
      console.log('Wheat rate:', typeof c.ratePerKg.get === 'function' ? c.ratePerKg.get('Wheat') : c.ratePerKg.Wheat);
    }
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
