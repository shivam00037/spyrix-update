import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  sku: { type: String, trim: true, uppercase: true, default: '' },
  description: { type: String, trim: true, default: '' },
  category: { type: String, trim: true, default: 'General' },
  unit: { type: String, trim: true, default: 'pcs' },
  pricePaise: { type: Number, default: 0, min: 0 },
  costPaise: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  stockOnHand: { type: Number, default: 0, min: 0 },
  lowStockAt: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });
productSchema.index({ businessId: 1, sku: 1 }, { sparse: true });
export default mongoose.model('Product', productSchema);
