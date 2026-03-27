/**
 * MongoDB Database Connection
 * Enterprise-level connection handling with retry logic
 */

import mongoose from 'mongoose';

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerceai';
  
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    
    console.log(`
┌─────────────────────────────────────────────────┐
│  MongoDB Connected Successfully                 │
│  Host: ${conn.connection.host.substring(0, 38).padEnd(38)} │
│  Database: ${conn.connection.name.padEnd(34)} │
└─────────────────────────────────────────────────┘
    `);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    
    // Retry logic for production
    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;
