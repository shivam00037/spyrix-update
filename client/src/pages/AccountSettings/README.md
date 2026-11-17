# AccountSettings

- `AccountSettingsPage.jsx` is this module's dedicated page entry. Change its composition here.
- `AccountSettingsPage.css` contains styles scoped to `.settings-page` so edits do not spill into other pages.
- Shared CRUD state and record validation live in `client/src/pages/shared/ModulePage/ModulePage.jsx` and `client/src/data/DataContext.jsx`.
- API/database rules for this module live in `server/src/routes/data.js` and its Mongoose model.

The shared engine avoids duplicating invoice/customer/payment validation, while the page entry and stylesheet remain isolated for future redesigns.

- `page.config.js` — this page folder’s JavaScript configuration (page identity, route or copy settings).
