import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';

const DataContext = createContext(null);
const resources = ['customers', 'products', 'invoices', 'payments', 'expenses', 'quotations', 'notes', 'templates'];
const round = n => Math.round(Number(n || 0) * 100) / 100;
const amount = paise => round(Number(paise || 0) / 100);

function normalize(resource, item) {
  if (!item) return item;
  const record = { ...item, id: String(item._id || item.id) };
  if (resource === 'customers') { record.customerCode = item.customerCode || `CUS-${String(item._id || item.id).slice(-8).toUpperCase()}`; record.customFields = Array.isArray(item.customFields) ? item.customFields : []; }
  if (resource === 'products') { record.price = amount(item.pricePaise ?? item.price * 100); record.cost = amount(item.costPaise ?? item.cost * 100); }
  if (resource === 'invoices') {
    const customer = item.customerId && typeof item.customerId === 'object' ? item.customerId : null;
    record.customerId = customer?._id || item.customerId;
    record.customerName = customer?.name || item.customerSnapshot?.name || item.customerName || 'Customer';
    record.companyName = customer?.companyName || item.customerSnapshot?.companyName || item.companyName || '';
    record.customerSnapshot = { ...(customer || {}), ...(item.customerSnapshot || {}) };
    record.design = item.design || {};
    record.sourceQuotationId = item.sourceQuotationId ? String(item.sourceQuotationId._id || item.sourceQuotationId) : '';
    record.sourceQuotationNumber = item.sourceQuotationNumber || '';
    record.customFields = Array.isArray(item.customFields) ? item.customFields : [];
    record.total = amount(item.totalPaise ?? item.total * 100);
    record.subtotal = amount(item.subtotalPaise ?? item.subtotal * 100);
    record.tax = amount(item.taxPaise ?? item.tax * 100);
    record.discount = amount(item.discountPaise ?? item.discount * 100);
    record.paidAmount = item.paidPaise !== undefined ? amount(item.paidPaise) : Number(item.paidAmount || 0);
    record.items = (item.items || []).map(line => ({ ...line, rate: amount(line.ratePaise ?? line.rate * 100), discount: amount(line.discountPaise ?? line.discount * 100), tax: amount(line.taxPaise ?? line.tax * 100), lineTotal: amount(line.lineTotalPaise ?? line.lineTotal * 100) }));
    record.issueDate = item.issueDate ? String(item.issueDate).slice(0, 10) : '';
    record.dueDate = item.dueDate ? String(item.dueDate).slice(0, 10) : '';
  }
  if (resource === 'templates') { record.design = item.design || {}; record.templateId = item.templateId || item.design?.templateId || 'xenmark'; record.category = item.category || 'Custom'; record.favorite = Boolean(item.favorite); record.createdAt = item.createdAt ? String(item.createdAt) : new Date().toISOString(); }
  if (resource === 'payments') {
    const customer = item.customerId && typeof item.customerId === 'object' ? item.customerId : null;
    record.customerId = customer?._id || item.customerId;
    record.customerName = customer?.name || item.customerName || '';
    record.amount = amount(item.amountPaise ?? item.amount * 100);
    record.paymentDate = item.paymentDate ? String(item.paymentDate).slice(0, 10) : '';
    const allocation = item.allocations?.[0];
    const invoice = allocation?.invoiceId && typeof allocation.invoiceId === 'object' ? allocation.invoiceId : null;
    record.invoiceId = invoice?._id || allocation?.invoiceId || item.invoiceId;
    record.invoiceNumber = invoice?.invoiceNumber || item.invoiceNumber || '';
  }
  if (resource === 'expenses') { record.amount = amount(item.amountPaise ?? item.amount * 100); record.expenseDate = item.expenseDate ? String(item.expenseDate).slice(0, 10) : ''; }
  if (resource === 'quotations') {
    const customer = item.customerId && typeof item.customerId === 'object' ? item.customerId : null;
    record.customerId = customer?._id || item.customerId;
    record.customerName = customer?.name || item.customerSnapshot?.name || item.customerName || 'Customer';
    record.customerSnapshot = { ...(item.customerSnapshot || {}), ...(customer || {}) };
    record.design = item.design || {};
    record.templateId = item.templateId || item.design?.templateId || 'xenmark';
    record.convertedInvoiceId = item.convertedInvoiceId ? String(item.convertedInvoiceId._id || item.convertedInvoiceId) : '';
    record.items = (item.items || []).map(line => ({ ...line, rate: amount(line.ratePaise ?? line.rate * 100), discount: amount(line.discountPaise ?? line.discount * 100), tax: amount(line.taxPaise ?? line.tax * 100), lineTotal: amount(line.lineTotalPaise ?? line.lineTotal * 100) }));
    record.total = amount(item.totalPaise ?? item.total * 100);
    record.validUntil = item.validUntil ? String(item.validUntil).slice(0, 10) : '';
    record.createdAt = item.createdAt ? String(item.createdAt).slice(0, 10) : '';
  }
  return record;
}


export function DataProvider({ children }) {
  const [records, setRecords] = useState(() => Object.fromEntries(resources.map(key => [key, []])));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all(resources.map(resource => apiRequest(`/data/${resource}?limit=200`)));
      const next = Object.fromEntries(resources.map((resource, index) => [resource, (results[index].items || []).map(item => normalize(resource, item))]));
      setRecords(next);
      return next;
    } catch (err) {
      setError(err.message || 'Could not load workspace data.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const createRecord = useCallback(async (resource, payload) => {
    if (!resources.includes(resource)) throw new Error('This module is not available.');
    const response = await apiRequest(`/data/${resource}`, { method: 'POST', body: JSON.stringify(payload) });
    const item = normalize(resource, response.item);
    setRecords(current => ({ ...current, [resource]: [item, ...(current[resource] || [])] }));
    if (resource === 'payments' && item.invoiceId) await refresh();
    return item;
  }, [refresh]);

  const updateRecord = useCallback(async (resource, recordId, payload) => {
    if (!resources.includes(resource)) throw new Error('This module is not available.');
    const response = await apiRequest(`/data/${resource}/${recordId}`, { method: 'PUT', body: JSON.stringify(payload) });
    const item = normalize(resource, response.item);
    setRecords(current => ({ ...current, [resource]: (current[resource] || []).map(row => row.id === recordId ? item : row) }));
    return item;
  }, []);

  const deleteRecord = useCallback(async (resource, recordId) => {
    if (!resources.includes(resource)) throw new Error('This module is not available.');
    await apiRequest(`/data/${resource}/${recordId}`, { method: 'DELETE' });
    setRecords(current => ({ ...current, [resource]: (current[resource] || []).filter(row => row.id !== recordId) }));
  }, []);

  const value = useMemo(() => ({ records, loading, error, refresh, createRecord, updateRecord, deleteRecord }), [records, loading, error, refresh, createRecord, updateRecord, deleteRecord]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
