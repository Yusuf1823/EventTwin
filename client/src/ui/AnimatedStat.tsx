import React, { useEffect, useRef, useState } from 'react';
import { cn } from './cn';

export const AnimatedStat: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}> = ({ value, suffix = '', prefix = '', decimals = 0, className, duration = 650 }) => {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setShown(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={cn('font-sans font-black tabular-nums tracking-tight', className)}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
};
