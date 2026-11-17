import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, UserRoundPlus } from 'lucide-react';

export default function CustomerPicker({ customers = [], value = '', onSelect, onCreate }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = customers.find(customer => String(customer.id) === String(value));
  useEffect(() => {
    if (selected) setQuery(`${selected.name}${selected.customerCode ? ` · ${selected.customerCode}` : ''}`);
  }, [selected?.id, selected?.name, selected?.customerCode, value]);
  useEffect(() => {
    const closeOnOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, []);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter(customer => !needle || [customer.name, customer.customerCode, customer.companyName, customer.email, customer.phone, customer.gstin].some(item => String(item || '').toLowerCase().includes(needle))).slice(0, 8);
  }, [customers, query]);

  return (
    <div className="customer-picker-wrap" ref={rootRef}>
      <div className="customer-picker-input"><Search size={16}/><input value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); if (value) onSelect(''); }} placeholder="Search customer name, ID, phone or GSTIN" aria-label="Search customers"/><span>{customers.length} saved</span></div>
      {open && <div className="customer-picker-list">
        {filtered.length ? filtered.map(customer => <button type="button" key={customer.id} onClick={() => { onSelect(customer.id, customer); setQuery(`${customer.name}${customer.customerCode ? ` · ${customer.customerCode}` : ''}`); setOpen(false); }}><span className="customer-picker-avatar">{(customer.name || 'C').slice(0,1).toUpperCase()}</span><span className="customer-picker-copy"><strong>{customer.name}</strong><small>{customer.companyName || customer.email || customer.phone || 'Customer'} {customer.customerCode ? `· ${customer.customerCode}` : ''}</small></span>{String(value) === String(customer.id) && <Check size={16}/>}</button>) : <div className="customer-picker-empty">No matching customer. Create a new customer to continue.</div>}
        {onCreate && <button type="button" className="customer-picker-create" onClick={() => { setOpen(false); onCreate(); }}><UserRoundPlus size={16}/> Add a new customer</button>}
      </div>}
    </div>
  );
}
