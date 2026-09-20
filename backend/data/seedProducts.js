const dotenv = require("dotenv");
const db = require("../config/db");
const Product = require("../models/Product");
const sampleProducts = require("./sampleProducts");
const fileStore = require("./fileStore");

dotenv.config();

const seedProducts = async () => {
  try {
    await db.connectDB();

    if (db.usingFileDb()) {
      await fileStore.seedProducts();
    } else {
      await Product.deleteMany();
      await Product.insertMany(sampleProducts);
    }

    console.log("Products seeded successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedProducts();
