import mongoose from 'mongoose';

const businessMemberSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Owner', 'Admin', 'Accountant', 'Sales', 'Inventory Manager', 'Viewer'], default: 'Owner' },
}, { timestamps: true });

businessMemberSchema.index({ businessId: 1, userId: 1 }, { unique: true });
export default mongoose.model('BusinessMember', businessMemberSchema);
