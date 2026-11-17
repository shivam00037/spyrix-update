import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: function requiredPasswordHash() { return !this.googleId; }, select: false },
  googleId: { type: String, default: undefined, unique: true, sparse: true },
  avatarUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
