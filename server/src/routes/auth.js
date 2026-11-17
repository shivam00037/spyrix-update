import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Business from '../models/Business.js';
import BusinessMember from '../models/BusinessMember.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

function makeToken(userId, businessId) {
  return jwt.sign({ userId: String(userId), businessId: String(businessId) }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function responseFor(user, business) {
  return {
    token: makeToken(user._id, business._id),
    user: { id: user._id, name: user.name, email: user.email },
    business: { id: business._id, name: business.name, currency: business.currency, theme: business.theme, invoicePrefix: business.invoicePrefix, invoiceDesign: business.invoiceDesign || {}, address: business.address || '', phone: business.phone || '', email: business.email || '', website: business.website || '', gstin: business.gstin || '' },
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const businessName = String(req.body.businessName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const allowedThemes = ['mono', 'red', 'neon-yellow', 'neon-green', 'ocean', 'neon-red', 'chili-spice', 'neon-blue-black', 'violet'];
    const themeAliases = { orange: 'chili-spice', 'neon-purple': 'violet', purple: 'violet', burgundy: 'red', blue: 'ocean' };
    const requestedTheme = String(req.body.theme || 'neon-green').trim().toLowerCase();
    const normalizedTheme = themeAliases[requestedTheme] || requestedTheme;
    const theme = allowedThemes.includes(normalizedTheme) ? normalizedTheme : 'neon-green';
    if (!name || !businessName || !email || password.length < 8) {
      return res.status(400).json({ message: 'Enter your name, business name, valid email and a password of at least 8 characters.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    try {
      const business = await Business.create({ name: businessName, ownerId: user._id, theme });
      await BusinessMember.create({ businessId: business._id, userId: user._id, role: 'Owner' });
      return res.status(201).json(responseFor(user, business));
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    const membership = await BusinessMember.findOne({ userId: user._id }).populate('businessId');
    if (!membership?.businessId) return res.status(403).json({ message: 'No business workspace is assigned to this account.' });
    return res.json(responseFor(user, membership.businessId));
  } catch (error) { next(error); }
});


// Google Identity Services sends a signed ID token. Verify it with Google's
// tokeninfo endpoint and require the configured OAuth client as the audience.
router.post('/google', async (req, res, next) => {
  try {
    const credential = String(req.body.credential || '').trim();
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) return res.status(503).json({ message: 'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID to server/.env and VITE_GOOGLE_CLIENT_ID to client/.env.' });
    if (!credential || credential.length > 10000) return res.status(400).json({ message: 'Google sign-in returned an invalid credential.' });

    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyResponse.ok) return res.status(401).json({ message: 'Google could not verify this sign-in. Please try again.' });
    const identity = await verifyResponse.json();
    const verifiedEmail = identity.email_verified === true || identity.email_verified === 'true';
    if (identity.aud !== clientId || !identity.sub || !verifiedEmail || !/^\S+@\S+\.\S+$/.test(String(identity.email || ''))) {
      return res.status(401).json({ message: 'This Google account could not be verified for SPYRIX.' });
    }

    const email = String(identity.email).trim().toLowerCase();
    const name = String(identity.name || email.split('@')[0]).trim().slice(0, 100) || 'SPYRIX User';
    let user = await User.findOne({ $or: [{ googleId: String(identity.sub) }, { email }] }).select('+passwordHash');
    if (!user) {
      user = await User.create({ name, email, googleId: String(identity.sub), avatarUrl: String(identity.picture || '') });
    } else {
      if (user.googleId && user.googleId !== String(identity.sub)) {
        return res.status(409).json({ message: 'This email is already linked to another Google account.' });
      }
      if (!user.googleId) user.googleId = String(identity.sub);
      if (!user.name) user.name = name;
      if (identity.picture) user.avatarUrl = String(identity.picture).slice(0, 1000);
      await user.save();
    }

    let membership = await BusinessMember.findOne({ userId: user._id }).populate('businessId');
    if (!membership?.businessId) {
      const business = await Business.create({ name: `${name}'s Business`, ownerId: user._id, theme: 'neon-green' });
      membership = await BusinessMember.create({ businessId: business._id, userId: user._id, role: 'Owner' });
      membership = await membership.populate('businessId');
    }
    return res.json(responseFor(user, membership.businessId));
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [user, business] = await Promise.all([
      User.findById(req.auth.userId).select('name email'),
      Business.findById(req.auth.businessId).select('name currency theme invoicePrefix invoiceDesign address phone email website gstin'),
    ]);
    if (!user || !business) return res.status(404).json({ message: 'Workspace not found.' });
    res.json({ user: { id: user._id, name: user.name, email: user.email }, business: { id: req.auth.businessId, ...business.toObject() }, role: req.auth.role });
  } catch (error) { next(error); }
});

export default router;
