import mongoose from 'mongoose';

const slaPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Policy name is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      required: [true, 'Priority is required'],
    },
    category: {
      type: String,
      enum: ['Technical', 'Billing', 'Account', 'General'],
      required: [true, 'Category is required'],
    },
    firstResponseTimeMinutes: {
      type: Number,
      required: [true, 'First response target time in minutes is required'],
      min: [1, 'Target time must be at least 1 minute'],
    },
    resolutionTimeMinutes: {
      type: Number,
      required: [true, 'Resolution target time in minutes is required'],
      min: [1, 'Target time must be at least 1 minute'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookups
slaPolicySchema.index({ priority: 1, category: 1, isActive: 1 });

export const SLAPolicy = mongoose.model('SLAPolicy', slaPolicySchema);
