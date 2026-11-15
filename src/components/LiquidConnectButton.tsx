import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { MouseEvent, useRef, useState } from 'react';

interface WaterRipple {
  id: number;
  x: number;
  y: number;
}

interface LiquidConnectButtonProps {
  mode: 'home' | 'connect';
  onClick: () => void;
}

export function LiquidConnectButton({ mode, onClick }: LiquidConnectButtonProps) {
  const [ripples, setRipples] = useState<WaterRipple[]>([]);
  const nextIdRef = useRef(0);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Fallback to center when triggered via keyboard (Enter / Space)
    const isKeyboard = e.clientX === 0 && e.clientY === 0;
    const x = isKeyboard ? rect.width / 2 : e.clientX - rect.left;
    const y = isKeyboard ? rect.height / 2 : e.clientY - rect.top;

    const rippleId = nextIdRef.current++;
    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 680);

    onClick();
  };

  const isConnectView = mode === 'connect';

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="liquid-water-btn group relative inline-flex min-h-[42px] items-center gap-2 overflow-hidden border border-white/25 bg-transparent px-5 py-2 text-xs font-medium tracking-wide text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-2px_6px_rgba(255,255,255,0.12),0_4px_20px_rgba(0,0,0,0.22)] transition-[border-color,box-shadow] duration-300 hover:border-white/55 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.65),inset_0_-2px_8px_rgba(186,230,253,0.25),0_6px_26px_rgba(186,230,253,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 whitespace-nowrap shrink-0 cursor-pointer"
    >
      {/* Top Water Meniscus Specular Highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-[1px] h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-80"
      />

      {/* Bottom Water Meniscus Refraction Rim */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 bottom-[1px] h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-sky-100/35 to-transparent opacity-70"
      />

      {/* Flowing Clear-Water Internal Caustic */}
      <span
        aria-hidden="true"
        className="liquid-water-caustic pointer-events-none absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.14)_0%,rgba(186,230,253,0.05)_45%,transparent_72%)] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* Hover Wave Sweep */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />

      {/* Click Water Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          style={{ left: ripple.x, top: ripple.y }}
          className="water-ripple-ring pointer-events-none absolute h-12 w-12 rounded-full border border-white/75 bg-white/15"
        />
      ))}

      {isConnectView ? (
        <>
          <ArrowLeft
            className="relative z-10 h-3.5 w-3.5 text-white/90 transition-transform duration-300 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          <span className="relative z-10 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)]">
            Back to Home
          </span>
        </>
      ) : (
        <>
          <span className="relative z-10 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)]">
            Let&apos;s Connect
          </span>
          <ArrowUpRight
            className="relative z-10 h-3.5 w-3.5 text-white/90 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </>
      )}
    </motion.button>
  );
}
