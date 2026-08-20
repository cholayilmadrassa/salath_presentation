import { useState, useEffect, useRef } from 'react';

/**
 * Animated number ticker with smooth transitions and cached value support.
 * - Displays non-zero initial values immediately without layout flash or reset.
 * - When target updates (e.g. from cache to background fetch), animates smoothly from current value.
 * - Shows pulsing skeleton only when `isLoading` is true (no cache available).
 */
export default function DigitCountTicker({
  value = 0,
  isLoading = false,
  textColor = 'text-white',
  className = '',
  inline = false,
}) {
  const target = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(() => (isLoading ? 0 : target));
  const currentValRef = useRef(displayValue);
  currentValRef.current = displayValue;

  useEffect(() => {
    if (isLoading) return;

    const startVal = currentValRef.current;
    if (startVal === target) return;

    // Fast animation for small increments, longer for big count jumps
    const isInitialCountUp = startVal === 0 && target > 0;
    const duration = isInitialCountUp ? 1200 : 700;
    const startTime = performance.now();

    let animationFrameId;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextVal = Math.floor(startVal + eased * (target - startVal));
      setDisplayValue(nextVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, isLoading]);

  if (isLoading) {
    if (inline) {
      return (
        <span
          className={`font-black font-mono tracking-wider opacity-30 animate-pulse select-none ${textColor} ${className}`}
        >
          00,000,000
        </span>
      );
    }

    return (
      <div className="py-1 font-mono flex items-center justify-center">
        <span
          className={`text-3xl sm:text-5xl font-black font-mono tracking-wider opacity-30 animate-pulse select-none ${textColor} ${className}`}
        >
          00,000,000
        </span>
      </div>
    );
  }

  if (inline) {
    return (
      <span className={`font-black font-mono ${textColor} ${className}`}>
        {displayValue.toLocaleString('en-IN')}
      </span>
    );
  }

  return (
    <div
      className={`text-3xl sm:text-5xl font-black tracking-tight leading-none py-1 font-mono ${textColor} ${className}`}
    >
      {displayValue.toLocaleString('en-IN')}
    </div>
  );
}
