import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'documents',
  className: 'documents-page',
  title: 'Documents',
});
const pageStyles = String.raw`/* Documents only. Add selectors here without affecting other modules. */
.documents-page {
  --page-local-accent: var(--accent);
}
`;

export default function DocumentsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
