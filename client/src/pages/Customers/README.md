# Customer CRM

- `CustomersPage.jsx` is the page entry and `CustomersPage.css` contains scoped visual overrides.
- `components/CustomerPicker.jsx` searches saved customers by name, customer ID, company, email, phone and GSTIN.
- The shared customer form captures contact, company, billing/shipping, location, GST/PAN, payment terms and custom fields.
- IDs are generated as `CUS-...` and stored with the customer record.
- The API enforces business workspace ownership and stores records through `server/src/routes/data.js` and `server/src/models/Customer.js`.
- Invoice creation uses the selected customer record and stores a snapshot on the invoice for historical accuracy.

- `page.config.js` — this page folder’s JavaScript configuration (page identity, route or copy settings).
