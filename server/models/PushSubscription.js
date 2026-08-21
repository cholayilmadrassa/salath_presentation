import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      default: '',
    },
    prayerNotifEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    location: {
      lat: { type: Number, default: 11.2588 },
      lon: { type: Number, default: 75.7804 },
      city: { type: String, default: 'Kozhikode' },
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    lastSuccessAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);
