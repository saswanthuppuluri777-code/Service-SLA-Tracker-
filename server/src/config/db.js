import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let memServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[DB] Attempting connection to configured MongoDB: ${uri.replace(/\/\/.*@/, '//***@')}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[DB] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`[DB] Could not connect to configured MongoDB (${err.message}). Falling back to in-memory MongoDB...`);
    }
  }

  // Fallback: in-memory MongoDB (MongoMemoryServer)
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memServer = await MongoMemoryServer.create();
    const memUri = memServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[DB] In-Memory MongoDB Server started successfully at: ${memUri}`);
    return conn;
  } catch (err) {
    console.error(`[DB] Failed to start In-Memory MongoDB:`, err);
    throw err;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memServer) {
      await memServer.stop();
      memServer = null;
    }
    console.log('[DB] Disconnected from MongoDB.');
  } catch (err) {
    console.error('[DB] Error disconnecting from MongoDB:', err);
  }
};
