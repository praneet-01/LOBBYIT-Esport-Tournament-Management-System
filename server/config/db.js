const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const connUri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lobbyit";
    console.log(`[DB] Attempting MongoDB connection to ${connUri}...`);

    const isAtlas =
      connUri.includes("mongodb+srv://") || connUri.includes("mongodb.net");
    const timeout = isAtlas ? 15000 : 3000;

    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: timeout,
    });
    console.log(
      `[DB] Successfully connected to MongoDB Database: ${conn.connection.host}`,
    );
    return conn;
  } catch (error) {
    console.log(`[DB] Standard MongoDB connection failed (${error.message}).`);
    console.log(
      `[DB] Initializing MongoDB Memory Server fallback for zero-config operation...`,
    );

    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: "7.0.5",
        },
      });
      const uri = mongoServer.getUri();

      const conn = await mongoose.connect(uri);
      console.log(
        `[DB] Connected to MongoDB Memory Server (v7.0.5) at: ${uri}`,
      );
      return conn;
    } catch (memError) {
      console.error(
        `[DB] Critical Error: Failed to start database:`,
        memError.message,
      );
      process.exit(1);
    }
  }
};

module.exports = connectDB;
