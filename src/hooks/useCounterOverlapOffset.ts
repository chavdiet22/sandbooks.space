import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface UseCounterOverlapOffsetOptions {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  tagsBarRef: RefObject<HTMLDivElement | null>;
  counterRef: RefObject<HTMLDivElement | null>;
  padding?: number;
  enabled?: boolean;
}

/**
 * Detects overlap between a fixed-position counter and a scrollable tags bar,
 * applying transform offset to prevent visual collision.
 *
 * Uses direct DOM manipulation (no React re-renders) for scroll performance.
 */
export const useCounterOverlapOffset = ({
  scrollContainerRef,
  tagsBarRef,
  counterRef,
  padding = 12,
  enabled = true,
}: UseCounterOverlapOffsetOptions): void => {
  const rafRef = useRef<number | null>(null);
  const lastOffsetRef = useRef<number>(0);

  const calculateOffset = useCallback(() => {
    const tagsBar = tagsBarRef.current;
    const counter = counterRef.current;

    if (!tagsBar || !counter || !enabled) {
      // Reset if disabled or refs unavailable
      if (counter && lastOffsetRef.current !== 0) {
        counter.style.transform = '';
        lastOffsetRef.current = 0;
      }
      return;
    }

    // Get viewport-relative positions
    const tagsRect = tagsBar.getBoundingClientRect();
    const counterRect = counter.getBoundingClientRect();

    // Calculate overlap: how much counter's bottom intrudes past tags' top
    const counterBottom = counterRect.bottom;
    const tagsTop = tagsRect.top;

    let offset = 0;
    // Only apply offset if tags bar is visible in viewport
    if (tagsRect.top < window.innerHeight && counterBottom > tagsTop - padding) {
      offset = counterBottom - tagsTop + padding;
    }

    // Only update if offset changed significantly (avoid jitter)
    if (Math.abs(offset - lastOffsetRef.current) > 0.5) {
      lastOffsetRef.current = offset;
      counter.style.transform = offset > 0 ? `translateY(-${offset}px)` : '';
    }
  }, [tagsBarRef, counterRef, padding, enabled]);

  // Throttled calculation using requestAnimationFrame
  const scheduleCalculation = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      calculateOffset();
    });
  }, [calculateOffset]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const tagsBar = tagsBarRef.current;
    const counter = counterRef.current;

    if (!enabled) {
      // Reset transform when disabled
      if (counter && lastOffsetRef.current !== 0) {
        counter.style.transform = '';
        lastOffsetRef.current = 0;
      }
      return;
    }

    if (!scrollContainer || !tagsBar || !counter) return;

    // Initial calculation
    calculateOffset();

    // ResizeObserver for tags bar height changes (add/remove tags)
    const resizeObserver = new ResizeObserver(scheduleCalculation);
    resizeObserver.observe(tagsBar);

    // Scroll listener (passive for performance)
    scrollContainer.addEventListener('scroll', scheduleCalculation, { passive: true });

    // Window resize listener
    window.addEventListener('resize', scheduleCalculation, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scrollContainer.removeEventListener('scroll', scheduleCalculation);
      window.removeEventListener('resize', scheduleCalculation);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      // Reset on cleanup
      if (counter) {
        counter.style.transform = '';
      }
      lastOffsetRef.current = 0;
    };
  }, [scrollContainerRef, tagsBarRef, counterRef, enabled, calculateOffset, scheduleCalculation]);
};
