import { PlanetId, PLANETS } from '../data/planets';

interface MeteorSwipeButtonProps {
  direction: 'left' | 'right';
  targetPlanetId: PlanetId;
  onClick: () => void;
}

export function MeteorSwipeButton({
  direction,
  targetPlanetId,
  onClick,
}: MeteorSwipeButtonProps) {
  const targetPlanet = PLANETS[targetPlanetId];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Swipe ${direction} to ${targetPlanet.name}`}
      className="h-64 w-28 sm:w-36 cursor-pointer bg-transparent border-0 opacity-0 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sky-400/75 rounded-xl"
    />
  );
}
