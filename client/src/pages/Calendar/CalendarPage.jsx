import ModulePage from '../shared/ModulePage/ModulePage';

// SINGLE-FILE PAGE EDITING:
// Edit this file for this page's settings, content and page-specific styling.
const pageConfig = Object.freeze({
  section: 'calendar',
  className: 'calendar-page',
  title: 'Calendar',
});
const pageStyles = String.raw`/* Calendar only. Add selectors here without affecting other modules. */
.calendar-page {
  --page-local-accent: var(--accent);
}
`;

export default function CalendarPage() {
  return (
    <>
      <style>{pageStyles}</style>
      <ModulePage sectionOverride={pageConfig.section} pageClassName={pageConfig.className} />
    </>
  );
}
