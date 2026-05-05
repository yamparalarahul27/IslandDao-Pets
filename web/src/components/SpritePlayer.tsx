"use client";

import { useEffect, useRef, useState } from "react";
import { ATLAS_SPEC, ROW_SPECS } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  state?: string;
  fps?: number;
  size?: number;
  className?: string;
};

export function SpritePlayer({
  src,
  state = "idle",
  fps = 10,
  size = 192,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!src) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rowIndex = Math.max(
      0,
      ROW_SPECS.findIndex((r) => r.state === state),
    );
    const row = ROW_SPECS[rowIndex] ?? ROW_SPECS[0];
    const { cellWidth, cellHeight } = ATLAS_SPEC;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoaded(true);
    img.onerror = () => setErrored(true);
    img.src = src;

    let frame = 0;
    let raf = 0;
    let last = 0;

    const draw = (now: number) => {
      if (!last) last = now;
      const delta = now - last;
      if (delta >= 1000 / fps) {
        last = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (img.complete && img.naturalWidth) {
          const sx = frame * cellWidth;
          const sy = rowIndex * cellHeight;
          const dWidth = size * dpr;
          const dHeight = size * dpr;
          ctx.drawImage(
            img,
            sx,
            sy,
            cellWidth,
            cellHeight,
            0,
            0,
            dWidth,
            dHeight,
          );
          frame = (frame + 1) % row.frames;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [src, state, fps, size]);

  if (!src || errored) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed bg-muted/40 text-xs text-muted-foreground",
          className,
        )}
        style={{ width: size, height: size }}
      >
        no sprite
      </div>
    );
  }

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="block" />
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-md bg-muted/50" />
      )}
    </div>
  );
}
