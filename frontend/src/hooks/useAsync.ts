import { useCallback, useEffect, useState } from 'react';
export function useAsync<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: string }>({ loading: true });
  const run = useCallback(async () => { setState({ loading: true }); try { setState({ data: await loader(), loading: false }); } catch (e) { setState({ loading: false, error: e instanceof Error ? e.message : 'Error inesperado.' }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => { void run(); }, [run]); return { ...state, reload: run };
}
