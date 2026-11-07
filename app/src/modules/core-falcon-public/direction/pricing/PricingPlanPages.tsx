'use client';

import { useRef, useState, type ReactNode } from 'react';
import styles from './pricing.module.css';

export function PricingPlanPages({ children, label, plans }: {
  children: ReactNode;
  label: string;
  plans: readonly string[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  function syncPage(track: HTMLDivElement) {
    let closestPage = 0;
    let closestDistance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - track.scrollLeft);
      if (distance < closestDistance) {
        closestPage = index;
        closestDistance = distance;
      }
    });
    setActivePage(closestPage);
  }

  function goToPage(index: number) {
    const track = trackRef.current;
    const card = track?.children.item(index) as HTMLElement | null | undefined;
    if (track && card) track.scrollTo({ left: card.offsetLeft });
  }

  return <>
    <div className={styles.grid} id="pricing-plan-cards" ref={trackRef} onScroll={event => syncPage(event.currentTarget)}>
      {children}
    </div>
    <div className={styles.pager} role="group" aria-label={label}>
      {plans.map((name, index) => <button
        key={name}
        type="button"
        aria-label={name}
        aria-controls="pricing-plan-cards"
        aria-current={activePage === index ? 'true' : undefined}
        onClick={() => goToPage(index)}
      />)}
    </div>
  </>;
}
