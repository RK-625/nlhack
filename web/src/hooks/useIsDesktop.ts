import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)"; // Tailwind `md`

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True at the `md` breakpoint and up, where the sidebar is docked instead of an overlay. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches);
}
