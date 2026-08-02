import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dailyReminders: {
      type: Boolean,
      default: true,
    },
    milestones: {
      type: Boolean,
      default: true,
    },
    campaignAnnouncements: {
      type: Boolean,
      default: true,
    },
    results: {
      type: Boolean,
      default: true,
    },
    notifiedMilestones: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', notificationPreferenceSchema);
