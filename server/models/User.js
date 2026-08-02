import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'tenant_admin', 'member'],
      default: 'member',
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    isActive: { type: Boolean, default: true },
    // Optional contact details for member profile
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    place: { type: String, default: '', trim: true },
    notifiedMilestones: { type: [Number], default: [] },
    readNotifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NotificationHistory' }],
  },
  { timestamps: true }
);

// Pre-validate hook enforcing tenantId-by-role rules
userSchema.pre('validate', function (next) {
  if (this.role === 'tenant_admin' && !this.tenantId) {
    this.invalidate('tenantId', 'tenantId is required for tenant_admin users.');
  }
  if (this.role === 'super_admin' && this.tenantId) {
    this.tenantId = null;
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
