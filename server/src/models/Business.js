import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  currency: { type: String, default: 'INR', enum: ['INR'] },
  theme: { type: String, default: 'neon-green', enum: ['mono', 'orange', 'red', 'neon-yellow', 'neon-green', 'neon-red', 'ocean', 'neon-purple', 'chili-spice', 'neon-blue-black', 'violet'] },
  invoicePrefix: { type: String, default: 'spyrix' },
  address: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  website: { type: String, trim: true, default: '' },
  gstin: { type: String, trim: true, uppercase: true, default: '' },
  state: { type: String, trim: true, default: '' },
  stateCode: { type: String, trim: true, default: '' },
  postalCode: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' },
  invoiceDesign: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Business', businessSchema);
