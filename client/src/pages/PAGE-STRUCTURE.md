# SPYRIX INVOICE — page folder map

All user-facing page folders live together in this `pages/` directory. Each page keeps its JSX entry/component, page-scoped CSS, and its own `page.config.js` (page-specific JavaScript settings) together in that folder. Page-specific helpers such as `invoiceDesign.js` also stay beside the page that uses them. This makes it easy to change one page's copy, styling, or configuration without editing another page.

| Page / tab | Folder | Main editable files |
|---|---|---|
| Intro | `Intro/` | `IntroPage.jsx`, `IntroPage.css`, `page.config.js`, `IntroDocument.html` |
| Login / Register | `Auth/` | `AuthPage.jsx`, `AuthPage.css`, `page.config.js` |
| Dashboard | `Dashboard/` | `DashboardPage.jsx`, `DashboardPage.css`, `DashboardTheme.css`, `page.config.js`, `components/` |
| Invoice overview / register | `Invoices/` | `InvoicesPage.jsx`, `InvoicesPage.css`, `page.config.js`, `invoiceDesign.js` |
| Unified Invoice Studio | `InvoiceCreator/` | `InvoiceCreatorPage.jsx`, `InvoiceCreatorPage.css`, `XenmarkInvoicePreview.jsx`, `invoiceExport.js` |
| Templates | `Templates/` | `TemplatesPage.jsx`, `TemplatesPage.css`, `TemplateSelection.jsx`, `page.config.js` (editing lives in Invoice Studio) |
| Quotations | `Quotations/` | `QuotationsPage.jsx`, `QuotationsPage.css`, `page.config.js`|
| Notes | `Notes/` | `NotesPage.jsx`, `NotesPage.css` |
| Customers | `Customers/` | `CustomersPage.jsx`, `CustomersPage.css`, `components/`, `CustomerForm/`, `page.config.js`|
| Products | `Products/` | `ProductsPage.jsx`, `ProductsPage.css`, `page.config.js`|
| Inventory | `Inventory/` | `InventoryPage.jsx`, `InventoryPage.css`, `page.config.js`|
| Payments | `Payments/` | `PaymentsPage.jsx`, `PaymentsPage.css`, `page.config.js`|
| Expenses | `Expenses/` | `ExpensesPage.jsx`, `ExpensesPage.css`, `page.config.js`|
| Reports | `Reports/` | `ReportsPage.jsx`, `ReportsPage.css`, `page.config.js`|
| Calendar | `Calendar/` | `CalendarPage.jsx`, `CalendarPage.css`, `page.config.js`|
| Recurring | `Recurring/` | `RecurringPage.jsx`, `RecurringPage.css`, `page.config.js`|
| Documents | `Documents/` | `DocumentsPage.jsx`, `DocumentsPage.css`, `page.config.js`|
| Notifications | `Notifications/` | `NotificationsPage.jsx`, `NotificationsPage.css`, `page.config.js`|
| Downloads | `Downloads/` | `DownloadsPage.jsx`, `DownloadsPage.css`, `page.config.js`|
| Backup & Restore | `Backups/` | `BackupsPage.jsx`, `BackupsPage.css`, `page.config.js`|
| Import Data | `Imports/` | `ImportsPage.jsx`, `ImportsPage.css`, `page.config.js`|
| Business Settings | `BusinessSettings/` | `BusinessSettingsPage.jsx`, `BusinessSettingsPage.css`, `page.config.js`|
| Account Settings | `AccountSettings/` | `AccountSettingsPage.jsx`, `AccountSettingsPage.css`, `page.config.js`|
| Help | `Help/` | `HelpPage.jsx`, `HelpPage.css`, `page.config.js`|
| Tools | `Tools/` | `ToolsPage.jsx`, `ToolsPage.css`, `page.config.js`|

## Where shared code belongs

`components/`, `context/`, `data/`, `api.js` and `styles.css` at `client/src/` contain app-wide shell, authentication, database state, API and design tokens. `pages/shared/ModulePage/` is a shared record-management engine used by several tabs to keep validation and CRUD behaviour consistent. It is not a page. Keep page-specific visual changes in the matching page folder.
