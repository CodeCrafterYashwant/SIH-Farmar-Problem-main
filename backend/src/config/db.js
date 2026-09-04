const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 1500) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`[MongoDB Connection Attempt ${i}/${retries} Failed]: ${error.message}`);
      if (i === retries) {
        console.error(`[MongoDB Connection Error] Could not connect after ${retries} attempts.`);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
