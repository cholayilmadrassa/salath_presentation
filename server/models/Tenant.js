import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    customDomainVerified: { type: Boolean, default: false },
    customDomainConnected: { type: Boolean, default: false },
    customDomainVerificationToken: { type: String, default: '' },
    lastVerifyAttemptAt: { type: Date },
    verifyAttemptsCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    paymentAmount: { type: Number, default: 250 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'failed'],
      default: 'pending',
    },
    paymentUtr: { type: String, default: '' },
    paymentMethod: { type: String, default: 'UPI' },
    paidAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branding: {
      title: { type: String, default: '' },
      tagline: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      themeColor: { type: String, default: '#4f46e5' },
    },
    swalath: {
      title: { type: String, default: 'സ്വലാത്ത്' },
      arabicText: { type: String, default: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ وَبَارِكْ وَسَلِّمْ' },
      translation: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
    },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('Tenant', tenantSchema);
