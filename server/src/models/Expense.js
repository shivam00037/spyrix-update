import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  category: { type: String, trim: true, default: 'General' },
  vendor: { type: String, trim: true, default: '' },
  amountPaise: { type: Number, required: true, min: 1 },
  paymentMethod: { type: String, default: 'other' },
  expenseDate: { type: Date, default: Date.now, index: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'paid' },
}, { timestamps: true });
export default mongoose.model('Expense', expenseSchema);
