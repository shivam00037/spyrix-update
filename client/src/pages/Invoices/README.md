# Invoice Studio

- `InvoicesPage.jsx` is the route/page entry.
- `InvoicesPage.css` is scoped styling for this tab.
- Invoice-specific design catalogue and browser assets are defined in `invoiceDesign.js`.
- The searchable saved-customer picker lives in `../Customers/components/CustomerPicker.jsx`.
- The common create/edit form currently renders through `../shared/ModulePage/ModulePage.jsx`; the form passes customer, items, custom fields and design snapshots to `DataContext`.
- Server-side customer lookup, item validation and financial calculations are in `server/src/routes/data.js`; persisted shape is in `server/src/models/Invoice.js`.

Issued records retain a customer snapshot and the selected invoice design. Do not edit old invoice snapshots when changing customer master data or future template defaults.

- `page.config.js` — this page folder’s JavaScript configuration (page identity, route or copy settings).

## New invoice editor
- `../InvoiceCreator/InvoiceCreatorPage.jsx` is the dedicated `/app/invoices/new` invoice composer.
- `../InvoiceCreator/InvoiceCreatorPage.css` contains the isolated editor and live A4 preview styling.
- The editor saves draft/issued invoices through `DataContext`, supports existing or newly entered customers, product catalogue selections, editable invoice line items, template styling, logo upload, custom labels, notes, terms, and browser Print / Save as PDF.
- Customer-specific invoice details are stored as an invoice snapshot, while the original customer record remains unchanged.
