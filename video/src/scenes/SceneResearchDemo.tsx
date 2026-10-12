import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Cursor } from "../components/Cursor";
import { AppDemo, DemoIntro, GREEN, INK, MUTED, ResultBox, SendingPrompt, ToolRun } from "../demo/AppDemo";
import { clamp, tween } from "../lib/motion";
const TOOLS = [
  { label: "Crustdata company search", from: 136, to: 190 },
  { label: "Crustdata company enrich ×2", from: 194, to: 248 },
  { label: "Crustdata web search", from: 252, to: 292 },
];
export const SceneResearchDemo = () => {
  const f = useCurrentFrame(); const detail = tween(f, [330, 356], [0, 1]);
  return <AbsoluteFill>
    <AccentGlow color="#06b6d4" x={48} y={53} w={55} h={48} opacity={.12} /><Dust seed="research-demo" count={20} opacity={.45} />
    <DemoIntro id="market-researcher" label="Research Bot · company intelligence" />
    <AppDemo agentId="market-researcher">
      <SendingPrompt text="Compare two CRM companies: headcount, hiring and sources." />
      <div style={{ position: "absolute", top: 94, left: 0, right: 0 }}>
        <ToolRun tools={TOOLS} collapseAt={293} />
        <ResultBox at={294}>
          <div style={{ display: "flex", minHeight: 310 }}>
            <div style={{ flex: 1, padding: 24, minWidth: 0 }}>
              <div style={{ fontSize: 27, fontWeight: 600, marginBottom: 16 }}>Company comparison</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", fontSize: 19, color: MUTED, padding: "10px 0", borderBottom: "1px solid #ddd" }}><span>Company</span><span>Headcount</span><span>Open roles</span></div>
              {[{ name: "Orbit CRM", n: 68, jobs: 9 }, { name: "Harbor CRM", n: 42, jobs: 4 }].map((r, i) => {
                const p = tween(f, [302 + i * 12, 322 + i * 12], [0, 1]);
                return <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", padding: "17px 0", borderBottom: "1px solid #e5e5df", fontSize: 24,
                  opacity: p, background: i === 0 && detail > 0 ? "#e8f8fa" : undefined }}>
                  <span style={{ color: "#087f91", fontWeight: 550 }}>{r.name} ↗</span><span>{Math.round(r.n * p)}</span><span>{r.jobs}</span>
                </div>;
              })}
              <div style={{ fontSize: 19, color: MUTED, marginTop: 18 }}>Illustrative companies · demo data</div>
            </div>
            <div style={{ width: 360 * detail, opacity: detail, overflow: "hidden", background: "#eef9fa", borderLeft: detail > 0 ? "1px solid #cbe7eb" : undefined }}>
              <div style={{ width: 312, padding: 24 }}>
                <div style={{ fontSize: 27, fontWeight: 600 }}>Orbit CRM</div><div style={{ fontSize: 19, color: MUTED, marginTop: 7 }}>orbit.example</div>
                <div style={{ marginTop: 22, fontSize: 21 }}>Headcount trend</div>
                <svg width={300} height={86} viewBox="0 0 300 86"><path d="M4 77L62 67L119 55L176 62L232 33L293 10" fill="none" stroke="#0891a5" strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((f - 351) / 36)} /></svg>
                <div style={{ fontSize: 20, color: GREEN }}>✓ Company profile</div><div style={{ fontSize: 20, color: GREEN, marginTop: 10 }}>✓ Hiring page</div>
              </div>
            </div>
          </div>
        </ResultBox>
        {f > 381 ? <div style={{ fontSize: 25, color: INK, marginTop: 18 }}>Company facts, hiring signals and source links—together.</div> : null}
      </div>
    </AppDemo>
    <Cursor keys={[{ f: 82, x: 1640, y: 960 }, { f: 110, x: 1670, y: 942 }, { f: 135, x: 1700, y: 950 },
      { f: 312, x: 790, y: 650 }, { f: 330, x: 607, y: 565 }, { f: 360, x: 1430, y: 622 }]}
      clicks={[110, 330]} appearAt={82} hideAt={394} size={39} rippleColor="#06b6d4" />
  </AbsoluteFill>;
};
