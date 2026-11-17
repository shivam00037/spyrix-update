import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amountPaise: { type: Number, required: true, min: 1 },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  amountPaise: { type: Number, required: true, min: 1 },
  paymentDate: { type: Date, default: Date.now, index: true },
  method: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'], default: 'other' },
  reference: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['completed', 'pending', 'failed', 'refunded'], default: 'completed', index: true },
  allocations: { type: [allocationSchema], default: [] },
}, { timestamps: true });
export default mongoose.model('Payment', paymentSchema);
