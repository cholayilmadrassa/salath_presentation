import mongoose from 'mongoose';
import tenantScopePlugin from './plugins/tenantScope.js';

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered',
    },
  },
  { timestamps: true }
);

// Apply tenantScope plugin (adds tenantId field and scope helpers)
registrationSchema.plugin(tenantScopePlugin, { required: true });

// Unique compound index on { tenantId, userId }
registrationSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Registration', registrationSchema);
