import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'backups',
  className: 'backups-page',
  title: 'Backup & Restore',
});
const pageStyles = String.raw`/* Backups only. Add selectors here without affecting other modules. */
.backups-page {
  --page-local-accent: var(--accent);
}
`;

export default function BackupsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
