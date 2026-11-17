import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'recurring',
  className: 'recurring-page',
  title: 'Recurring Invoices',
});
const pageStyles = String.raw`/* Recurring only. Add selectors here without affecting other modules. */
.recurring-page {
  --page-local-accent: var(--accent);
}
`;

export default function RecurringPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
