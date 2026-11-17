import { Router } from 'express';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Quotation from '../models/Quotation.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 80);
    if (q.length < 2) return res.json({ results: [] });
    const businessId = req.auth.businessId;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(escaped, 'i');
    const [customers, invoices, products] = await Promise.all([
      Customer.find({ businessId, status: 'active', $or: [{ name: expression }, { customerCode: expression }, { companyName: expression }, { email: expression }, { phone: expression }, { gstin: expression }] }).limit(5).select('customerCode name companyName email phone').lean(),
      Invoice.find({ businessId, invoiceNumber: expression }).limit(4).populate('customerId', 'name companyName').select('invoiceNumber status customerId').lean(),
      Product.find({ businessId, active: true, $or: [{ name: expression }, { sku: expression }] }).limit(4).select('name sku').lean(),
    ]);
    const matchedCustomerIds = customers.map(item => item._id);
    const [quotations, payments, expenses] = await Promise.all([
      Quotation.find({ businessId, $or: [{ quotationNumber: expression }, { status: expression }, { 'customerSnapshot.name': expression }, { 'customerSnapshot.companyName': expression }, ...(matchedCustomerIds.length ? [{ customerId: { $in: matchedCustomerIds } }] : [])] }).limit(3).populate('customerId', 'name companyName').select('quotationNumber status customerId customerSnapshot').lean(),
      Payment.find({ businessId, $or: [{ reference: expression }, { method: expression }, { status: expression }, ...(matchedCustomerIds.length ? [{ customerId: { $in: matchedCustomerIds } }] : [])] }).limit(3).populate('customerId', 'name companyName').select('status method reference amountPaise customerId paymentDate').lean(),
      Expense.find({ businessId, $or: [{ title: expression }, { vendor: expression }, { category: expression }, { status: expression }] }).limit(3).select('title vendor category status expenseDate').lean(),
    ]);
    const results = [
      ...invoices.map(item => ({ id: item._id, type: 'Invoice', title: item.invoiceNumber, subtitle: item.customerId?.companyName || item.customerId?.name || item.status, path: '/app/invoices' })),
      ...customers.map(item => ({ id: item._id, type: 'Customer', title: item.name, subtitle: [item.customerCode, item.companyName || item.email].filter(Boolean).join(' · ') || 'Customer record', path: '/app/customers' })),
      ...products.map(item => ({ id: item._id, type: 'Product', title: item.name, subtitle: item.sku || 'Product record', path: '/app/products' })),
      ...quotations.map(item => ({ id: item._id, type: 'Quotation', title: item.quotationNumber, subtitle: item.customerId?.companyName || item.customerId?.name || item.status, path: '/app/quotations' })),
      ...payments.map(item => ({ id: item._id, type: 'Payment', title: item.reference || item.method || 'Payment', subtitle: [item.customerId?.companyName || item.customerId?.name, item.status].filter(Boolean).join(' · '), path: '/app/payments' })),
      ...expenses.map(item => ({ id: item._id, type: 'Expense', title: item.title || item.vendor || 'Expense', subtitle: [item.category, item.status].filter(Boolean).join(' · '), path: '/app/expenses' })),
    ].slice(0, 10);
    res.json({ results });
  } catch (error) { next(error); }
});

export default router;
