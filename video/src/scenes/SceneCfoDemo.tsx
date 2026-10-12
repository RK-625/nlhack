import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { AppDemo, DemoIntro, SendingPrompt } from "../demo/AppDemo";
import { Cursor } from "../components/Cursor";
import { Scene10bCfoPlan } from "./Scene10bCfoPlan";
import { tween } from "../lib/motion";
export const SceneCfoDemo=()=>{
  const f=useCurrentFrame(); const mix=tween(f,[113,128],[0,1]);
  return <AbsoluteFill>
    {f<129?<div style={{opacity:1-mix}}><DemoIntro id="cfo" label="CFO Bot · from question to plan"/>
      <AppDemo agentId="cfo" badge="Reconstructed prompt → captured CFO workflow"><SendingPrompt text="Create a 12-month business plan for Lumen Labs." at={30} send={96}/></AppDemo>
      <Cursor keys={[{f:68,x:1660,y:980},{f:96,x:1670,y:942}]} clicks={[96]} appearAt={68} hideAt={108} size={39}/>
    </div>:null}
    <Sequence from={113} layout="none"><div style={{opacity:mix}}><Scene10bCfoPlan/></div></Sequence>
  </AbsoluteFill>;
};
