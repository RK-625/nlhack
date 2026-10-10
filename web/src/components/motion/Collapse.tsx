import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { collapse, instant } from "@/lib/motion";

/** Height-auto disclosure body: opens and closes with the same (mirrored) motion. */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          key="collapse"
          variants={reduce ? instant(collapse) : collapse}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{ overflow: "hidden" }}
        >
          {children}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
