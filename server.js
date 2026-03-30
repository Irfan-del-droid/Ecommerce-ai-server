/**
 * LOKI STORES - Enterprise E-Commerce Backend
 * MVC Architecture with Express.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db/connection.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routers/authRoutes.js';
import productRoutes from './routers/productRoutes.js';
import contactRoutes from './routers/contactRoutes.js';
import newsletterRoutes from './routers/newsletterRoutes.js';
import userRoutes from './routers/userRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================================
// MIDDLEWARE
// ============================================================

// CORS Configuration - Enterprise level
const allowedOrigins = [
  'https://verdant-alpaca-762d16.netlify.app',
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173', // Vite default
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (Development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/users', userRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================================
// SERVER STARTUP
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   LOKI STORES API SERVER                                 ║
║                                                          ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(39)}║
║   Port: ${PORT.toString().padEnd(47)}║
║   Database: MongoDB                                      ║
║                                                          ║
║   Ready to serve the realm!                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
