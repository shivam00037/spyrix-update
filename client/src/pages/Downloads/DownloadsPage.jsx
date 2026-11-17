import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'downloads',
  className: 'downloads-page',
  title: 'Downloads',
});
const pageStyles = String.raw`/* Downloads only. Add selectors here without affecting other modules. */
.downloads-page {
  --page-local-accent: var(--accent);
}
`;

export default function DownloadsPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
