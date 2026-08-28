"use client";

/* eslint-disable @next/next/no-img-element */
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";
import "./product-gallery.css";

type ProductGalleryProps = {
  images: string[];
  productName: string;
  maxZoom?: number;
  desktopHoverZoom?: number;
  compact?: boolean;
};

export function ProductGallery({ images, productName, maxZoom = 4, desktopHoverZoom = 2, compact = false }: ProductGalleryProps) {
  const [active, setActive] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ distance: 0, zoom: 1, x: 0, y: 0 });
  const closeRef = useRef<HTMLButtonElement>(null);

  const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };
  const show = (index: number) => { resetView(); setActive(index); };
  const close = () => { setActive(null); resetView(); };
  const move = (direction: number) => {
    if (active === null) return;
    resetView();
    setActive((active + direction + images.length) % images.length);
  };

  useEffect(() => {
    if (active === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; removeEventListener("keydown", onKey); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gesture.current = { distance: 0, zoom, x: offset.x, y: offset.y };
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const previous = pointers.current.get(event.pointerId)!;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length > 1) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (!gesture.current.distance) gesture.current.distance = distance;
      setZoom(Math.min(maxZoom, Math.max(1, gesture.current.zoom * distance / gesture.current.distance)));
    } else if (zoom > 1) {
      setOffset(({ x, y }) => ({ x: x + event.clientX - previous.x, y: y + event.clientY - previous.y }));
    }
  };

  const pointerUp = (event: PointerEvent<HTMLDivElement>) => pointers.current.delete(event.pointerId);

  return <>
    <div className={`store-gallery ${compact ? "store-gallery-compact" : ""}`}>
      <p className="store-gallery-hint"><ZoomIn /> Tap image to zoom</p>
      {images.map((image, index) => <button key={image} className="store-gallery-image" onClick={() => show(index)} aria-label={`Zoom ${productName}${index ? ` detail ${index + 1}` : ""}`} style={{ "--hover-zoom": desktopHoverZoom } as React.CSSProperties} onMouseMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--zoom-x", `${(event.clientX - box.left) / box.width * 100}%`); event.currentTarget.style.setProperty("--zoom-y", `${(event.clientY - box.top) / box.height * 100}%`); }}><img src={image} alt={index === 0 ? productName : `${productName} detail ${index + 1}`} /><span><ZoomIn /> Tap or click to zoom</span></button>)}
    </div>
    {active !== null && <div className="store-lightbox" role="dialog" aria-modal="true" aria-label={`${productName} image viewer`}>
      <header><span>{active + 1} / {images.length}</span><button ref={closeRef} onClick={close} aria-label="Close image viewer"><X /></button></header>
      <div className="store-lightbox-stage" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onDoubleClick={() => { setZoom(zoom > 1 ? 1 : 2); setOffset({ x: 0, y: 0 }); }}>
        <img src={images[active]} alt={`${productName}, enlarged view ${active + 1}`} draggable={false} style={{ transform: `translate3d(${offset.x}px,${offset.y}px,0) scale(${zoom})` }} />
      </div>
      {images.length > 1 && <><button className="store-lightbox-prev" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft /></button><button className="store-lightbox-next" onClick={() => move(1)} aria-label="Next image"><ChevronRight /></button></>}
      <footer>Pinch or double-tap to zoom</footer>
    </div>}
  </>;
}
