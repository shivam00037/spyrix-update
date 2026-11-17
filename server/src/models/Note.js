import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  title: { type: String, trim: true, maxlength: 180, default: 'Untitled note' },
  content: { type: String, maxlength: 30000, default: '' },
  category: { type: String, trim: true, maxlength: 60, default: 'General' },
  tags: { type: [String], default: [] },
  color: { type: String, enum: ['white', 'yellow', 'blue', 'green', 'pink', 'purple'], default: 'white' },
  pinned: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  reminderAt: { type: Date, default: null },
  relatedType: { type: String, enum: ['', 'customer', 'invoice', 'quotation', 'product', 'project'], default: '' },
  relatedId: { type: String, default: '' },
}, { timestamps: true });
noteSchema.index({ businessId: 1, updatedAt: -1 });
noteSchema.index({ businessId: 1, pinned: -1, favorite: -1 });
export default mongoose.model('Note', noteSchema);
