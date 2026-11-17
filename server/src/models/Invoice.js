import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  sku: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, default: 'pcs' },
  ratePaise: { type: Number, required: true, min: 0 },
  discountPaise: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  taxablePaise: { type: Number, required: true, min: 0 },
  taxPaise: { type: Number, default: 0, min: 0 },
  lineTotalPaise: { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  invoiceNumber: { type: String, required: true, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  sourceQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null },
  sourceQuotationNumber: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'], default: 'draft', index: true },
  items: { type: [invoiceItemSchema], default: [] },
  subtotalPaise: { type: Number, default: 0, min: 0 },
  discountPaise: { type: Number, default: 0, min: 0 },
  taxPaise: { type: Number, default: 0, min: 0 },
  totalPaise: { type: Number, required: true, min: 0 },
  notes: { type: String, default: '' },
  terms: { type: String, default: '' },
  templateId: { type: String, default: 'xenmark' },
  design: { type: mongoose.Schema.Types.Mixed, default: {} },
  purchaseOrder: { type: String, trim: true, default: '' },
  reference: { type: String, trim: true, default: '' },
  customFields: { type: [{ label: { type: String, trim: true, maxlength: 80 }, value: { type: String, trim: true, maxlength: 500 } }], default: [] },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
}, { timestamps: true });
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, issueDate: -1 });
export default mongoose.model('Invoice', invoiceSchema);
