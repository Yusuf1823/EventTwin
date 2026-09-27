import { useState, useEffect, useCallback } from 'react';

export function useSpotlightRect(selector: string, isActive: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!selector || !isActive) return;
    const el = document.querySelector(selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [selector, isActive]);

  useEffect(() => {
    if (!isActive) {
      setRect(null);
      return;
    }
    
    measure();
    
    let rafId: number;
    const poll = () => {
      measure();
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isActive, measure]);

  return rect;
}
