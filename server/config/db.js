const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lobbyit';
    console.log(`[DB] Attempting MongoDB connection to ${connUri}...`);
    
    // Set short timeout for fast fallback if local mongo is down
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[DB] Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log(`[DB] Standard MongoDB connection failed (${error.message}).`);
    console.log(`[DB] Initializing MongoDB Memory Server fallback for zero-config operation...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      
      const conn = await mongoose.connect(uri);
      console.log(`[DB] Connected to MongoDB Memory Server at: ${uri}`);
      return conn;
    } catch (memError) {
      console.error(`[DB] Critical Error: Failed to start database:`, memError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
