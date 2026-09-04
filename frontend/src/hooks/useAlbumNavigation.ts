import { useCallback, useMemo, useState } from 'react';
import type { AlbumPage } from '../types/album';

export function useAlbumNavigation(pages: AlbumPage[]) {
  const [spread, setSpread] = useState(0);
  const totalSpreads = Math.ceil(pages.length / 2);
  const currentPages = useMemo(() => pages.slice(spread * 2, spread * 2 + 2), [pages, spread]);
  const previous = useCallback(() => setSpread((value) => Math.max(0, value - 1)), []);
  const next = useCallback(() => setSpread((value) => Math.min(Math.max(0, totalSpreads - 1), value + 1)), [totalSpreads]);

  return {
    currentPages,
    spread,
    totalSpreads,
    canGoPrevious: spread > 0,
    canGoNext: spread < totalSpreads - 1,
    previous,
    next,
  };
}
