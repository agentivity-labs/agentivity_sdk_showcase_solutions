import { useEffect, useState } from 'react';

/**
 * The layout the window calls for — it follows the window as it is resized (or a tablet is
 * rotated), never only the size it had at load. Mirrors the Trip Manager showcase's hook
 * exactly: phone → the team is a screen of its own; tablet/desktop → the team is an optional
 * side panel next to the chat, split by a draggable divider (see App.tsx's team dock).
 */
export type Layout = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN = 720;
const DESKTOP_MIN = 1100;

const layoutFor = (width: number): Layout => (width >= DESKTOP_MIN ? 'desktop' : width >= TABLET_MIN ? 'tablet' : 'mobile');

export function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>(() => layoutFor(window.innerWidth));

  useEffect(() => {
    const tablet = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const desktop = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const update = () => setLayout(layoutFor(window.innerWidth));
    tablet.addEventListener('change', update);
    desktop.addEventListener('change', update);
    update();
    return () => {
      tablet.removeEventListener('change', update);
      desktop.removeEventListener('change', update);
    };
  }, []);

  return layout;
}
