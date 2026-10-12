import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT_FAMILY } from "./tokens";

/**
 * Geist (variable, latin) — the same face the app ships via @fontsource-variable/geist.
 * The woff2 is copied into public/fonts so renders never depend on the network.
 * loadFont() wraps delayRender, so frames wait for the font.
 */
let loaded = false;
export const ensureFonts = (): void => {
  if (loaded) return;
  loaded = true;
  void loadFont({
    family: FONT_FAMILY,
    url: staticFile("fonts/geist-latin-wght-normal.woff2"),
    weight: "100 900",
    style: "normal",
  });
};
