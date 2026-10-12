import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { clamp } from "../lib/motion";
import { VIDEO } from "../theme/tokens";

export type CameraState = {
  /** World point at the centre of the frame. */
  x: number;
  y: number;
  zoom: number;
  /** Screen-space radius (px) around the centre that stays in sharp focus. */
  focusRadius: number;
  /** Max depth-of-field blur in px. */
  maxBlur?: number;
};

const CameraContext = createContext<CameraState>({ x: 0, y: 0, zoom: 1, focusRadius: 400 });
export const useCamera = () => useContext(CameraContext);

/**
 * A 2D dolly camera: children are laid out in world coordinates and the camera
 * pans/zooms over them. Use <WorldItem> to place things and depthOfField() for focus.
 */
export const World = ({ camera, children }: { camera: CameraState; children: ReactNode }) => (
  <CameraContext.Provider value={camera}>
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transformOrigin: "0 0",
          transform: `translate(${VIDEO.width / 2}px, ${VIDEO.height / 2}px) scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  </CameraContext.Provider>
);

/** Positions children so (x, y) is their anchor point (default: bottom-centre "feet"). */
export const WorldItem = ({
  x,
  y,
  anchor = "feet",
  style,
  children,
}: {
  x: number;
  y: number;
  anchor?: "feet" | "center";
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: anchor === "feet" ? "translate(-50%, -100%)" : "translate(-50%, -50%)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Blur + dim for an object at world x, given the camera's focus band. */
export const depthOfField = (camera: CameraState, worldX: number) => {
  const screenDx = (worldX - camera.x) * camera.zoom;
  const off = Math.max(0, Math.abs(screenDx) - camera.focusRadius);
  const k = clamp(off / 520);
  return {
    screenDx,
    blur: (camera.maxBlur ?? 14) * Math.pow(k, 0.85),
    dim: 1 - 0.58 * k,
    focus: 1 - k,
  };
};

/** Slow push-in / drift wrapper for flat (non-world) scenes. */
export const Dolly = ({
  progress,
  from = 1,
  to = 1.05,
  driftY = 0,
  children,
}: {
  /** 0..1 through the shot. */
  progress: number;
  from?: number;
  to?: number;
  driftY?: number;
  children: ReactNode;
}) => (
  <AbsoluteFill
    style={{
      transform: `translateY(${driftY * progress}px) scale(${from + (to - from) * progress})`,
      transformOrigin: "50% 50%",
    }}
  >
    {children}
  </AbsoluteFill>
);
