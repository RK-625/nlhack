import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { Cursor } from "../components/Cursor";
import { AppDemo, DemoIntro, GREEN, MUTED, ResultBox, SendingPrompt, ToolRun } from "../demo/AppDemo";
import { clamp, tween } from "../lib/motion";
import { Shot, UICard } from "../components/UICard";
import { SHOTS } from "../data/evidence";
const QUERY = "Investigate failed runs across the company.";
/** Same application chat, employee request scoped, admin request expands, actual trace opens. */
export const Scene07Roles = () => {
  const f=useCurrentFrame(); const admin=f>=235; const opened=tween(f,[430,452],[0,1]);
  return <AbsoluteFill>
    <AccentGlow color="#8b5cf6" x={50} y={53} w={55} h={48} opacity={.12}/><Dust seed="roles-investigation" count={20} opacity={.45}/>
    <DemoIntro id="neatlogs" label={admin?"Admin · investigate company-wide":"Employee · inspect your own runs"}/>
    <div style={{opacity:(1-opened)*(1-.96*Math.sin(Math.PI*tween(f,[218,252],[0,1])))}}>
      <AppDemo agentId="neatlogs" role={admin?"Admin":"Employee"} badge="Reconstructed role comparison · separate signed-in accounts">
        <SendingPrompt text={QUERY}/>
        <div style={{position:"absolute",top:94,left:0,right:0}}>
          {f<235 ? <>
            <ToolRun tools={[{label:"Search traces · current user only",from:137,to:164}]} collapseAt={169}/>
            <ResultBox at={168}><div style={{padding:24}}><div style={{fontSize:26,fontWeight:600}}>Your runs only</div><div style={{fontSize:23,lineHeight:1.5,marginTop:14}}>I can inspect your own traces. Company-wide analytics, detections and triage are available to admins.</div><div style={{display:"flex",justifyContent:"space-between",padding:"18px 0",marginTop:15,borderTop:"1px solid #ddd",fontSize:22}}><span>You · latest conversation</span><span style={{color:GREEN}}>SUCCESS</span></div></div></ResultBox>
          </> : <Sequence from={235} layout="none"><AdminInvestigation/></Sequence>}
        </div>
      </AppDemo>
    </div>
    {opened>0 ? <div style={{opacity:opened}}><UICard geom={{x:960,y:603,w:1600,h:794}} enterAt={429} push={clamp((f-429)/80)}><Shot shot={SHOTS.cappedTrace} camera={{cx:1080,cy:600,zoom:1.18}}/></UICard>
      <div style={{position:"absolute",top:1026,left:0,right:0,textAlign:"center",fontSize:21,color:"#bfc0ca"}}>Actual Neatlogs capture · token-cap failure</div></div>:null}
    {f>211&&f<261 ? <div style={{position:"absolute",left:0,right:0,top:164,textAlign:"center",fontSize:23,color:"#c4b5fd"}}>Switch to a separate signed-in admin account</div> : null}
    <Cursor keys={[{f:80,x:1660,y:970},{f:110,x:1670,y:942},{f:178,x:1050,y:605},
      {f:348,x:950,y:800},{f:363,x:752,y:714},{f:392,x:1000,y:740},{f:430,x:1620,y:770}]}
      clicks={[110,363,430]} appearAt={80} hideAt={462} size={39} rippleColor="#8b5cf6"/>
  </AbsoluteFill>;
};
const AdminInvestigation=()=>{
  const f=useCurrentFrame();const details=tween(f,[128,148],[0,1]);
  return <>
    <ToolRun tools={[{label:"Search traces · all users",from:9,to:39},{label:"Project analytics and detections",from:43,to:78}]} collapseAt={83}/>
    <ResultBox at={79}><div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:25,fontWeight:600}}><span>Run investigation · all users</span><span style={{fontSize:19,color:MUTED}}>Scope: all users</span></div>
      {[{user:"User A",cause:"Token cap reached",color:"#be3945"},{user:"User B",cause:"Tool request failed",color:"#be3945"},{user:"You",cause:"Completed",color:GREEN}].map((r,i)=><div key={r.user} style={{display:"grid",gridTemplateColumns:"160px 1fr 100px",padding:"15px 0",borderBottom:"1px solid #ddd",fontSize:22,opacity:tween(f,[88+i*8,99+i*8],[0,1])}}><span>{r.user}</span><span>{r.cause}</span><span style={{color:r.color}}>{i<2?"ERROR":"SUCCESS"}</span></div>)}
      <div style={{display:"flex",gap:20,marginTop:18,fontSize:21,color:"#6d4ca7"}}><span>Analytics</span><span>Detections</span><span>Triage ↓</span></div>
      <div style={{height:78*details,opacity:details,overflow:"hidden",marginTop:12,fontSize:21,background:"#f0edf8",borderRadius:12}}><div style={{padding:16}}>Token-cap failure · inspect the trace tree <span style={{float:"right",color:"#6d4ca7"}}>Open trace ↗</span></div></div>
    </div></ResultBox>
  </>;
};
