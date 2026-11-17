import { Router } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';

const router = Router();

function dateRange(key) {
  const now = new Date();
  const start = new Date(now);
  if (key === 'week') {
    const day = (now.getDay() + 6) % 7;
    start.setDate(now.getDate() - day);
  } else if (key === 'year') {
    start.setMonth(0, 1);
  } else if (key === 'all') {
    return null;
  } else {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  return { $gte: start, $lte: now };
}

router.get('/summary', async (req, res, next) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.auth.businessId);
    const paymentDate = dateRange(String(req.query.range || 'month'));
    const paymentFilter = { businessId, status: 'completed' };
    if (paymentDate) paymentFilter.paymentDate = paymentDate;

    const [totalClients, revenueRows, pendingRows, recentInvoices, recentPayments, lowStockProducts] = await Promise.all([
      Customer.countDocuments({ businessId, status: 'active' }),
      Payment.aggregate([
        { $match: paymentFilter },
        { $group: { _id: null, amountPaise: { $sum: '$amountPaise' } } },
      ]),
      Invoice.aggregate([
        { $match: { businessId, status: { $in: ['issued', 'partially_paid', 'overdue'] } } },
        { $lookup: {
          from: 'payments',
          let: { invoiceId: '$_id', workspaceId: '$businessId' },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ['$businessId', '$$workspaceId'] }, { $eq: ['$status', 'completed'] } ] } } },
            { $unwind: '$allocations' },
            { $match: { $expr: { $eq: ['$allocations.invoiceId', '$$invoiceId'] } } },
            { $group: { _id: null, paidPaise: { $sum: '$allocations.amountPaise' } } },
          ],
          as: 'paymentTotals',
        } },
        { $addFields: { paidPaise: { $ifNull: [{ $arrayElemAt: ['$paymentTotals.paidPaise', 0] }, 0] } } },
        { $project: { outstandingPaise: { $max: [{ $subtract: ['$totalPaise', '$paidPaise'] }, 0] } } },
        { $group: { _id: null, pendingPaise: { $sum: '$outstandingPaise' } } },
      ]),
      Invoice.find({ businessId, status: { $ne: 'cancelled' } })
        .sort({ createdAt: -1 }).limit(5)
        .populate('customerId', 'name companyName')
        .select('invoiceNumber status totalPaise issueDate dueDate customerId createdAt').lean(),
      Payment.find({ businessId }).sort({ paymentDate: -1 }).limit(5)
        .select('amountPaise paymentDate method reference status').lean(),
      Product.find({ businessId, active: true, $expr: { $lte: ['$stockOnHand', '$lowStockAt'] } })
        .sort({ stockOnHand: 1 }).limit(5).select('name sku stockOnHand lowStockAt').lean(),
    ]);

    res.json({
      summary: {
        totalClients,
        totalRevenue: (revenueRows[0]?.amountPaise || 0) / 100,
        pendingRevenue: (pendingRows[0]?.pendingPaise || 0) / 100,
        recentInvoices,
        recentPayments,
        lowStockProducts,
        range: String(req.query.range || 'month'),
        currency: 'INR',
      },
      source: 'mongodb',
    });
  } catch (error) { next(error); }
});

export default router;
