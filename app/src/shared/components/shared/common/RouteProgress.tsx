'use client';
import { useEffect, useRef, useState } from 'react';

export default function RouteProgress(){
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let endTid: number | undefined;
    const start = () => {
      setActive(true);
      if (bar.current) bar.current.style.width = '15%';
      requestAnimationFrame(()=>{ if (bar.current) bar.current.style.width = '55%'; });
    };
    const done = () => {
      if (bar.current) bar.current.style.width = '100%';
      endTid = window.setTimeout(() => { setActive(false); if (bar.current) bar.current.style.width = '0%'; }, 350);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const external = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#');
      if (external) return;
      start(); setTimeout(done, 700);
    };
    document.addEventListener('click', onClick, true);
    return () => { document.removeEventListener('click', onClick, true); if (endTid) clearTimeout(endTid); };
  }, []);

  return (
    <div className="route-progress" aria-hidden={!active} style={{opacity: active ? 1 : 0}}>
      <div className="route-progress__bar" ref={bar}/>
    </div>
  );
}
