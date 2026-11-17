import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'expenses',
  className: 'expenses-page',
  title: 'Expenses',
});
const pageStyles = String.raw`/* Expenses only. Add selectors here without affecting other modules. */
.expenses-page {
  --page-local-accent: var(--accent);
}
`;

export default function ExpensesPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
