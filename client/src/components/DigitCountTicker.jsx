import { useState, useEffect } from 'react';

/**
 * Animated number ticker that counts up from 0 to `value` with an ease-out curve.
 * Shows a pulse placeholder while `isLoading` is true.
 */
export default function DigitCountTicker({ value, isLoading }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    const target = Number(value) || 0;
    if (target === 0) { setDisplayValue(0); return; }

    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, isLoading]);

  if (isLoading) {
    return (
      <div className="py-1 font-mono flex items-center justify-center">
        <span className="text-3xl sm:text-5xl font-black text-white/30 animate-pulse tracking-wider select-none font-mono">
          00,000,000
        </span>
      </div>
    );
  }

  return (
    <div className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-white py-1 font-mono">
      {displayValue.toLocaleString('en-IN')}
    </div>
  );
}
