// app/src/shared/_components/DeckDialogHost.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import usePdfDemoDialog from '../../modules/core-investors/services/pdf-demo-dialog';

/**
 * Глобальный хост диалога — монтируем В РОДИТЕЛЕ (layout),
 * чтобы оверлей всегда был по центру экрана и не зависел от хедера.
 * Слушает window-событие "open-deck" и открывает диалог.
 */
export default function DeckDialogHost() {
  const pathname = usePathname();
  const isInvestors = /^\/(investors|inversors)(\/|$)/.test(pathname || '');

  const { Dialog, openDialog, bypassIfRemembered } = usePdfDemoDialog({
    url: '/SG-P.pdf',
    
    rememberKey: 'skipDeckWarning',
  });

  useEffect(() => {
    const onOpen = (e: Event) => {
      if (!isInvestors) return;               // строго только на /investors
      if (!bypassIfRemembered()) openDialog(); // если не «Don't show again»
      // если remember стоит, bypassIfRemembered сам откроет окно
    };
    window.addEventListener('open-deck', onOpen as EventListener);
    return () => window.removeEventListener('open-deck', onOpen as EventListener);
  }, [isInvestors, bypassIfRemembered, openDialog]);

  // Рендерим сам диалог на уровне layout (родителя)
  return <>{Dialog}</>;
}
