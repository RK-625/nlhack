// Remotion CLI config — applies to `remotion studio | render | still` (not to the Node API in scripts/).
// https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
// Keep heavy CSS blur/filters crisp and GPU-accelerated in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");
