import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    changedBy: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
    },
    previousValue: {
      type: String,
      default: '',
    },
    newValue: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const escalationLogSchema = new mongoose.Schema(
  {
    thresholdCrossed: {
      type: String,
      required: true,
    },
    simulatedNotificationSent: {
      type: Boolean,
      default: true,
    },
    details: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      default: 'agent',
    },
    content: {
      type: String,
      required: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerReference: {
      type: String,
      required: [true, 'Customer reference is required'],
      trim: true,
    },
    issueCategory: {
      type: String,
      enum: ['Technical', 'Billing', 'Account', 'General'],
      required: [true, 'Issue category is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      required: [true, 'Priority is required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Reopened'],
      default: 'Open',
      index: true,
    },
    assignedTeam: {
      type: String,
      required: [true, 'Assigned team is required'],
      index: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    slaPolicyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SLAPolicy',
      required: true,
    },
    firstResponseDue: {
      type: Date,
      required: true,
      index: true,
    },
    firstResponseAt: {
      type: Date,
      default: null,
    },
    resolutionDue: {
      type: Date,
      required: true,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    slaStatus: {
      type: String,
      enum: ['On Track', 'At Risk', 'Breached'],
      default: 'On Track',
      index: true,
    },
    history: [historySchema],
    escalationLog: [escalationLogSchema],
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
