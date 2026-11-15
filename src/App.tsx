import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectDossier } from './components/ConnectDossier';
import { LiquidConnectButton } from './components/LiquidConnectButton';
import { MeteorSwipeButton } from './components/MeteorSwipeButton';
import { PlanetCanvas } from './components/PlanetCanvas';
import { ScientificDossier } from './components/ScientificDossier';
import {
  ALL_PLANET_IDS,
  getNextPlanetId,
  OUTER_PLANET_ORDER,
  PLANET_ORDER,
  PlanetId,
  PLANETS,
} from './data/planets';

const IDLE_AUTO_TRANSITION_MS = 3000;

export default function App() {
  const [pageMode, setPageMode] = useState<'home' | 'connect'>(() =>
    typeof window !== 'undefined' && window.location.hash === '#lets-connect'
      ? 'connect'
      : 'home'
  );
  const [homePlanet, setHomePlanet] = useState<PlanetId>('earth');
  const [connectPlanet, setConnectPlanet] = useState<PlanetId>('saturn');

  const lastActivityRef = useRef<number>(performance.now());
  const activeOrder = pageMode === 'home' ? PLANET_ORDER : OUTER_PLANET_ORDER;
  const activePlanet = pageMode === 'home' ? homePlanet : connectPlanet;

  useEffect(() => {
    const syncHash = () => {
      setPageMode(window.location.hash === '#lets-connect' ? 'connect' : 'home');
    };
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const navigateToMode = useCallback((mode: 'home' | 'connect') => {
    setPageMode(mode);
    if (mode === 'connect') {
      window.location.hash = 'lets-connect';
    } else if (window.location.hash === '#lets-connect') {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const advanceActivePlanet = useCallback(
    (direction: 'left' | 'right') => {
      if (pageMode === 'home') {
        setHomePlanet((prev) => getNextPlanetId(prev, direction, PLANET_ORDER));
      } else {
        setConnectPlanet((prev) => getNextPlanetId(prev, direction, OUTER_PLANET_ORDER));
      }
    },
    [pageMode]
  );

  const triggerInstantSwipe = useCallback(
    (direction: 'left' | 'right') => {
      lastActivityRef.current = performance.now();
      advanceActivePlanet(direction);
    },
    [advanceActivePlanet]
  );

  // 3-second idle auto-transition timer (Home: Earth -> Mars -> Moon; Connect: Saturn -> Uranus -> Neptune)
  useEffect(() => {
    const resetIdle = () => {
      lastActivityRef.current = performance.now();
    };

    window.addEventListener('pointerdown', resetIdle, { passive: true });
    window.addEventListener('pointermove', resetIdle, { passive: true });
    window.addEventListener('wheel', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', resetIdle);
      window.removeEventListener('pointermove', resetIdle);
      window.removeEventListener('wheel', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('scroll', resetIdle, { capture: true });
    };
  }, []);

  useEffect(() => {
    lastActivityRef.current = performance.now();

    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - lastActivityRef.current;
      if (elapsed >= IDLE_AUTO_TRANSITION_MS) {
        lastActivityRef.current = performance.now();
        advanceActivePlanet('right');
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [activePlanet, pageMode, advanceActivePlanet]);

  // Keyboard navigation (Left / Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        triggerInstantSwipe('left');
      } else if (e.key === 'ArrowRight') {
        triggerInstantSwipe('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerInstantSwipe]);

  const currentPlanet = PLANETS[activePlanet];
  const nextPlanetId = getNextPlanetId(activePlanet, 'left', activeOrder);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#05070d] text-slate-100 lg:h-screen lg:overflow-hidden">
        {/* Layered Full-Viewport Planetary Close-up Background Photos */}
        <div
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05070d]"
          aria-hidden="true"
        >
          {ALL_PLANET_IDS.map((id) => {
            const item = PLANETS[id];
            const isCurrent = id === activePlanet;
            return (
              <img
                key={id}
                src={item.backgroundImage}
                alt={item.backgroundAlt}
                referrerPolicy="no-referrer"
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1600ms] ease-out ${
                  isCurrent ? 'opacity-75 scale-100' : 'opacity-0 scale-[1.03]'
                }`}
                style={{ transitionProperty: 'opacity, transform' }}
              />
            );
          })}

          {/* Measured Contrast Scrim (crossfades smoothly as description panel moves right <-> left) */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              pageMode === 'home' ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background:
                'linear-gradient(90deg, rgba(5, 7, 13, 0.42) 0%, rgba(5, 7, 13, 0.24) 48%, rgba(5, 7, 13, 0.56) 100%)',
            }}
          />
          <div
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              pageMode === 'connect' ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background:
                'linear-gradient(90deg, rgba(5, 7, 13, 0.58) 0%, rgba(5, 7, 13, 0.24) 52%, rgba(5, 7, 13, 0.42) 100%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#05070d]/80 to-transparent" />
        </div>

      {/* Top Center Project Name + Top Right Fluid Let's Connect Button */}
      <header className="relative z-20 grid w-full shrink-0 grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 bg-[#05070d]/45 px-4 py-4 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
        <div className="hidden sm:block" aria-hidden="true" />

        <div className="flex flex-col items-start justify-center sm:items-center">
          <h1 className="font-display bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-bold tracking-[0.28em] uppercase text-transparent sm:text-3xl whitespace-nowrap">
            SOLARIES
          </h1>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-slate-300">
            {activeOrder.map((id, idx) => {
              const p = PLANETS[id];
              const isSelected = id === activePlanet;
              return (
                <span key={id} className="flex items-center gap-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 transition-colors duration-300 ${
                      isSelected ? 'font-semibold text-white' : 'text-slate-400'
                    }`}
                  >
                    {isSelected && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: p.accentHex }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="font-mono-tabular text-[10px] opacity-75">
                      {p.indexLabel}
                    </span>
                    <span>{p.name}</span>
                  </span>
                  {idx < activeOrder.length - 1 && (
                    <span className="text-slate-600" aria-hidden="true">
                      /
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0">
          <LiquidConnectButton
            mode={pageMode}
            onClick={() => navigateToMode(pageMode === 'home' ? 'connect' : 'home')}
          />
        </div>
      </header>

      {/* Main Split Workspace: Smoothly Swaps 3D Planet Stage (Left <-> Right) and Description Panel (Right <-> Left) */}
      <main
        className={`relative z-10 flex w-full flex-1 flex-col lg:min-h-0 ${
          pageMode === 'connect' ? 'lg:flex-row-reverse' : 'lg:flex-row'
        }`}
      >
        {/* 3D Orbital Planet Stage */}
        <motion.section
          layout="position"
          transition={{
            layout: { duration: 0.78, ease: [0.22, 1, 0.36, 1] },
          }}
          aria-label="Interactive 3D Planetary Viewport"
          className={`relative flex w-full flex-1 items-center justify-center lg:h-full ${
            pageMode === 'connect'
              ? 'h-[62vh] min-h-[460px] sm:h-[640px]'
              : 'h-[520px] sm:h-[580px]'
          }`}
        >
          {/* Large Rotating 3D Model Canvas */}
          <div className="relative h-full w-full">
            <PlanetCanvas
              activePlanet={activePlanet}
              pageMode={pageMode}
              meteorTransit={null}
              onSwipeGesture={triggerInstantSwipe}
            />
          </div>

          {/* Invisible & Transparent Instant Left Swipe Option */}
          <div className="absolute left-3 top-1/2 z-30 -translate-y-1/2 sm:left-8 xl:left-12">
            <MeteorSwipeButton
              direction="left"
              targetPlanetId={nextPlanetId}
              onClick={() => triggerInstantSwipe('left')}
            />
          </div>
        </motion.section>

        {/* Transparent Description Panel (Glides smoothly from Right to Left in Connect View) */}
        <motion.div
          layout="position"
          transition={{
            layout: { duration: 0.78, ease: [0.22, 1, 0.36, 1] },
          }}
          className="w-full shrink-0 lg:h-full lg:w-[440px] xl:w-[490px]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {pageMode === 'home' ? (
              <motion.div
                key="home-dossier"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full"
              >
                <ScientificDossier
                  planet={currentPlanet}
                  isTransitPending={false}
                  transitTargetName={null}
                  remainingSeconds={0}
                />
              </motion.div>
            ) : (
              <motion.div
                key="connect-dossier"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="h-full w-full"
              >
                <ConnectDossier />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      </div>
    </MotionConfig>
  );
}
