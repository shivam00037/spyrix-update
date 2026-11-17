import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'imports',
  className: 'imports-page',
  title: 'Import Data',
});
const pageStyles = String.raw`/* Imports only. Add selectors here without affecting other modules. */
.imports-page {
  --page-local-accent: var(--accent);
}
`;

export default function ImportsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
