import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'agent'],
      default: 'agent',
    },
    team: {
      type: String,
      required: [true, 'Team is required'],
      trim: true,
      default: 'Technical Support',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
