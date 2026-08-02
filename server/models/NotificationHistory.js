import mongoose from 'mongoose';

const notificationHistorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      default: '/dashboard',
    },
    icon: {
      type: String,
      default: '/appLogo.png',
    },
    targetType: {
      type: String,
      enum: ['all', 'tenant', 'user'],
      default: 'all',
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['scheduled', 'processing', 'sent', 'partially_failed', 'failed', 'cancelled'],
      default: 'sent',
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    stats: {
      attempted: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failure: { type: Number, default: 0 },
    },
    category: {
      type: String,
      enum: ['reminder', 'milestone', 'campaign', 'result', 'admin_broadcast'],
      default: 'admin_broadcast',
    },
  },
  { timestamps: true }
);

export default mongoose.models.NotificationHistory || mongoose.model('NotificationHistory', notificationHistorySchema);
