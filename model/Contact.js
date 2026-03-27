/**
 * Contact Model
 * Schema for contact form submissions
 */

import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    subject: {
      type: String,
      trim: true,
      enum: ['', 'order', 'return', 'product', 'shipping', 'other'],
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxLength: [5000, 'Message cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved', 'closed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    responses: [
      {
        responder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ priority: 1, status: 1 });

// Pre-save middleware to set priority based on subject
contactSchema.pre('save', function (next) {
  if (this.isNew) {
    // Set priority based on subject
    if (this.subject === 'order' || this.subject === 'return') {
      this.priority = 'high';
    }
  }
  next();
});

// Static method to find unresolved contacts
contactSchema.statics.findPending = function () {
  return this.find({ status: { $in: ['pending', 'in-progress'] } })
    .sort({ priority: -1, createdAt: 1 });
};

// Instance method to mark as read
contactSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to resolve
contactSchema.methods.resolve = async function () {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
