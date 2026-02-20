import mongoose from 'mongoose';
import { createClient } from 'redis';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event-control';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: REDIS_URL
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    throw error;
  }
};

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export const initializeDatabases = async () => {
  await Promise.all([
    connectMongoDB(),
    connectRedis()
  ]);
};

export const closeDatabases = async () => {
  await Promise.all([
    mongoose.connection.close(),
    redisClient.disconnect()
  ]);
};
