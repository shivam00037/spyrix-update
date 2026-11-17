import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, unique: true },
  invoiceValue: { type: Number, default: 0 },
  quotationValue: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('InvoiceSequence', schema);
