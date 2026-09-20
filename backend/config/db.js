const mongoose = require("mongoose");

let fileDbMode = false;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/simple_ecommerce_store";
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    if (process.env.MONGO_REQUIRED === "true") {
      console.error(`MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }

    fileDbMode = true;
    console.warn(`MongoDB unavailable (${error.message}). Using local JSON database.`);
  }
};

const usingFileDb = () => fileDbMode;

module.exports = { connectDB, usingFileDb };
