import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Cursor } from "../components/Cursor";
import { AppDemo, DemoIntro, GREEN, INK, MUTED, ResultBox, SendingPrompt, ToolRun } from "../demo/AppDemo";
import { tween } from "../lib/motion";
const TOOLS = [{ label: "Inspect repository and Actions run", from: 136, to: 191 }, { label: "Read failed job logs", from: 195, to: 239 }];
export const SceneGithubDemo = () => {
  const f = useCurrentFrame(); const approved = f >= 353; const fold = tween(f, [270, 292], [0, 1]);
  return <AbsoluteFill>
    <AccentGlow color="#94a3b8" x={50} y={53} w={55} h={48} opacity={.12} /><Dust seed="github-demo" count={20} opacity={.45} />
    <DemoIntro id="github" label="GitHub Bot · inspect, then act" />
    <AppDemo agentId="github">
      <SendingPrompt text="Why did the release workflow fail? Draft an issue with the fix." />
      <div style={{ position: "absolute", top: 94, left: 0, right: 0 }}>
        <ToolRun tools={TOOLS} collapseAt={247} />
        <ResultBox at={240}>
          <div style={{ padding: "18px 24px", background: "#191c22", color: "#d7dce3", fontFamily: "monospace", fontSize: 21, maxHeight: 160 - 42 * fold, overflow: "hidden" }}>
            <div style={{ color: "#96a0b1", marginBottom: 10 }}>demo/release-service · Actions / release.yml</div>
            <div style={{ color: "#fca5a5" }}>✕ Integration test: DATABASE_URL is missing</div>
            <div style={{ marginTop: 7 }}>Process completed with exit code 1.</div>
          </div>
        </ResultBox>
        <ResultBox at={281}>
          <div style={{ padding: 23, background: approved ? "#f0fbf5" : "#fafaf8" }}>
            <div style={{ fontSize: 25, fontWeight: 600, color: approved ? GREEN : INK }}>{approved ? "✓ Issue created · #42" : "Approve GitHub create issue?"}</div>
            <div style={{ fontSize: 20, color: MUTED, marginTop: 10 }}>Repository: demo/release-service</div>
            <div style={{ fontSize: 24, marginTop: 15 }}>Fix missing database configuration in release CI</div>
            <div style={{ fontSize: 21, marginTop: 9, lineHeight: 1.45 }}>Add the required secret to the integration job and rerun the failing test.</div>
            <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20, fontSize: 23 }}>
              <div style={{ padding: "11px 24px", borderRadius: 12, background: approved ? "#ddf5e8" : "#222", color: approved ? GREEN : "#fff" }}>{approved ? "Open issue ↗" : "✓ Approve"}</div>
              {!approved ? <span style={{ color: MUTED }}>× Deny</span> : <span style={{ color: GREEN }}>Linked to the failed run</span>}
            </div>
          </div>
        </ResultBox>
      </div>
    </AppDemo>
    <Cursor keys={[{ f: 80, x: 1660, y: 975 }, { f: 110, x: 1670, y: 942 }, { f: 135, x: 1700, y: 950 },
      { f: 314, x: 1020, y: 834 }, { f: 353, x: 547, y: 810 }, { f: 396, x: 1080, y: 774 }]}
      clicks={[110, 353]} appearAt={80} hideAt={421} size={39} rippleColor="#8b5cf6" />
  </AbsoluteFill>;
};
