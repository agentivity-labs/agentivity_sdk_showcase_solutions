import { useRef } from 'react';
import { themes, type PortalTheme } from './themes';

function swatchGradient(t: PortalTheme) {
  return `linear-gradient(135deg, ${t.tokens.accent} 0%, ${t.tokens.paperSoft} 100%)`;
}

/**
 * A single button, not a row of swatches (unlike the Trip Manager showcase's always-visible
 * strip) — opens a small picker dialog on demand. Keeps the header uncluttered while still
 * letting a visitor try every theme in `theme/themes.ts`, same underlying mechanism as the Trip
 * Manager showcase (`useTheme`'s `setThemeId`, persisted per browser).
 */
export function ThemeSwitcher({ activeId, onChange }: { activeId: string; onChange: (id: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="portal-icon-btn"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Choose visual style"
        title="Choose visual style"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="9" cy="10" r="1.3" fill="currentColor" />
          <circle cx="14.5" cy="9" r="1.3" fill="currentColor" />
          <circle cx="15.5" cy="14" r="1.3" fill="currentColor" />
          <path d="M12 3.5c.7 1.6-1 2.6-1 4a1.8 1.8 0 0 0 1.8 1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      <dialog ref={dialogRef} className="portal-theme-dialog" onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}>
        <p className="portal-theme-dialog__title">Choose a style</p>
        <div className="portal-theme-dialog__list" role="radiogroup" aria-label="Visual style">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={t.id === activeId}
              className="portal-theme-option"
              data-active={t.id === activeId || undefined}
              onClick={() => {
                onChange(t.id);
                dialogRef.current?.close();
              }}
            >
              <span className="portal-theme-option__swatch" style={{ background: swatchGradient(t) }} />
              {t.name}
              {t.id === activeId && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </dialog>
    </>
  );
}
