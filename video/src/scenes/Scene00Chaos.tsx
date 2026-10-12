import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Headline } from "../components/Headline";
import { Cursor } from "../components/Cursor";
import { Mascot } from "../components/Mascot";
import { AGENTS } from "../data/agents";
import { EXPRESSIONS } from "../lib/expressions";
import { clamp, tween } from "../lib/motion";

const TEAMS = ["Sales", "Finance", "Engineering", "Support", "Operations", "Legal"];
const TASKS = [
  {x:55,y:130,name:"Research company",team:"Sales",detail:"Company API",color:"#46d7be"},
  {x:435,y:130,name:"Build forecast",team:"Finance",detail:"Finance workspace",color:"#c1adff"},
  {x:435,y:385,name:"Publish update",team:"Engineering",detail:"Repository action",color:"#ff998f"},
];
/** Illustrative workflow, with a selection, inspection and retry causing visible state changes. */
export const Scene00Chaos = () => {
  const f=useCurrentFrame();
  const enter=tween(f,[8,30],[0,1]); const selected=f>=120; const inspect=f>=168; const retry=f>=438;
  const escalation=clamp((f-438)/125); const gag=tween(f,[620,645],[0,1]);
  const zoom=tween(f,[90,135],[1,1.025]);
  const title=f<120?"One request. Three agents at work.":f<270?"It fails. You can’t trace why.":f<420?"No budget cap. Costs keep climbing.":f<600?"Retrying duplicates the work.":"More work. Less control.";
  const titleAt=f<120?8:f<270?120:f<420?270:f<600?420:600;
  return <AbsoluteFill>
    <Headline text={title} start={titleAt}/>
    <div style={{position:"absolute",left:110,top:205,width:1700,height:795,borderRadius:26,overflow:"hidden",background:"#15171e",border:"1px solid #41434f",boxShadow:"0 28px 90px #000a",opacity:enter,transform:`translateY(${20*(1-enter)}px) scale(${zoom})`,transformOrigin:"70% 50%",color:"#eeeef5"}}>
      <div style={{height:84,borderBottom:"1px solid #343641",display:"flex",alignItems:"center",padding:"0 30px",gap:20,background:"#1e2029"}}>
        <div style={{width:35,height:35,borderRadius:10,background:"#b9a1ff",display:"grid",placeItems:"center",color:"#292037",fontSize:26}}>⌘</div>
        <span style={{fontSize:30,fontWeight:600}}>Company workflows</span>
        <span style={{marginLeft:14,fontSize:22,color:"#a4a6b5"}}>Product launch</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10,fontSize:22,color:retry?"#ffb2a6":"#acb0c0"}}><span style={{width:9,height:9,borderRadius:99,background:retry?"#ff998f":"#53d6b5"}}/>{retry?`${Math.floor(3+escalation*9)} tasks active`:"3 tasks active"}</div>
      </div>
      <div style={{position:"absolute",left:0,top:85,bottom:0,width:230,borderRight:"1px solid #343641",background:"#1a1c24",padding:"27px 20px",boxSizing:"border-box"}}>
        <div style={{fontSize:20,color:"#9599ac",marginBottom:22,paddingLeft:12}}>Departments</div>
        {TEAMS.map((team,i)=><div key={team} style={{fontSize:23,padding:"17px 12px",marginBottom:8,borderRadius:12,background:i===2&&selected?"#33282d":"transparent",color:i===2&&selected?"#ffb1a6":"#c2c4d1",display:"flex",justifyContent:"space-between"}}><span>{team}</span><span style={{fontSize:19,color:i===2&&selected?"#ffb1a6":"#777c91"}}>{i===2&&retry?Math.floor(1+escalation*5):i<3?1:0}</span></div>)}
        <div style={{position:"absolute",bottom:34,left:32,fontSize:21,color:"#9297aa"}}>6 connected teams</div>
      </div>
      <div style={{position:"absolute",left:230,top:85,width:865,bottom:0,backgroundImage:"radial-gradient(#ffffff16 1px,transparent 1px)",backgroundSize:"24px 24px",overflow:"hidden"}}>
        <div style={{position:"absolute",left:38,top:29,fontSize:22,color:"#acafbf"}}>Launch workflow <span style={{marginLeft:20,color:"#696e83"}}> / live activity</span></div>
        <svg width={865} height={700} style={{position:"absolute",inset:0}}>
          <path d="M339 200H435 M577 270V385 M197 270V450Q197 455 240 455H435" fill="none" stroke={retry?"#ef847b":"#555b73"} strokeWidth={3}/>
          {[0,1,2].map(i=>{const t=((f*(retry?.018:.008)+i*.33)%1);return <circle key={i} cx={i===0?339+96*t:i===1?577:197+238*t} cy={i===0?200:i===1?270+115*t:455} r={6} fill={retry?"#ffb1a6":"#c6b4ff"}/>;})}
        </svg>
        {TASKS.map((task,i)=>{const failed=i===2&&f>=110;const p=tween(f,[15+i*9,32+i*9],[0,1]);return <div key={task.name} style={{position:"absolute",left:task.x,top:task.y,width:284,height:140,boxSizing:"border-box",borderRadius:17,padding:"20px 22px",background:selected&&i===2?"#35242c":"#222530",border:`${selected&&i===2?2:1}px solid ${failed?"#ff998f":"#4a4e62"}`,opacity:p,transform:`scale(${.96+.04*p})`,boxShadow:selected&&i===2?"0 0 0 6px #ff998f12":"0 10px 25px #0003"}}>
          <div style={{fontSize:19,color:task.color,marginBottom:10}}>{task.team}</div>
          <div style={{fontSize:26,fontWeight:550,whiteSpace:"nowrap"}}>{task.name}</div>
          <div style={{fontSize:20,color:failed?"#ffb2a6":"#a7adbf",marginTop:13}}>{failed?"⊗ Action failed":i===0&&f>78?"✓ Completed":"◷ Running"}</div>
        </div>;})}
        {[0,1,2].map(i=>{const p=tween(f,[450+i*33,470+i*33],[0,1]);return <div key={i} style={{position:"absolute",left:50+i*22,top:510+i*61,width:335,height:52,boxSizing:"border-box",padding:"12px 18px",borderRadius:13,border:"1px solid #b77369",background:"#30252b",fontSize:21,opacity:p,transform:`translateX(${70*(1-p)}px)`,boxShadow:"0 5px 20px #0005"}}>↻ {i===2?"Retrying the retry…":`Publish update · retry ${i+1}`}</div>;})}
      </div>
      <div style={{position:"absolute",left:1095,right:0,top:85,bottom:0,borderLeft:"1px solid #3e404c",background:"#20222c",padding:"29px 32px",boxSizing:"border-box"}}>
        <div style={{fontSize:21,color:"#a5a9bb",marginBottom:24}}>{selected?"Task inspector":"Workspace activity"}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:31,fontWeight:600}}>{selected?"Publish update":"Product launch"}</span><span style={{fontSize:18,color:selected?"#ffb1a6":"#bdb1ee",background:selected?"#4a2d32":"#383044",padding:"7px 12px",borderRadius:8}}>{selected?"Failed":"Running"}</span></div>
        <div style={{fontSize:22,color:"#aeb2c3",marginTop:13}}>{selected?"Engineering · repository action":"Three agents. One company request."}</div>
        <div style={{marginTop:28,padding:"20px 0",borderTop:"1px solid #404350",borderBottom:"1px solid #404350",display:"flex",justifyContent:"space-between"}}>
          <div><div style={{fontSize:20,color:"#a3a7ba"}}>Model spend</div><div style={{fontSize:40,fontWeight:600,marginTop:8,fontVariantNumeric:"tabular-nums",color:f>=270?"#ffb1a6":"#eeeef5"}}>${(.12+clamp(f/100)*.75+clamp((f-270)/290)*5.97).toFixed(2)}</div></div>
          <div><div style={{fontSize:20,color:"#a3a7ba"}}>Budget limit</div><div style={{fontSize:27,marginTop:16,boxShadow:f>=270&&f<420?"0 0 0 9px #f5bd5b16":undefined,borderRadius:5,color:f>=270&&f<420?"#ffcf8f":"#d6c1a1"}}>Not set</div></div>
        </div>
        <div style={{marginTop:26,fontSize:23,lineHeight:1.6}}>{selected?<><span style={{color:"#ffb1a6"}}>{f>=270&&f<420?"No limit on model spend.":"Action stopped unexpectedly."}</span><br/><span style={{color:"#aeb2c3"}}>{f>=270&&f<420?"Spend keeps rising. Nothing stops the run.":"Which agent triggered this action?"}</span></>:<><div>✓ Company research received</div><div style={{color:"#aeb2c3",marginTop:10}}>◷ Forecast in progress</div><div style={{color:"#aeb2c3",marginTop:10}}>◷ Repository update pending</div></>}</div>
        <div style={{marginTop:22,height:59,borderRadius:12,display:"grid",placeItems:"center",border:"1px solid #85809d",background:inspect?"#302c3d":"#292b37",fontSize:24,color:"#e8ddff",opacity:selected?1:.35}}>⌕ Inspect trace</div>
        <div style={{height:90,marginTop:16,padding:"16px 18px",boxSizing:"border-box",borderLeft:"3px solid #dca86b",background:"#342e29",borderRadius:8,fontSize:22,lineHeight:1.35,color:"#f0d3aa",opacity:tween(f,[168,183],[0,1])}}>Parent run unavailable.<br/><span style={{color:"#c8af91",fontSize:20}}>No history. No clear owner.</span></div>
        <div style={{marginTop:18,height:57,borderRadius:12,display:"grid",placeItems:"center",background:retry?"#3c3035":"#e6dcff",color:retry?"#ffb1a6":"#272033",fontSize:24,fontWeight:550,opacity:inspect?1:0}}>{retry?"↻ Retrying…":"Retry task"}</div>
      </div>
      <div style={{position:"absolute",left:650,top:598,display:"flex",alignItems:"center",gap:18,padding:"12px 25px 12px 12px",borderRadius:20,border:"1px solid #786389",background:"#292333",boxShadow:"0 16px 60px #0009",opacity:gag,transform:`translateY(${15*(1-gag)}px) rotate(${Math.sin(f/5)*(1-gag)*3}deg)`}}>
        {AGENTS[0]!.kind==="shape"?<Mascot agent={AGENTS[0]} size={72} eyes={EXPRESSIONS.deadpan} glow={0} shadow={0}/>:null}
        <div style={{fontSize:25,fontWeight:550}}>“Great. Now there are twelve of them.”</div>
      </div>
    </div>
    <div style={{position:"absolute",bottom:21,left:0,right:0,textAlign:"center",fontSize:20,color:"#a7a8b7"}}>Illustration · unmanaged enterprise agents · demo data</div>
    <Cursor keys={[{f:90,x:990,y:870},{f:120,x:955,y:752},{f:149,x:1390,y:740},{f:168,x:1510,y:764},{f:240,x:1540,y:850},{f:285,x:1730,y:555},{f:400,x:1670,y:700},{f:438,x:1510,y:949},{f:510,x:1060,y:874}]} clicks={[120,168,438]} appearAt={90} hideAt={575} size={44} rippleColor="#c7b1ff"/>
  </AbsoluteFill>;
};
