'use client';
import { useEffect, useRef } from 'react';

export default function StripMetrics() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // лёгкая анимация счётчиков
    const el = ref.current; if (!el) return;
    const nums = el.querySelectorAll<HTMLElement>('[data-num]');
    const io = new IntersectionObserver(([e])=>{
      if (!e.isIntersecting) return;
      nums.forEach(n=>{
        const target = n.dataset.num!;
        let cur = 0;
        const end = target.includes('∞') ? 1 : parseInt(target.replace(/\D/g,''),10);
        const step = () => {
          if (target.includes('∞')) { n.textContent = '∞'; return; }
          cur += Math.max(1, Math.floor(end/24));
          if (cur >= end) { n.textContent = target; return; }
          n.textContent = String(cur);
          requestAnimationFrame(step);
        };
        step();
      });
      io.disconnect();
    }, {threshold:0.2});
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="strip reveal" role="presentation">
      <div className="strip__item"><span className="metric" data-num="100+">0</span><span className="label">interactive screens</span></div>
      <div className="strip__item"><span className="metric" data-num="∞">0</span><span className="label">corner cases handled</span></div>
      <div className="strip__item"><span className="metric" data-num="Pre-launch">Pre-launch</span><span className="label">status</span></div>
    </div>
  );
}
