"use client";

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Art } from '../lib/assets';

/** A clipped source rectangle, with no derived files and one cached URL per sheet. */
export function SheetRegion({ art, className = '', priority = false, decorative = false }: { art: Art; className?: string; priority?: boolean; decorative?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(priority);
  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  const [x, y, w, h] = art.region ?? [0, 0, art.width, art.height];
  return <span ref={ref} className={`sheet-region ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
    {visible && <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid slice" role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : art.label} aria-hidden={decorative || undefined}>
      <image href={art.src} width={art.width} height={art.height} />
    </svg>}
  </span>;
}

export function Artwork({ art, className = '', priority = false, decorative = false, sizes = '(max-width: 640px) 100vw, 450px' }: { art: Art; className?: string; priority?: boolean; decorative?: boolean; sizes?: string }) {
  if (art.region) return <SheetRegion art={art} className={className} priority={priority} decorative={decorative} />;
  return <span className={`artwork ${className}`}><Image src={art.src} alt={decorative ? '' : art.label} fill priority={priority} sizes={sizes} className="art-image" /></span>;
}

export function RPGBackground({ art, className = '', priority = false }: { art: Art; className?: string; priority?: boolean }) {
  return <div className={`realm-background ${className}`} aria-hidden="true"><Artwork art={art} priority={priority} decorative sizes="(max-width: 760px) 100vw, (max-width: 1000px) 70vw, 60vw" /><span className="realm-overlay" /></div>;
}
