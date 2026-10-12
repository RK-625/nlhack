import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Chip } from "../components/Chip";
import { BlurInText } from "../components/BlurInText";
import { Headline } from "../components/Headline";
import { Shot, Spotlight, UICard } from "../components/UICard";
import { SHOTS } from "../data/evidence";
import { clamp, lerp, tween } from "../lib/motion";
import { COLORS } from "../theme/tokens";

const number = new Intl.NumberFormat("en-US");
const FROM = { tokens: 323923, cost: 0.0589567 };
const TO = { tokens: 237208, cost: 0.0498578 };

/** Scene 9 — trace pair and the separately labelled three-run app-log observation. */
export const Scene09Measured = () => {
  const frame = useCurrentFrame();
  const p = tween(frame, [52, 151], [0, 1], Easing.inOut(Easing.cubic));
  const changed = tween(frame, [119, 140], [0, 1]);
  const push = clamp(frame / 240);
  return <AbsoluteFill>
    <AccentGlow color="#10b981" x={50} y={48} w={58} h={45} opacity={0.13} />
    <Dust seed="measured" count={28} opacity={0.5} />
    <Headline text="One fix. Measured." start={12} />
    <div style={{ position: "absolute", top: 164, left: 0, right: 0, textAlign: "center" }}>
      <BlurInText text="Same Northwind task · one before/after pair" start={24}
        style={{ fontSize: 27, color: COLORS.mutedStrong }} />
    </div>
    <UICard geom={{ x: 580, y: 409, w: 720, h: 310 }} enterAt={15} push={push} pushTo={1.02}>
      <div style={{ padding: "30px 38px", color: COLORS.foreground }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 25, color: COLORS.mutedStrong }}>Total tokens</span>
          <span style={{ fontSize: 22, color: "#34d399", opacity: tween(frame, [144, 161], [0, 1]) }}>−26.8%</span>
        </div>
        <div style={{ fontSize: 90, fontWeight: 600, letterSpacing: "-0.055em", marginTop: 10, fontVariantNumeric: "tabular-nums" }}>
          {number.format(Math.round(lerp(FROM.tokens, TO.tokens, p)))}
        </div>
        <div style={{ fontSize: 22, color: COLORS.mutedStrong, marginTop: 6 }}>323,923 before → 237,208 after</div>
        <div style={{ height: 6, borderRadius: 99, background: "#292d33", marginTop: 26 }}>
          <div style={{ height: "100%", width: `${lerp(100, TO.tokens / FROM.tokens * 100, p)}%`, borderRadius: 99,
            background: `linear-gradient(90deg, #8b5cf6, ${p > 0.6 ? "#34d399" : "#a78bfa"})` }} />
        </div>
      </div>
    </UICard>
    <UICard geom={{ x: 1350, y: 409, w: 720, h: 310 }} enterAt={24} push={push} pushTo={1.02}>
      <div style={{ padding: "30px 38px", color: COLORS.foreground }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 25, color: COLORS.mutedStrong }}>
          <span>Model cost</span><span style={{ color: "#34d399", fontSize: 22, opacity: tween(frame, [144, 161], [0, 1]) }}>−15.4%</span>
        </div>
        <div style={{ fontSize: 82, fontWeight: 600, letterSpacing: "-0.05em", marginTop: 18, fontVariantNumeric: "tabular-nums" }}>
          ${lerp(FROM.cost, TO.cost, p).toFixed(6)}
        </div>
        <div style={{ marginTop: 16, position: "relative", height: 52 }}>
          <div style={{ position: "absolute", opacity: 1 - changed }}><Chip label="ERROR" icon="dot" color="#f87171" enterAt={28} /></div>
          <div style={{ position: "absolute", opacity: changed }}><Chip label="SUCCESS" icon="spinner" color="#10b981" enterAt={119} checkAt={142} /></div>
        </div>
      </div>
    </UICard>
    <UICard geom={{ x: 965, y: 768, w: 1480, h: 310 }} enterAt={45} push={push} pushTo={1.01}>
      <Shot shot={SHOTS.comparison} camera={{ cx: 1085, cy: 755, zoom: 1.12 + push * 0.015 }}>
        <Spotlight x={440} y={675} w={1290} h={110} amount={0.22} radius={12} feather={12} />
      </Shot>
    </UICard>
    <div style={{ position: "absolute", left: 0, right: 0, top: 961, textAlign: "center", opacity: tween(frame, [169, 187], [0, 1]) }}>
      <span style={{ fontSize: 27, color: COLORS.foreground }}>CFO file reads: <b style={{ color: "#34d399" }}>29 → 10</b></span>
      <div style={{ marginTop: 10, fontSize: 20, color: COLORS.mutedStrong }}>Separate sample: 3 runs per group · app logs · observational, not a benchmark</div>
    </div>
  </AbsoluteFill>;
};
