// app/components/SpaceCursor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function SpaceCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const lastTrailTime = useRef(0);

  useEffect(() => {
    // Evita il cursore custom su device touch / senza hover
    const hasHover = window.matchMedia('(hover: hover)').matches;
    if (!hasHover) return;

    const createTrail = (x: number, y: number) => {
      const trail = document.createElement('div');
      trail.className = 'space-cursor-trail';
      trail.style.left = `${x}px`;
      trail.style.top = `${y}px`;
      document.body.appendChild(trail);
      // rimozione dopo la durata dell’animazione
      setTimeout(() => trail.remove(), 500);
    };

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      // Heuristics per capire se mostrare “modalità pointer”
      const target = e.target as HTMLElement | null;
      const clickable =
        !!target?.closest('a,button,[role="button"],[data-cursor="pointer"]') ||
        window.getComputedStyle(target as Element).cursor === 'pointer';

      setIsPointer(clickable);

      // Throttle trail
      const now = Date.now();
      if (now - lastTrailTime.current > 30) {
        lastTrailTime.current = now;
        createTrail(e.clientX, e.clientY);
      }
    };

    const onLeave = () => setVisible(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [visible]);

  // Non renderizzare su device senza hover (SSR-safe)
  if (typeof window !== 'undefined' && !window.matchMedia('(hover: hover)').matches) {
    return null;
  }

  return (
    // NIENTE div interno: il cerchio è disegnato via ::before nel CSS
    <div
      className="space-cursor"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${isPointer ? 1.8 : 1.2})`,
      }}
    />
  );
}
