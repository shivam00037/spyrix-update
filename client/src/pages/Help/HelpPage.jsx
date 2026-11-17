import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'help',
  className: 'help-page',
  title: 'Help & Support',
});
const pageStyles = String.raw`/* Help only. Add selectors here without affecting other modules. */
.help-page {
  --page-local-accent: var(--accent);
}
`;

export default function HelpPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
