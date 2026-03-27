/**
 * Newsletter Model
 * Schema for newsletter subscriptions
 */

import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['website', 'checkout', 'popup', 'footer', 'other'],
      default: 'website',
    },
    preferences: {
      newArrivals: {
        type: Boolean,
        default: true,
      },
      sales: {
        type: Boolean,
        default: true,
      },
      news: {
        type: Boolean,
        default: true,
      },
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    unsubscribeReason: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    lastEmailSent: {
      type: Date,
      default: null,
    },
    emailsSent: {
      type: Number,
      default: 0,
    },
    emailsOpened: {
      type: Number,
      default: 0,
    },
    emailsClicked: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ createdAt: -1 });

// Pre-save middleware to generate unsubscribe token
newsletterSchema.pre('save', function (next) {
  if (this.isNew && !this.unsubscribeToken) {
    this.unsubscribeToken = this._id.toString() + '-' + 
      Math.random().toString(36).substring(2, 15);
  }
  next();
});

// Static method to find active subscribers
newsletterSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to get subscriber stats
newsletterSchema.statics.getStats = async function () {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ isActive: true });
  const unsubscribed = await this.countDocuments({ isActive: false });
  
  return {
    total,
    active,
    unsubscribed,
    unsubscribeRate: total > 0 ? ((unsubscribed / total) * 100).toFixed(2) : 0,
  };
};

// Instance method to unsubscribe
newsletterSchema.methods.unsubscribe = async function (reason = '') {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  this.unsubscribeReason = reason;
  return this.save();
};

// Instance method to resubscribe
newsletterSchema.methods.resubscribe = async function () {
  this.isActive = true;
  this.unsubscribedAt = null;
  this.unsubscribeReason = '';
  return this.save();
};

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;
