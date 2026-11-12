'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { landingThemeKey, resolveLandingTheme, type LandingTheme } from './model';

const useThemeLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const ThemeContext = createContext({ theme: 'dark' as LandingTheme, ready: false, toggle: () => {} });
const documentThemeOwners = new WeakMap<HTMLElement, { previous: string | null; owners: Set<symbol> }>();

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<LandingTheme>('dark');
  const [ready, setReady] = useState(false);
  useThemeLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('data-falcon-landing-theme');
    const owner = Symbol('landing-theme');
    const ownership = documentThemeOwners.get(root) ?? { previous, owners: new Set<symbol>() };
    ownership.owners.add(owner);
    documentThemeOwners.set(root, ownership);
    let preference = previous;
    try { preference = localStorage.getItem(landingThemeKey) ?? previous; } catch { /* Private browsing. */ }
    const initial = resolveLandingTheme(preference);
    document.documentElement.setAttribute('data-falcon-landing-theme', initial);
    setTheme(initial);
    setReady(true);
    function synchronize(event: StorageEvent) {
      if (event.key !== landingThemeKey) return;
      const value = resolveLandingTheme(event.newValue);
      document.documentElement.setAttribute('data-falcon-landing-theme', value);
      setTheme(value);
    }
    window.addEventListener('storage', synchronize);
    return () => {
      window.removeEventListener('storage', synchronize);
      // Route transitions may mount the next landing before tearing down this
      // one. Keep its selected theme; restore the original document only once.
      ownership.owners.delete(owner);
      if (ownership.owners.size !== 0) return;
      documentThemeOwners.delete(root);
      if (ownership.previous === null) root.removeAttribute('data-falcon-landing-theme');
      else root.setAttribute('data-falcon-landing-theme', ownership.previous);
    };
  }, []);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-falcon-landing-theme', next);
    try { localStorage.setItem(landingThemeKey, next); } catch { /* Browsing without storage still works. */ }
    setTheme(next);
  }
  return <ThemeContext.Provider value={{ theme, ready, toggle }}>{children}</ThemeContext.Provider>;
}

export const useLandingTheme = () => useContext(ThemeContext);

