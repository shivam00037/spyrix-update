import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import BusinessMember from '../models/BusinessMember.js';

export async function authenticate(req, res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.isValidObjectId(payload.userId) || !mongoose.isValidObjectId(payload.businessId)) {
      return res.status(401).json({ message: 'Your session is invalid. Please sign in again.' });
    }
    const membership = await BusinessMember.findOne({ userId: payload.userId, businessId: payload.businessId }).lean();
    if (!membership) return res.status(403).json({ message: 'You no longer have access to this workspace.' });
    req.auth = { userId: payload.userId, businessId: payload.businessId, role: membership.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}
