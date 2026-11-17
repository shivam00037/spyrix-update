import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 80, required: true },
  value: { type: String, trim: true, maxlength: 500, default: '' },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  customerCode: { type: String, trim: true, uppercase: true, maxlength: 32 },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  contactPerson: { type: String, trim: true, maxlength: 160, default: '' },
  companyName: { type: String, trim: true, maxlength: 160, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  alternatePhone: { type: String, trim: true, default: '' },
  billingAddress: { type: String, trim: true, default: '' },
  shippingAddress: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  stateCode: { type: String, trim: true, default: '' },
  postalCode: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' },
  gstin: { type: String, trim: true, uppercase: true, default: '' },
  pan: { type: String, trim: true, uppercase: true, default: '' },
  paymentTerms: { type: String, trim: true, default: 'Due on receipt' },
  customFields: { type: [customFieldSchema], default: [] },
  notes: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

customerSchema.index({ businessId: 1, name: 1 });
customerSchema.index({ businessId: 1, companyName: 1 });
customerSchema.index({ businessId: 1, customerCode: 1 }, { unique: true, partialFilterExpression: { customerCode: { $type: 'string' } } });
export default mongoose.model('Customer', customerSchema);
