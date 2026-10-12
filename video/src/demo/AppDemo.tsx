import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Mascot } from "../components/Mascot";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { UICard } from "../components/UICard";
import { AGENTS } from "../data/agents";
import { EXPRESSIONS } from "../lib/expressions";
import { clamp, lerp, tween } from "../lib/motion";
import { FONT_STACK } from "../theme/tokens";

export const DEMO_CARD = { x: 960, y: 603, w: 1600, h: 794 };
export const INK = "#242426";
export const MUTED = "#747472";
export const GREEN = "#168767";

export const Avatar = ({ id, size = 30 }: { id: string; size?: number }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const agent = AGENTS.find(a => a.id === id)!;
  return agent.kind === "shape" ? <Mascot agent={agent} size={size} eyes={EXPRESSIONS.neutral} glow={0} shadow={0} /> :
    <DotMatrixLogo size={size} frame={f} fps={fps} pngAt={-100} glow={0} />;
};

/** Faithful enlarged reconstruction of Sidebar, ChatHeader, Composer and tool disclosure.
 * Demo data is labelled on screen. This is video choreography, not a live app session.
 */
export const AppDemo = ({ agentId, role = "Admin", children, composer, badge = "Reconstructed demo · illustrative data" }: {
  agentId: string; role?: string; children: ReactNode; composer?: ReactNode; badge?: string;
}) => {
  const f = useCurrentFrame(); const name = AGENTS.find(a => a.id === agentId)!.name;
  return <>
    <UICard geom={DEMO_CARD} enterAt={18} push={clamp(f / 500)} pushTo={1.012}>
      <div style={{ display: "flex", height: "100%", background: "#fff", fontFamily: FONT_STACK, color: INK }}>
        <aside style={{ width: 238, padding: "24px 17px", boxSizing: "border-box", flexShrink: 0, background: "#f5f5f3", borderRight: "1px solid #e9e9e5" }}>
          <div style={{ fontSize: 23, fontWeight: 650, marginBottom: 22 }}>Bot Company <span style={{ float: "right", fontSize: 23, color: MUTED }}>⌕</span></div>
          <div style={{ fontSize: 16, color: MUTED, padding: "12px 10px" }}>Specialists</div>
          {AGENTS.map(a => <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 9px", marginBottom: 4,
            borderRadius: 13, background: a.id === agentId ? "#e8e8e5" : "transparent", fontSize: 18, fontWeight: a.id === agentId ? 600 : 450 }}>
            <Avatar id={a.id} size={28} /><span>{a.name}</span>
          </div>)}
          <div style={{ position: "absolute", bottom: 27, left: 28, fontSize: 18, color: MUTED }}>◉ &nbsp; {role} <span style={{ marginLeft: 103 }}>⌄</span></div>
        </aside>
        <main style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div style={{ height: 73, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #deded9", borderRadius: 99, padding: "6px 14px 6px 6px", fontSize: 21, background: "#fcfcfa", boxShadow: "0 2px 8px #00000009" }}>
              <Avatar id={agentId} size={32} />{name}<span style={{ color: MUTED, marginLeft: 8 }}>⌄</span>
            </div>
          </div>
          <div style={{ position: "absolute", top: 91, left: 54, right: 54, bottom: 122, overflow: "visible" }}>{children}</div>
          <div style={{ position: "absolute", bottom: 25, left: 48, right: 48, minHeight: 65, boxSizing: "border-box", padding: "18px 70px 18px 24px", border: "1px solid #deded9", borderRadius: 26, color: MUTED, fontSize: 22 }}>
            {composer ?? `Message ${name}`}<div style={{ position: "absolute", right: 15, bottom: 13, borderRadius: "50%", background: "#ededeb", width: 39, height: 39, display: "grid", placeItems: "center" }}>↑</div>
          </div>
        </main>
      </div>
    </UICard>
    <div style={{ position: "absolute", top: 1025, left: 0, right: 0, textAlign: "center", fontSize: 20, color: "#b6b6c0", letterSpacing: ".025em" }}>{badge}</div>
  </>;
};

/** Composer sends into a real-sized user bubble, then clears. */
export const SendingPrompt = ({ text, at = 44, send = 110 }: { text: string; at?: number; send?: number }) => {
  const f = useCurrentFrame(); const travel = tween(f, [send, send + 20], [0, 1]);
  const typed = text.slice(0, Math.floor(clamp((f - at) / (send - at - 5)) * text.length));
  if (f < at) return null;
  return <div style={{ position: "absolute", left: lerp(-6, 125, travel), right: 0, top: lerp(610, 0, travel),
    padding: "18px 24px", borderRadius: 24, border: travel < 1 ? "1px solid #deded9" : undefined,
    background: travel < .8 ? "#fff" : "#f0f0ed", boxShadow: travel < .9 ? "0 8px 24px #00000012" : undefined,
    fontSize: 25, lineHeight: 1.35, color: INK, zIndex: 4, opacity: tween(f, [at, at + 8], [0, 1]) }}>
    {typed}{f < send ? <span style={{ color: "#8b5cf6" }}>▏</span> : null}
    {f < send + 10 ? <span style={{ position: "absolute", right: 16, top: 14, width: 38, height: 38, borderRadius: "50%", background: "#222", color: "white", textAlign: "center", lineHeight: "38px" }}>↑</span> : null}
  </div>;
};

export type DemoTool = { label: string; from: number; to: number };
export const ToolRun = ({ tools, collapseAt = 9999 }: { tools: DemoTool[]; collapseAt?: number }) => {
  const f = useCurrentFrame(); const p = tween(f, [collapseAt, collapseAt + 20], [0, 1]);
  if (f < tools[0]!.from) return null;
  const done = f >= tools[tools.length - 1]!.to;
  return <div style={{ fontSize: 22, color: MUTED }}>
    <div style={{ marginBottom: 10 }}><span style={{ display: "inline-block", transform: `rotate(${90 * (1 - p)}deg)` }}>›</span> {done ? "Done" : "Working…"} · {tools.filter(t => f >= t.from).length} {tools.filter(t => f >= t.from).length === 1 ? "tool" : "tools"}</div>
    <div style={{ overflow: "hidden", height: (tools.length * 38) * (1 - p), borderLeft: "1px solid #deded9", marginLeft: 6, paddingLeft: 18 }}>
      {tools.filter(t => f >= t.from).map(t => <div key={t.label} style={{ height: 38, display: "flex", alignItems: "center", gap: 12,
        opacity: tween(f, [t.from, t.from + 10], [0, 1]), transform: `translateX(${12 * (1 - tween(f, [t.from, t.from + 12], [0, 1]))}px)` }}>
        <span style={{ color: f >= t.to ? GREEN : "#be8b20", display: "inline-block", transform: f < t.to ? `rotate(${f * 9}deg)` : undefined }}>{f >= t.to ? "✓" : "◷"}</span>
        {t.label}{f < t.to ? <span style={{ height: 3, width: 90 * clamp((f - t.from) / (t.to - t.from)), background: "#cbbaff", borderRadius: 4 }} /> : null}
      </div>)}
    </div>
  </div>;
};
export const DemoIntro = ({ id, label }: { id: string; label: string }) => {
  const f = useCurrentFrame(); const settle = tween(f, [12, 44], [0, 1]);
  return <div style={{ position: "absolute", left: 160, top: 58, display: "flex", alignItems: "center", gap: 20 }}>
    <div style={{ transform: `rotate(${Math.sin(f / 10) * 4 * (1 - settle)}deg) scale(${1.4 - .4 * settle})` }}><Avatar id={id} size={66} /></div>
    <div style={{ fontSize: 54, color: "#ececee", fontWeight: 600, letterSpacing: "-.035em" }}>{label}</div>
  </div>;
};
export const ResultBox = ({ children, at }: { children: ReactNode; at: number }) => {
  const f = useCurrentFrame(); const p = tween(f, [at, at + 24], [0, 1]);
  return <div style={{ marginTop: 18, overflow: "hidden", maxHeight: 430 * p, opacity: clamp(p * 2), border: p > 0 ? "1px solid #e2e2dd" : undefined,
    borderRadius: 16, background: "#fafaf8", color: INK }}>{children}</div>;
};
