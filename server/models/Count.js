import mongoose from 'mongoose';
import tenantScopePlugin from './plugins/tenantScope.js';

const countSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    value: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Apply tenantScope plugin for tenant isolation
countSchema.plugin(tenantScopePlugin, { required: false });

// Index for fast query by tenant, user and date
countSchema.index({ tenantId: 1, user: 1, date: 1 });

export default mongoose.model('Count', countSchema);
