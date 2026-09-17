const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/carelink";
  try {
    await mongoose.connect(uri);
    console.log(`[CareLink] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[CareLink] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
