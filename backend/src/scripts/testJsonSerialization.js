require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ProcurementCentre } = require('../models');

async function test() {
  await connectDB();
  const centres = await ProcurementCentre.find().sort({ name: 1 });
  const raw = JSON.parse(JSON.stringify({ centres }));
  const sehore = raw.centres.find(c => c.name === 'Sehore' || c.code === '123');
  console.log('Sehore object in JSON:', sehore);
  console.log('Sehore ratePerKg in JSON:', sehore.ratePerKg);
  console.log('Type of ratePerKg:', typeof sehore.ratePerKg);
  console.log('ratePerKg.Wheat:', sehore.ratePerKg?.Wheat);
  console.log('ratePerKg.wheat:', sehore.ratePerKg?.wheat);
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
