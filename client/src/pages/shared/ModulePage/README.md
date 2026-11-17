# Shared Module Page Engine

- `ModulePage.jsx` — shared record, form, table and settings behaviours.
- `ModuleActionGrid.jsx` — shared module shortcuts and actions.
- `ModuleActionGrid.css` — action-grid styles.
- `modulePage.config.js` — shared workspace theme defaults and choices.

Each visible tab still has its own folder with a page JSX entry, matching CSS file and its own `page.config.js`. Edit the page folder first for page-specific branding and composition; edit this shared engine only when a behaviour is intentionally common to multiple tabs.
