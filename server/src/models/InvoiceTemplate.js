import mongoose from 'mongoose';

const invoiceTemplateSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, trim: true, maxlength: 100, required: true },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  category: { type: String, trim: true, maxlength: 60, default: 'Custom' },
  templateId: { type: String, trim: true, maxlength: 60, default: 'xenmark' },
  design: { type: mongoose.Schema.Types.Mixed, default: {} },
  favorite: { type: Boolean, default: false },
}, { timestamps: true });

invoiceTemplateSchema.index({ businessId: 1, createdAt: -1 });
invoiceTemplateSchema.index({ businessId: 1, name: 1 });
export default mongoose.model('InvoiceTemplate', invoiceTemplateSchema);
