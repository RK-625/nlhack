import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { BlurInText } from "../components/BlurInText";
import { Chip } from "../components/Chip";
import { Headline } from "../components/Headline";
import { UICard } from "../components/UICard";
import { clamp, tween } from "../lib/motion";
import { COLORS } from "../theme/tokens";

const COMMITS = [
  { hash: "030a0a7", title: "Mark capped turns as errors", at: 30 },
  { hash: "729df66", title: "Offer a one-time extension", at: 44 },
  { hash: "f3f783d", title: "Show Approve / Deny", at: 58 },
  { hash: "8887e9b", title: "Reuse facts in delegated briefs", at: 72 },
];

/** Scene 10 — exact saved checkpoint and real local commit trail, without personal metadata. */
export const Scene10Checkpoints = () => {
  const frame = useCurrentFrame();
  const reveal = tween(frame, [66, 97], [0, 1]);
  return <AbsoluteFill>
    <AccentGlow color={COLORS.primary} x={50} y={54} w={52} h={47} opacity={0.16} />
    <Dust seed="receipts" count={26} opacity={0.6} />
    <Headline text="Every change, checkpointed." start={12} />
    <UICard geom={{ x: 960, y: 571, w: 1390, h: 660 }} enterAt={12} push={clamp(frame / 150)}>
      <div style={{ display: "flex", height: "100%", color: COLORS.foreground }}>
        <div style={{ width: 680, padding: "36px 36px", boxSizing: "border-box", borderRight: "1px solid #292631" }}>
          <div style={{ fontSize: 24, color: COLORS.mutedStrong }}>COMMIT TRAIL</div>
          <div style={{ position: "relative", marginTop: 30 }}>
            <div style={{ position: "absolute", left: 11, top: 20, width: 2, height: 372 * tween(frame, [27, 85], [0, 1]),
              background: "linear-gradient(#4d3a71, #a78bfa)" }} />
            {COMMITS.map((commit) => {
              const p = tween(frame, [commit.at, commit.at + 13], [0, 1]);
              const current = commit.hash === "8887e9b";
              return <div key={commit.hash} style={{ position: "relative", marginBottom: 29, minHeight: 72, paddingLeft: 44, opacity: p,
                transform: `translateX(${15 * (1 - p)}px)` }}>
                <div style={{ position: "absolute", left: 3, top: 9, width: 16, height: 16, borderRadius: "50%",
                  background: current ? "#a78bfa" : "#5d506e", border: "3px solid #141518", boxShadow: current ? "0 0 16px #8b5cf688" : undefined }} />
                <div style={{ fontFamily: "monospace", color: current ? "#c4b5fd" : COLORS.mutedStrong, fontSize: 25 }}>{commit.hash}</div>
                <div style={{ fontSize: 26, marginTop: 9, fontWeight: current ? 550 : 400 }}>{commit.title}</div>
              </div>;
            })}
          </div>
        </div>
        <div style={{ flex: 1, padding: "36px 32px", opacity: reveal, transform: `translateY(${20 * (1 - reveal)}px)` }}>
          <div style={{ fontSize: 24, color: "#c4b5fd" }}>ENTIRE CHECKPOINT</div>
          <div style={{ marginTop: 28, fontFamily: "monospace", fontSize: 24, lineHeight: 1.5, color: "#d8d1e7" }}>01M4QMYG0STA2ZQR90286XF297</div>
          <div style={{ marginTop: 30, fontSize: 44, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1 }}>The change.<br />The context.<br />The trail.</div>
          <div style={{ marginTop: 28, fontSize: 22, color: COLORS.mutedStrong }}>src/mastra/prompts/index.ts</div>
          <div style={{ marginTop: 29 }}><Chip label="Linked to commit 8887e9b" icon="spinner" checkAt={106} enterAt={88} color="#a78bfa" /></div>
        </div>
      </div>
    </UICard>
    <div style={{ position: "absolute", top: 972, left: 0, right: 0, textAlign: "center" }}>
      <BlurInText text="Built with receipts." start={108} style={{ fontSize: 34, color: COLORS.mutedStrong }} />
    </div>
  </AbsoluteFill>;
};
