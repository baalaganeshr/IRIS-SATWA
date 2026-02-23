import { useCallback } from "react";

/**
 * Lightweight smooth-scroll helper (no external library).
 * Returns a `scrollToTop` function that instantly resets the given
 * wrapper element's scroll position — used on page navigation.
 */
export function useSmoothScroll(
  wrapper: React.RefObject<HTMLElement | null>
) {
  const scrollToTop = useCallback(() => {
    const el = wrapper.current;
    if (el) {
      el.scrollTop = 0;
    }
  }, [wrapper]);

  return scrollToTop;
}
