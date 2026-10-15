"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type View = 'home' | 'workflow';
type Destination = 'top' | 'demo' | 'ai';
type TransitionDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
export function useLandingView() {
  const [view, setView] = useState<View>('home');
  const busy = useRef(false);
  const moveTo = useCallback((destination: Destination, smooth = false) => {
    const target = document.getElementById(destination === 'demo' ? 'book-demo' : destination === 'ai' ? 'cases-video' : 'top');
    const top = destination !== 'top' && target ? target.getBoundingClientRect().top + window.scrollY - 24 : 0;
    window.scrollTo({ top, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' as ScrollBehavior });
    if (destination === 'demo') target?.querySelector<HTMLInputElement>('input[type=email]')?.focus({ preventScroll: true });
  }, []);
  const navigate = useCallback((next: View, destination: Destination = 'top') => {
    if (busy.current) return;
    const url = new URL(location.href);
    if (next === 'workflow') url.searchParams.set('view', 'workflow'); else url.searchParams.delete('view');
    url.hash = destination === 'demo' ? 'book-demo' : destination === 'ai' ? 'cases-video' : '';
    history.pushState({}, '', url);
    if (view === next) { moveTo(destination, true); return; }
    busy.current = true;
    const update = () => { flushSync(() => setView(next)); moveTo(destination === 'ai' ? 'top' : destination); };
    const finish = () => { busy.current = false; if (destination === 'ai') moveTo(destination, true); };
    const doc = document as TransitionDocument;
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void doc.startViewTransition(update).finished.catch(() => {}).finally(finish);
    } else { update(); finish(); }
  }, [view, moveTo]);
  useEffect(() => {
    let frame = 0;
    const restore = () => {
      const next = new URL(location.href).searchParams.get('view') === 'workflow' ? 'workflow' : 'home';
      setView(next);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (next === 'workflow' && location.hash === '#cases-video') moveTo('ai');
          if (next === 'home' && location.hash === '#book-demo') moveTo('demo');
        });
      });
    };
    restore(); window.addEventListener('popstate', restore);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('popstate', restore); };
  }, [moveTo]);
  return { view, openWorkflow: () => navigate('workflow'), openAI: () => navigate('workflow', 'ai'), openHome: () => navigate('home'), openDemo: () => navigate('home', 'demo') };
}
