/** One glyph per entity kind — a quick visual anchor down a list, not a literal icon set. Shared by the Solutions and History screens. */
export function KindIcon({ kind }: { kind: string }) {
  if (kind === 'team') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.5" cy="11" r="2.6" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 19c0-2.9 2.24-5.2 5-5.2s5 2.3 5 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M14.5 19c0-2-1.4-3.7-3.2-4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'workflow') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="4.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14.5" y="13.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9.5 7.5h4a3 3 0 0 1 3 3v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M14 11.5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v3.2M12 3l2.4 2.4M12 3L9.6 5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="8" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9.5" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="13.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
