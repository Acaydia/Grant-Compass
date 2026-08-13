import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  bg:"#F2F0EB", surface:"#FFFFFF", surfaceL:"#FDFCFA", surfaceXL:"#F7F5F0",
  navy:"#1C1917", navyL:"#2C2A27", navyXL:"#3D3A35", navyDeep:"#111009",
  gold:"#B8921D", goldBright:"#CCA52A", goldL:"rgba(184,146,29,0.10)", goldD:"#896C14",
  green:"#1A7A52", greenL:"rgba(26,122,82,0.08)",
  red:"#BE3A2B", redL:"rgba(190,58,43,0.08)",
  amber:"#C97B0F", amberL:"rgba(201,123,15,0.08)",
  blue:"#2256D4", blueL:"rgba(34,86,212,0.08)",
  white:"#FFFFFF", text:"#1C1917", textL:"#3A3630",
  muted:"#7A7168", mutedL:"#ABA39B",
  border:"rgba(0,0,0,0.07)", borderStr:"rgba(0,0,0,0.13)",
  shadow:"rgba(0,0,0,0.04)", shadowMd:"rgba(0,0,0,0.09)",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2,9);
const todayISO = () => new Date().toISOString().slice(0,10);
const todayFull = () => new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const daysUntil = d => Math.round((new Date(d)-new Date())/86400000);
const fmtDate = d => d ? new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";

function parseContact(val) {
  if (!val) return null;
  const v = val.trim();
  if (/^https?:\/\//i.test(v)) return <a href={v} target="_blank" rel="noopener noreferrer" style={{color:C.blue,textDecoration:"none"}}>{v}</a>;
  if (/^mailto:/i.test(v)) return <a href={v} style={{color:C.blue,textDecoration:"none"}}>{v.replace(/^mailto:/i,"")}</a>;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return <a href={`mailto:${v}`} style={{color:C.blue,textDecoration:"none"}}>{v}</a>;
  if (/^[\d\s\-\+\(\)\.]+$/.test(v) && v.replace(/\D/g,"").length>=7) return <a href={`tel:${v.replace(/\s/g,"")}`} style={{color:C.blue,textDecoration:"none"}}>{v}</a>;
  return <span>{v}</span>;
}

function load(k,def){try{const v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch{return def;}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

/* ─── Defaults ────────────────────────────────────────────────────────────── */
const DEF_PROFILE = {
  org:"GoForth Ministries",email:"director@goforthmin.org",phone:"(555) 234-5678",
  ein:"12-3456789",founded:"2018",website:"https://goforthministries.org",
  mission:"Empowering under-resourced families through community-driven programs that foster resilience, opportunity, and lasting change.",
  programs:"Family Stability Initiative, Youth Leadership Academy, Emergency Relief Fund",
  families:150,volunteers:45,budget:"$280,000",
  boardSize:7,boardDiversity:"64%",staffFTE:"2.5",
  geographicFocus:"Metro Atlanta – DeKalb and Fulton counties",
  currentFunding:"Individual donors (45%), grants (40%), events (15%)",
  outcomeStatement:"89% of enrolled families report improved financial stability after 12 months.",
  deadlines:[{id:uid(),label:"Community Foundation Spring RFP",date:"2025-03-15"},{id:uid(),label:"State Family Services Grant",date:"2025-04-30"}],
};

const DEF_FUNDERS = [
  {id:uid(),name:"Woodruff Foundation",type:"Family Foundation",location:"Atlanta, GA",assets:"$4.2B",grantRange:"$50k–$500k",focus:"Education, arts, community development",contact:"grants@woodruff.org",stage:"active",catholic:false,deadline:"2025-03-20",notes:"Strong match for Family Stability Initiative. Board member connection through Dr. Marcus Lee."},
  {id:uid(),name:"Blank Family Foundation",type:"Family Foundation",location:"Atlanta, GA",assets:"$180M",grantRange:"$25k–$150k",focus:"Economic mobility, workforce development",contact:"info@blankfoundation.org",stage:"prospect",catholic:false,deadline:"2025-05-01",notes:"LOI due in February. Focus on measurable outcomes."},
  {id:uid(),name:"St. Vincent de Paul Society",type:"Faith-Based",location:"National",assets:"N/A",grantRange:"$5k–$25k",focus:"Catholic social services, emergency relief",contact:"grants@svdp.org",stage:"prospect",catholic:true,deadline:"2025-04-15",notes:"Perfect fit for Emergency Relief Fund. Catholic affiliation a plus."},
  {id:uid(),name:"United Way of Greater Atlanta",type:"Federated",location:"Atlanta, GA",assets:"$52M",grantRange:"$30k–$200k",focus:"Education, income, health",contact:"community@unitedwayatl.org",stage:"submitted",catholic:false,deadline:"2025-02-28",notes:"Application submitted Jan 12. Follow-up scheduled for Feb 15."},
];

const DEF_TASKS = [
  {id:uid(),text:"Draft LOI for Blank Family Foundation",done:false,priority:"high",due:"2025-02-10",tag:"writing"},
  {id:uid(),text:"Schedule board member introduction call with Woodruff",done:false,priority:"high",due:"2025-02-07",tag:"relationship"},
  {id:uid(),text:"Update outcome data for Q4 2024",done:false,priority:"medium",due:"2025-02-14",tag:"data"},
  {id:uid(),text:"Review United Way application status",done:true,priority:"medium",due:"2025-01-30",tag:"admin"},
  {id:uid(),text:"Research 3 new Catholic foundation prospects",done:false,priority:"low",due:"2025-02-28",tag:"research"},
];

const DEF_EVENTS = [
  {id:uid(),title:"Woodruff Site Visit",date:"2025-02-12",color:"#CCA52A",notes:"Prepare impact report and facility tour"},
  {id:uid(),title:"Board Meeting",date:"2025-02-18",color:"#2256D4",notes:"Quarterly review + grant strategy"},
  {id:uid(),title:"United Way Deadline",date:"2025-02-28",color:"#BE3A2B",notes:"Final application submission"},
  {id:uid(),title:"Community Foundation Info Session",date:"2025-03-05",color:"#1A7A52",notes:"Register 2 staff + 1 board member"},
];

const DEF_DONORS = [
  {id:uid(),name:"Marcus & Linda Chen",type:"Major Donor",amount:"$15,000",lastGift:"2024-11-15",notes:"Founding donors. Interested in youth programs. Annual gala table sponsors.",socials:"https://linkedin.com/in/marcuschen",phone:"(404) 555-0142",email:"mchen@chengroup.com"},
  {id:uid(),name:"The Rivera Family",type:"Mid-Level Donor",amount:"$2,500",lastGift:"2024-12-01",notes:"Monthly donors since 2021. Prefer email updates.",socials:"",phone:"",email:"rivera.family@gmail.com"},
  {id:uid(),name:"St. Michael Parish",type:"Faith Partner",amount:"$8,000",lastGift:"2024-09-30",notes:"Annual in-kind + cash donation. Holiday food drive partner.",socials:"https://stmichaelatlanta.org",phone:"(404) 555-0288",email:"office@stmichaelatlanta.org"},
];

/* ─── Style helpers ───────────────────────────────────────────────────────── */
const card = (extra={}) => ({
  background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,
  boxShadow:`0 1px 4px ${C.shadow}, 0 4px 16px rgba(0,0,0,0.04)`,
  padding:20,...extra
});

const btn = (v="primary",extra={}) => ({
  padding:"10px 22px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,
  fontSize:13,letterSpacing:0.1,
  background:
    v==="primary"?`linear-gradient(135deg,${C.goldBright},${C.gold})`:
    v==="gold"?`linear-gradient(135deg,${C.goldBright},${C.gold})`:
    v==="navy"?C.navy:
    v==="green"?C.green:v==="red"?C.red:
    v==="outline"?"transparent":"rgba(0,0,0,0.05)",
  color:v==="primary"||v==="gold"?"#1C1917":
        v==="navy"||v==="green"||v==="red"?"#FFFFFF":
        v==="outline"?C.muted:C.text,
  border:v==="outline"?`1px solid ${C.borderStr}`:"none",
  boxShadow:v==="primary"||v==="gold"?`0 2px 12px rgba(184,146,29,0.20)`:
            v==="navy"?`0 1px 4px rgba(0,0,0,0.18)`:"none",
  display:"inline-flex",alignItems:"center",gap:6,transition:"all 0.15s",...extra
});

const badge = (v="gray",extra={}) => {
  const map={
    green:{bg:C.greenL,tc:C.green},red:{bg:C.redL,tc:C.red},
    amber:{bg:C.amberL,tc:C.amber},gold:{bg:C.goldL,tc:C.gold},
    blue:{bg:C.blueL,tc:C.blue},gray:{bg:"rgba(0,0,0,0.05)",tc:C.muted},
  };
  const s=map[v]||map.gray;
  return {display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",
    borderRadius:20,fontSize:11,fontWeight:600,letterSpacing:0.3,
    background:s.bg,color:s.tc,...extra};
};

const inp = (extra={}) => ({
  width:"100%",padding:"10px 13px",borderRadius:9,border:`1px solid ${C.border}`,
  background:C.surfaceXL,color:C.text,fontSize:13,outline:"none",
  boxSizing:"border-box",...extra
});

const lbl = (extra={}) => ({fontSize:11,fontWeight:600,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:5,display:"block",...extra});

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
const TABS = [
  {id:"dashboard",icon:"🏠",label:"Dashboard"},
  {id:"funders",icon:"🤝",label:"Funders Pipeline"},
  {id:"daily",icon:"☀️",label:"Daily Plan"},
  {id:"calendar",icon:"📅",label:"Calendar"},
  {id:"tasks",icon:"✅",label:"Tasks"},
  {id:"writing",icon:"✍️",label:"Writing Studio"},
  {id:"portfolio",icon:"🌿",label:"Portfolio"},
  {id:"donors",icon:"💛",label:"DonorHub"},
  {id:"settings",icon:"⚙️",label:"Settings"},
  {id:"help",icon:"❓",label:"Help"},
];

const BOTTOM_TABS = ["dashboard","funders","daily","tasks","writing"];

/* ─── Dashboard ───────────────────────────────────────────────────────────── */
function Dashboard({profile,funders,tasks,setTab}){
  const won=funders.filter(f=>f.stage==="won").length;
  const active=funders.filter(f=>["active","submitted"].includes(f.stage)).length;
  const near=funders.filter(f=>f.deadline&&daysUntil(f.deadline)<=14&&f.stage!=="won"&&f.stage!=="lost");
  const overdue=tasks.filter(t=>!t.done&&t.due&&daysUntil(t.due)<0).length;
  const metrics=[
    {icon:"👨‍👩‍👧‍👦",label:"Families Served",value:(profile.families||0)+"+",sub:"weekly",color:"#7C3AED",accent:"rgba(124,58,237,0.08)"},
    {icon:"🤝",label:"Active Grants",value:active,sub:"in pipeline",color:C.blue,accent:C.blueL},
    {icon:"🏆",label:"Grants Won",value:won,sub:"this cycle",color:C.green,accent:C.greenL},
    {icon:"⚠️",label:"Overdue Tasks",value:overdue,sub:"need attention",color:overdue>0?C.red:C.green,accent:overdue>0?C.redL:C.greenL},
  ];
  const stageOrder=["prospect","active","submitted","won","lost"];
  const stageCounts=stageOrder.reduce((a,s)=>{a[s]=funders.filter(f=>f.stage===s).length;return a},{});
  const configs={
    prospect:{bg:C.blueL,tc:C.blue,border:"rgba(34,86,212,0.18)"},
    active:{bg:C.amberL,tc:C.amber,border:"rgba(201,123,15,0.18)"},
    submitted:{bg:C.goldL,tc:C.gold,border:"rgba(184,146,29,0.22)"},
    won:{bg:C.greenL,tc:C.green,border:"rgba(26,122,82,0.18)"},
    lost:{bg:"rgba(0,0,0,0.03)",tc:C.muted,border:"rgba(0,0,0,0.07)"},
  };
  return(
    <div>
      <div style={card({background:"linear-gradient(135deg,#0a0a0c 0%,#1a1a1f 100%)",color:C.white,marginBottom:20,border:"1px solid rgba(255,255,255,0.07)",position:"relative",overflow:"hidden"})}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"rgba(201,168,76,0.05)"}}/>
        <div style={{position:"absolute",bottom:-60,left:-30,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.03)"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,marginBottom:6,textTransform:"uppercase"}}>Grant Intelligence Dashboard</div>
              <div style={{fontSize:24,fontWeight:700,marginBottom:4}}>{profile.org||"Your Organization"}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",marginBottom:12}}>{todayFull()}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{background:"rgba(39,167,98,0.18)",color:"#4ade80",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>✦ ZERO Overhead</span>
                <span style={{background:"rgba(184,146,29,0.15)",color:C.goldBright,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>100% Volunteer-Run</span>
              </div>
            </div>
            <button style={btn("primary",{fontSize:12})} onClick={()=>setTab("funders")}>View Pipeline →</button>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20}}>
        {metrics.map(m=>(
          <div key={m.label} style={card({textAlign:"center",padding:18,background:m.accent,border:"1px solid rgba(0,0,0,0.06)"})}>
            <div style={{fontSize:24,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:28,fontWeight:800,color:m.color,lineHeight:1}}>{m.value}</div>
            <div style={{fontSize:11,fontWeight:600,color:C.text,marginTop:2}}>{m.label}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text}}>📊 Pipeline Summary</div>
          {stageOrder.map(s=>{
            const cfg=configs[s];
            return(
              <div key={s} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:cfg.bg,border:`1px solid ${cfg.border}`,marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:500,color:C.text,textTransform:"capitalize"}}>{s}</span>
                <span style={{fontSize:16,fontWeight:800,color:cfg.tc}}>{stageCounts[s]||0}</span>
              </div>
            );
          })}
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text}}>⏰ Urgent Deadlines</div>
          {near.length===0&&<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"20px 0"}}>No urgent deadlines 🎉</div>}
          {near.map(f=>{
            const d=daysUntil(f.deadline);
            return(
              <div key={f.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{f.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{fmtDate(f.deadline)}</div>
                </div>
                <span style={badge(d<=7?"red":d<=21?"amber":"green")}>{d}d</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card()}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text}}>⚡ Quick Actions</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {[["🤝","Add Funder","funders"],["☀️","Daily Plan","daily"],["✍️","Write Grant","writing"],["💛","View Donors","donors"]].map(([ico,lbl2,t])=>(
            <button key={t} style={btn("outline",{fontSize:12,padding:"9px 16px"})} onClick={()=>setTab(t)}>{ico} {lbl2}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── DailyPlan ───────────────────────────────────────────────────────────── */
function DailyPlan({profile,funders,tasks,apiKey}){
  const [plan,setPlan]=useState(null);
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState("");

  async function generatePlan(){
    if(!apiKey){setError("Add your Anthropic API key in Settings to generate AI plans.");return;}
    setLoading(true);setError("");setProgress(0);
    const iv=setInterval(()=>setProgress(p=>Math.min(p+7,90)),400);
    try{
      const urgentFunders=funders.filter(f=>f.deadline&&daysUntil(f.deadline)<=30&&f.stage!=="won"&&f.stage!=="lost").slice(0,3);
      const urgentTasks=tasks.filter(t=>!t.done&&t.priority==="high").slice(0,3);
      const prompt=`You are a grant strategy advisor for ${profile.org||"a nonprofit"}. Generate a focused daily action plan in JSON.
Organization: ${profile.org||"Nonprofit"}
Mission: ${profile.mission||"Community support"}
Today: ${todayFull()}
Urgent funders (next 30 days): ${JSON.stringify(urgentFunders.map(f=>({name:f.name,stage:f.stage,daysLeft:daysUntil(f.deadline)})))}
High priority tasks: ${JSON.stringify(urgentTasks.map(t=>t.text))}
Return valid JSON only:
{"greeting":"motivational one-liner","focusTheme":"today's strategic theme","featuredFunder":{"name":"","type":"","location":"","assets":"","focus":"","stage":"","urgencyNote":""},"sprintItems":[{"time":"9:00 AM","action":"","reason":"","duration":"30 min"}],"messagingAngle":"key value proposition for today","boardHook":"one compelling hook for board outreach","closingMotto":"inspiring sign-off"}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:1200,messages:[{role:"user",content:prompt}]})});
      if(!res.ok)throw new Error(`API error ${res.status}`);
      const data=await res.json();
      const text=data.content[0].text;
      const match=text.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("No JSON in response");
      setPlan(JSON.parse(match[0]));setProgress(100);
    }catch(e){setError(e.message||"Failed to generate plan");}
    clearInterval(iv);setLoading(false);
  }

  return(
    <div>
      <div style={card({background:"linear-gradient(135deg,#111113,#1a1a1f)",color:C.white,marginBottom:20,border:"1px solid rgba(255,255,255,0.08)"})}>
        <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>AI Daily Briefing</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:8}}>☀️ Good Morning, {(profile.org||"Team").split(" ")[0]}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",marginBottom:16}}>{todayFull()}</div>
        <button style={btn("primary")} onClick={generatePlan} disabled={loading}>{loading?"⏳ Generating...":"✨ Generate Today's Plan"}</button>
        {loading&&<div style={{marginTop:16,height:3,background:"rgba(255,255,255,0.10)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.goldBright},${C.gold})`,transition:"width 0.4s",borderRadius:2}}/></div>}
      </div>
      {error&&<div style={card({background:C.redL,border:`1px solid ${C.red}`,color:C.red,marginBottom:16})}>{error}</div>}
      {plan&&(
        <div>
          <div style={card({marginBottom:16,borderLeft:`4px solid ${C.gold}`})}>
            <div style={{fontSize:13,color:C.gold,fontWeight:700,marginBottom:4}}>{plan.focusTheme}</div>
            <div style={{fontSize:15,fontWeight:600,color:C.text}}>{plan.greeting}</div>
          </div>
          {plan.featuredFunder&&(
            <div style={card({marginBottom:16,background:C.goldL,border:"1px solid rgba(184,146,29,0.25)"})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Featured Funder Today</div>
                  <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:2}}>{plan.featuredFunder.name}</div>
                  <div style={{fontSize:13,color:C.muted,marginBottom:4}}>{plan.featuredFunder.type} · {plan.featuredFunder.location}</div>
                  <div style={{fontSize:13,color:C.green,fontWeight:600}}>Assets: {plan.featuredFunder.assets}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span style={badge("amber")}>{plan.featuredFunder.stage}</span>
                  <div style={{fontSize:12,color:C.amber,marginTop:6}}>{plan.featuredFunder.urgencyNote}</div>
                </div>
              </div>
            </div>
          )}
          <div style={card({marginBottom:16})}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14,color:C.text}}>🏃 Today's Sprint</div>
            {(plan.sprintItems||[]).map((item,i)=>(
              <div key={i} style={{display:"flex",gap:14,marginBottom:12,alignItems:"flex-start"}}>
                <div style={{minWidth:32,height:32,borderRadius:"50%",background:"rgba(184,146,29,0.12)",border:"1px solid rgba(184,146,29,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.gold,flexShrink:0}}>{i+1}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{item.time} · {item.action}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{item.reason}</div>
                  <div style={{fontSize:11,color:C.mutedL,marginTop:1}}>⏱ {item.duration}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            <div style={card({background:C.blueL,border:"1px solid rgba(34,86,212,0.15)"})}>
              <div style={{fontSize:11,fontWeight:700,color:C.blue,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}}>💬 Messaging Angle</div>
              <div style={{fontSize:13,color:C.text}}>{plan.messagingAngle}</div>
            </div>
            <div style={card({background:C.goldL,border:"1px solid rgba(184,146,29,0.20)"})}>
              <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}}>🎯 Board Hook</div>
              <div style={{fontSize:13,color:C.text}}>{plan.boardHook}</div>
            </div>
          </div>
          <div style={card({textAlign:"center",background:C.navy,color:C.white,border:"none"})}>
            <div style={{fontSize:16,fontStyle:"italic",color:C.goldBright}}>"{plan.closingMotto}"</div>
          </div>
        </div>
      )}
      {!plan&&!loading&&(
        <div style={card({textAlign:"center",padding:60,color:C.muted})}>
          <div style={{fontSize:40,marginBottom:12}}>🌅</div>
          <div style={{fontSize:15,fontWeight:600,color:C.textL,marginBottom:6}}>Ready to plan your day</div>
          <div style={{fontSize:13}}>Click "Generate Today's Plan" for an AI-powered briefing</div>
        </div>
      )}
    </div>
  );
}

/* ─── CompetitiveBriefModal ───────────────────────────────────────────────── */
function CompetitiveBriefModal({funder,profile,apiKey,onClose}){
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{if(funder)analyze();},[funder]);

  async function analyze(){
    if(!apiKey){setError("API key required.");return;}
    setLoading(true);setError("");setResult(null);
    try{
      const prompt=`You are a nonprofit grant strategy expert. Analyze this funder for ${profile.org||"our nonprofit"}.
Funder: ${funder.name}
Type: ${funder.type}
Focus: ${funder.focus}
Assets: ${funder.assets}
Grant Range: ${funder.grantRange}
Stage: ${funder.stage}
Notes: ${funder.notes||"None"}
Our org: ${profile.org}
Mission: ${profile.mission||""}
Programs: ${profile.programs||""}
Outcomes: ${profile.outcomeStatement||""}
Return JSON only:
{"matchScore":85,"matchRationale":"2-3 sentences","strategicAngle":"key positioning statement","openingHook":"compelling first sentence for LOI","boardMessaging":["point 1","point 2","point 3"],"risks":["risk 1","risk 2"],"nextSteps":["step 1","step 2","step 3"],"suggestedAsk":"$75,000","sources":["source note 1","source note 2"]}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      if(!res.ok)throw new Error(`API ${res.status}`);
      const data=await res.json();
      const text=data.content[0].text;
      const match=text.match(/\{[\s\S]*\}/);
      if(!match)throw new Error("No JSON");
      setResult(JSON.parse(match[0]));
    }catch(e){setError(e.message);}
    setLoading(false);
  }

  const score=result?.matchScore||0;
  const scoreColor=score>=80?C.green:score>=60?C.amber:C.red;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(6,10,20,0.72)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#FFFFFF",borderRadius:18,width:"100%",maxWidth:680,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:`linear-gradient(135deg,${C.navyDeep} 0%,${C.navyXL} 100%)`,borderRadius:"18px 18px 0 0",padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,color:C.goldBright,fontWeight:600,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Strategic Analysis</div>
            <div style={{fontSize:18,fontWeight:700,color:C.white}}>{funder.name}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>{funder.type} · {funder.assets}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"none",color:C.white,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:24}}>
          {loading&&<div style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:28,marginBottom:12}}>⚙️</div><div style={{fontSize:14}}>Analyzing funder profile…</div></div>}
          {error&&<div style={{padding:14,background:C.redL,borderRadius:9,color:C.red,marginBottom:16}}>{error}<br/><button style={btn("outline",{marginTop:8,fontSize:12})} onClick={analyze}>Retry</button></div>}
          {result&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:16,background:C.surfaceXL,borderRadius:12}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(0,0,0,0.05)",border:`3px solid ${scoreColor}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:20,fontWeight:800,color:scoreColor}}>{score}</span>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:3}}>Match Score</div>
                  <div style={{fontSize:12,color:C.muted}}>{result.matchRationale}</div>
                </div>
              </div>
              <div style={{padding:"12px 14px",background:C.goldL,borderLeft:`3px solid ${C.gold}`,borderRadius:"0 8px 8px 0",marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>Opening Hook</div>
                <div style={{fontSize:13,fontStyle:"italic",color:C.text}}>"{result.openingHook}"</div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:6}}>Strategic Angle</div>
                <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{result.strategicAngle}</div>
              </div>
              {result.boardMessaging&&result.boardMessaging.length>0&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:8}}>Board Messaging Points</div>
                  {result.boardMessaging.map((p,i)=>(
                    <div key={i} style={{padding:"8px 12px",background:C.bg,borderLeft:`3px solid ${C.blue}`,borderRadius:"0 8px 8px 0",marginBottom:6,fontSize:13,color:C.text}}>• {p}</div>
                  ))}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:8}}>⚠️ Risks</div>
                  {(result.risks||[]).map((r,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"6px 10px",background:C.redL,borderRadius:7,marginBottom:5}}>{r}</div>)}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:8}}>✅ Next Steps</div>
                  {(result.nextSteps||[]).map((s,i)=><div key={i} style={{fontSize:12,color:C.text,padding:"6px 10px",background:C.greenL,borderRadius:7,marginBottom:5}}>{i+1}. {s}</div>)}
                </div>
              </div>
              {result.suggestedAsk&&(
                <div style={{textAlign:"center",padding:14,background:C.goldL,border:"1px solid rgba(184,146,29,0.25)",borderRadius:10,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:0.5,textTransform:"uppercase",marginBottom:4}}>Suggested Ask</div>
                  <div style={{fontSize:24,fontWeight:800,color:C.gold}}>{result.suggestedAsk}</div>
                </div>
              )}
              {result.sources&&result.sources.length>0&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",marginBottom:8}}>📎 Sources & Notes</div>
                  {result.sources.map((s,i)=>(
                    <div key={i} style={{fontSize:12,color:C.muted,padding:"6px 10px",background:C.surfaceXL,borderRadius:7,marginBottom:4,borderLeft:`2px solid ${C.border}`}}>{s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── FundersPipeline ─────────────────────────────────────────────────────── */
function FundersPipeline({funders,setFunders,profile,apiKey}){
  const [activeStage,setActiveStage]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [analyzingId,setAnalyzingId]=useState(null);
  const [form,setForm]=useState({name:"",type:"Family Foundation",location:"",assets:"",grantRange:"",focus:"",contact:"",stage:"prospect",catholic:false,deadline:"",notes:""});

  const stages=["all","prospect","active","submitted","won","lost"];
  const visible=activeStage==="all"?funders:funders.filter(f=>f.stage===activeStage);

  function openAdd(){setEditing(null);setForm({name:"",type:"Family Foundation",location:"",assets:"",grantRange:"",focus:"",contact:"",stage:"prospect",catholic:false,deadline:"",notes:""});setShowForm(true);}
  function openEdit(f){setEditing(f.id);setForm({...f});setShowForm(true);}
  function saveForm(){
    if(!form.name.trim())return;
    if(editing){setFunders(prev=>prev.map(f=>f.id===editing?{...f,...form}:f));}
    else{setFunders(prev=>[{id:uid(),...form},...prev]);}
    setShowForm(false);
  }
  function deleteFunder(id){setFunders(prev=>prev.filter(f=>f.id!==id));}
  function stageColor(s){return s==="won"?C.green:s==="lost"?C.muted:s==="submitted"?C.gold:s==="active"?C.amber:C.blue;}

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>🤝 Funders Pipeline</div>
          <div style={{fontSize:13,color:C.muted}}>{funders.length} funders · {funders.filter(f=>f.stage==="active").length} active</div>
        </div>
        <button style={btn("navy")} onClick={openAdd}>+ Add Funder</button>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {stages.map(s=>(
          <button key={s} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${activeStage===s?C.navy:C.border}`,background:activeStage===s?C.navy:"transparent",color:activeStage===s?C.white:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}} onClick={()=>setActiveStage(s)}>{s}</button>
        ))}
      </div>

      <div style={card({background:C.goldL,border:"1px solid rgba(184,146,29,0.22)",marginBottom:16,padding:14})}>
        <div style={{fontSize:12,color:C.gold,fontWeight:700,marginBottom:2}}>💡 Discovery Tip</div>
        <div style={{fontSize:12,color:C.textL}}>Click Analyze on any funder card for an AI-generated match score, strategy brief, and suggested ask amount.</div>
      </div>

      {visible.length===0&&(
        <div style={card({textAlign:"center",padding:50,color:C.muted})}>
          <div style={{fontSize:36,marginBottom:12}}>🔍</div>
          <div style={{fontSize:14,fontWeight:600,color:C.textL}}>No funders in "{activeStage}"</div>
          <button style={btn("navy",{marginTop:12})} onClick={openAdd}>Add Your First Funder</button>
        </div>
      )}

      <div style={{display:"grid",gap:14}}>
        {visible.map(f=>{
          const d=f.deadline?daysUntil(f.deadline):null;
          const urgency=d!==null&&d<=14&&f.stage!=="won"&&f.stage!=="lost";
          return(
            <div key={f.id} style={card({borderLeft:`4px solid ${stageColor(f.stage)}`})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                    <div style={{fontSize:16,fontWeight:700,color:C.text}}>{f.name}</div>
                    <span style={badge(f.stage==="won"?"green":f.stage==="lost"?"gray":f.stage==="submitted"?"gold":f.stage==="active"?"amber":"blue")}>{f.stage}</span>
                    {f.catholic&&<span style={{...badge("blue"),background:"rgba(26,61,122,0.07)"}}>⛪ Catholic</span>}
                    {urgency&&<span style={badge("red")}>🔥 {d}d left</span>}
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:6}}>
                    {f.type} · {f.location}{f.assets&&` · ${f.assets}`}{f.grantRange&&` · ${f.grantRange}`}
                  </div>
                  {f.focus&&<div style={{fontSize:12,color:C.textL,marginBottom:6}}>🎯 {f.focus}</div>}
                  {f.contact&&<div style={{fontSize:12,color:C.muted,marginBottom:6}}>📧 {parseContact(f.contact)}</div>}
                  {f.deadline&&<div style={{fontSize:12,color:urgency?C.red:C.muted}}>📅 Deadline: {fmtDate(f.deadline)}</div>}
                  {f.notes&&<div style={{fontSize:12,color:C.textL,marginTop:8,padding:"8px 10px",background:C.surfaceXL,borderRadius:7,borderLeft:`2px solid ${C.border}`}}>{f.notes}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  <button style={btn("primary",{fontSize:11,padding:"7px 12px"})} onClick={()=>setAnalyzingId(f.id)}>Analyze</button>
                  <button style={btn("outline",{fontSize:11,padding:"7px 12px"})} onClick={()=>openEdit(f)}>Edit</button>
                  <button style={{...btn("outline",{fontSize:11,padding:"7px 12px"}),color:C.red}} onClick={()=>deleteFunder(f.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowForm(false)}>
          <div style={{background:C.surface,borderRadius:16,width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",padding:24}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:18}}>{editing?"Edit Funder":"Add Funder"}</div>
            {[["Funder Name","name"],["Type","type"],["Location","location"],["Assets","assets"],["Grant Range","grantRange"],["Focus Areas","focus"],["Contact","contact"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:12}}>
                <label style={lbl()}>{l}</label>
                <input style={inp()} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={l}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={lbl()}>Stage</label>
              <select style={inp()} value={form.stage} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>
                {["prospect","active","submitted","won","lost"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lbl()}>Deadline</label>
              <input type="date" style={inp()} value={form.deadline||""} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lbl()}>Notes</label>
              <textarea style={inp({minHeight:70,resize:"vertical"})} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Strategy notes, connections, etc."/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:C.text}}>
                <input type="checkbox" checked={!!form.catholic} onChange={e=>setForm(p=>({...p,catholic:e.target.checked}))}/>
                Catholic-affiliated funder
              </label>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button style={btn("navy",{flex:1})} onClick={saveForm}>{editing?"Save Changes":"Add Funder"}</button>
              <button style={btn("outline",{flex:1})} onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {analyzingId&&(
        <CompetitiveBriefModal funder={funders.find(f=>f.id===analyzingId)} profile={profile} apiKey={apiKey} onClose={()=>setAnalyzingId(null)}/>
      )}
    </div>
  );
}

/* ─── CalendarView ────────────────────────────────────────────────────────── */
function CalendarView({events,setEvents}){
  const [year,setYear]=useState(new Date().getFullYear());
  const [month,setMonth]=useState(new Date().getMonth());
  const [showForm,setShowForm]=useState(false);
  const [selDate,setSelDate]=useState("");
  const [form,setForm]=useState({title:"",date:"",color:"#B8921D",notes:""});
  const [editing,setEditing]=useState(null);

  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=new Date(year,month).toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const today=todayISO();

  function openDay(d){
    const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    setSelDate(ds);setEditing(null);setForm({title:"",date:ds,color:"#B8921D",notes:""});setShowForm(true);
  }
  function openEdit(ev){setEditing(ev.id);setForm({...ev});setSelDate(ev.date);setShowForm(true);}
  function saveEvent(){
    if(!form.title.trim())return;
    if(editing){setEvents(prev=>prev.map(e=>e.id===editing?{...e,...form}:e));}
    else{setEvents(prev=>[...prev,{id:uid(),...form}]);}
    setShowForm(false);
  }
  function deleteEvent(id){setEvents(prev=>prev.filter(e=>e.id!==id));}

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:700,color:C.text}}>📅 {monthName}</div>
        <div style={{display:"flex",gap:8}}>
          <button style={btn("outline",{padding:"7px 12px"})} onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}}>◀</button>
          <button style={btn("outline",{padding:"7px 12px"})} onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}}>▶</button>
        </div>
      </div>
      <div style={card({background:C.surfaceL,padding:0,overflow:"hidden"})}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:C.surfaceXL,borderBottom:`1px solid ${C.border}`}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i} style={{minHeight:80,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,0.01)"}}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const day=i+1;
            const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday=ds===today;
            const dayEvents=events.filter(e=>e.date===ds);
            return(
              <div key={day} onClick={()=>openDay(day)} style={{minHeight:80,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:6,cursor:"pointer",background:isToday?"rgba(184,146,29,0.08)":"transparent",transition:"background 0.1s"}}>
                <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?C.gold:C.text,marginBottom:4,width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isToday?C.goldL:"transparent"}}>{day}</div>
                {dayEvents.map(ev=>(
                  <div key={ev.id} onClick={e=>{e.stopPropagation();openEdit(ev);}} style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:ev.color||C.gold,color:"#fff",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}}>{ev.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowForm(false)}>
          <div style={{background:C.surface,borderRadius:14,width:"100%",maxWidth:400,padding:22,boxShadow:"0 10px 40px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:16}}>{editing?"Edit Event":"Add Event"} · {selDate}</div>
            <div style={{marginBottom:12}}><label style={lbl()}>Title</label><input style={inp()} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Event title" autoFocus/></div>
            <div style={{marginBottom:12}}><label style={lbl()}>Date</label><input type="date" style={inp()} value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div style={{marginBottom:12}}>
              <label style={lbl()}>Color</label>
              <div style={{display:"flex",gap:8}}>
                {["#B8921D","#2256D4","#1A7A52","#BE3A2B","#7C3AED","#C97B0F"].map(col=>(
                  <div key={col} onClick={()=>setForm(p=>({...p,color:col}))} style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:`2px solid ${form.color===col?C.text:"transparent"}`}}/>
                ))}
              </div>
            </div>
            <div style={{marginBottom:18}}><label style={lbl()}>Notes</label><textarea style={inp({minHeight:60,resize:"vertical"})} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Notes"/></div>
            <div style={{display:"flex",gap:8}}>
              <button style={btn("navy",{flex:1})} onClick={saveEvent}>{editing?"Save":"Add"}</button>
              {editing&&<button style={{...btn("outline",{flex:1}),color:C.red}} onClick={()=>{deleteEvent(editing);setShowForm(false);}}>Delete</button>}
              <button style={btn("outline",{flex:1})} onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TasksView ───────────────────────────────────────────────────────────── */
function TasksView({tasks,setTasks}){
  const [filter,setFilter]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({text:"",priority:"medium",due:"",tag:""});

  const priorities=["all","high","medium","low"];
  const visible=filter==="all"?tasks:tasks.filter(t=>t.priority===filter);
  const incomplete=visible.filter(t=>!t.done);
  const done=visible.filter(t=>t.done);

  function toggleDone(id){setTasks(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));}
  function deleteTask(id){setTasks(prev=>prev.filter(t=>t.id!==id));}
  function addTask(){
    if(!form.text.trim())return;
    setTasks(prev=>[{id:uid(),...form,done:false},...prev]);
    setForm({text:"",priority:"medium",due:"",tag:""});setShowForm(false);
  }

  const TaskRow=({t})=>{
    const overdue=!t.done&&t.due&&daysUntil(t.due)<0;
    return(
      <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",background:t.done?"rgba(0,0,0,0.02)":C.surface,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:6,opacity:t.done?0.6:1}}>
        <div onClick={()=>toggleDone(t.id)} style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${t.done?C.green:C.border}`,background:t.done?C.green:"transparent",cursor:"pointer",marginTop:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {t.done&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:500,color:t.done?C.muted:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
          <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
            <span style={badge(t.priority==="high"?"red":t.priority==="medium"?"amber":"gray",{fontSize:10})}>{t.priority}</span>
            {t.tag&&<span style={badge("blue",{fontSize:10})}>{t.tag}</span>}
            {t.due&&<span style={{fontSize:11,color:overdue?C.red:C.muted}}>📅 {fmtDate(t.due)}{overdue?" (overdue)":""}</span>}
          </div>
        </div>
        <button onClick={()=>deleteTask(t.id)} style={{background:"transparent",border:"none",color:C.mutedL,cursor:"pointer",fontSize:14,padding:"2px 4px"}}>✕</button>
      </div>
    );
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:C.text}}>✅ Tasks</div>
          <div style={{fontSize:13,color:C.muted}}>{incomplete.length} remaining · {done.length} completed</div>
        </div>
        <button style={btn("navy")} onClick={()=>setShowForm(!showForm)}>+ Add Task</button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {priorities.map(p=>(
          <button key={p} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===p?C.navy:C.border}`,background:filter===p?C.navy:"transparent",color:filter===p?C.white:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}} onClick={()=>setFilter(p)}>{p}</button>
        ))}
      </div>
      {showForm&&(
        <div style={card({marginBottom:16,border:`1px solid ${C.gold}`,background:C.goldL})}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>New Task</div>
          <input style={inp({marginBottom:10})} placeholder="Task description…" value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))} autoFocus/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            <select style={inp()} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
            <input type="date" style={inp()} value={form.due} onChange={e=>setForm(p=>({...p,due:e.target.value}))}/>
            <input style={inp()} placeholder="Tag" value={form.tag} onChange={e=>setForm(p=>({...p,tag:e.target.value}))}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={btn("navy",{flex:1})} onClick={addTask}>Add Task</button>
            <button style={btn("outline",{flex:1})} onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {incomplete.length===0&&<div style={card({textAlign:"center",padding:40,color:C.muted,marginBottom:12})}><div style={{fontSize:30,marginBottom:8}}>🎉</div>All caught up!</div>}
      {incomplete.map(t=><TaskRow key={t.id} t={t}/>)}
      {done.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5,textTransform:"uppercase",margin:"16px 0 8px"}}>Completed</div>
          {done.map(t=><TaskRow key={t.id} t={t}/>)}
        </div>
      )}
    </div>
  );
}

/* ─── WritingStudio ───────────────────────────────────────────────────────── */
function WritingStudio({profile,funders,apiKey}){
  const [docType,setDocType]=useState("LOI");
  const [selectedFunder,setSelectedFunder]=useState(funders[0]?.id||"");
  const [output,setOutput]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [wordCount,setWordCount]=useState(0);

  useEffect(()=>{setWordCount(output.trim()?output.trim().split(/\s+/).length:0);},[output]);

  const docTypes=["LOI","Grant Narrative","Thank You Letter","Impact Report","Executive Summary","Follow-Up Email"];
  const funder=funders.find(f=>f.id===selectedFunder)||funders[0];

  async function generate(){
    if(!apiKey){setError("Add your API key in Settings.");return;}
    setLoading(true);setError("");setOutput("");
    try{
      const prompt=`Write a professional ${docType} for ${profile.org||"a nonprofit"}.
${funder?`Funder: ${funder.name} (${funder.type}), Focus: ${funder.focus}, Grant Range: ${funder.grantRange}`:""}
Organization: ${profile.org}
Mission: ${profile.mission||""}
Programs: ${profile.programs||""}
Outcomes: ${profile.outcomeStatement||""}
Budget: ${profile.budget||""}
Write in a warm, professional, compelling tone. Be specific and outcome-focused. 600-800 words.`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-opus-4-5",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
      if(!res.ok)throw new Error(`API ${res.status}`);
      const data=await res.json();
      setOutput(data.content[0].text);
    }catch(e){setError(e.message);}
    setLoading(false);
  }

  return(
    <div>
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:20,border:"none"})}>
        <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>AI Writing Studio</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>✍️ Grant Writing</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>AI-powered drafts for {profile.org||"your organization"}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div><label style={lbl()}>Document Type</label><select style={inp()} value={docType} onChange={e=>setDocType(e.target.value)}>{docTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div><label style={lbl()}>Target Funder</label><select style={inp()} value={selectedFunder} onChange={e=>setSelectedFunder(e.target.value)}>{funders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}<option value="">General</option></select></div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        <button style={btn("primary")} onClick={generate} disabled={loading}>{loading?"⏳ Writing…":"✨ Generate Draft"}</button>
        {output&&<button style={btn("outline")} onClick={()=>navigator.clipboard.writeText(output)}>📋 Copy</button>}
      </div>
      {error&&<div style={card({background:C.redL,border:`1px solid ${C.red}`,color:C.red,marginBottom:14})}>{error}</div>}
      {output&&(
        <div style={card()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text}}>{docType} Draft</div>
            <span style={badge("gray")}>{wordCount} words</span>
          </div>
          <textarea value={output} onChange={e=>setOutput(e.target.value)} style={inp({minHeight:400,resize:"vertical",fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.8,background:C.surfaceXL})}/>
          <button style={btn("outline",{marginTop:12,fontSize:12})} onClick={()=>navigator.clipboard.writeText(output)}>📋 Copy to Clipboard</button>
        </div>
      )}
      {!output&&!loading&&(
        <div style={card({textAlign:"center",padding:60,color:C.muted})}>
          <div style={{fontSize:40,marginBottom:12}}>📝</div>
          <div style={{fontSize:14,fontWeight:600,color:C.textL,marginBottom:6}}>Ready to write</div>
          <div style={{fontSize:13}}>Select a document type and click Generate Draft</div>
        </div>
      )}
    </div>
  );
}

/* ─── Portfolio ───────────────────────────────────────────────────────────── */
function Portfolio({profile,setProfile}){
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({...profile});

  function saveProfile(){setProfile(p=>({...p,...form}));setEditing(false);}

  const FieldRow=({label,field,multi=false})=>(
    <div style={{marginBottom:14}}>
      <label style={lbl()}>{label}</label>
      {editing?(
        multi?<textarea style={inp({minHeight:80,resize:"vertical"})} value={form[field]||""} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}/>
             :<input style={inp()} value={form[field]||""} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}/>
      ):(
        <div style={{fontSize:13,color:C.text,lineHeight:1.6,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
          {field==="website"&&profile[field]
            ?<a href={profile[field]} target="_blank" rel="noopener noreferrer" style={{color:C.blue,fontWeight:600,textDecoration:"none"}}>{profile[field]}</a>
            :profile[field]||<span style={{color:C.mutedL}}>Not set</span>}
        </div>
      )}
    </div>
  );

  return(
    <div>
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:20,border:"none"})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>Organization Profile</div>
            <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>🌿 {profile.org||"Your Organization"}</div>
            {profile.website&&<a href={profile.website} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:C.goldBright,textDecoration:"none"}}>{profile.website} ↗</a>}
          </div>
          <button style={btn("primary")} onClick={()=>editing?saveProfile():setEditing(true)}>{editing?"💾 Save Profile":"✏️ Edit Profile"}</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:16,color:C.text}}>Organization Details</div>
          <FieldRow label="Organization Name" field="org"/>
          <FieldRow label="EIN" field="ein"/>
          <FieldRow label="Founded" field="founded"/>
          <FieldRow label="Website" field="website"/>
          <FieldRow label="Email" field="email"/>
          <FieldRow label="Phone" field="phone"/>
        </div>
        <div style={card()}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:16,color:C.text}}>Impact & Programs</div>
          <FieldRow label="Mission Statement" field="mission" multi/>
          <FieldRow label="Programs" field="programs" multi/>
          <FieldRow label="Outcome Statement" field="outcomeStatement" multi/>
          <FieldRow label="Geographic Focus" field="geographicFocus"/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginTop:16}}>
        {[["👨‍👩‍👧‍👦","Families Served","families"],["🙋","Volunteers","volunteers"],["💰","Annual Budget","budget"],["👥","Board Size","boardSize"],["🌍","Board Diversity","boardDiversity"],["👤","Staff FTE","staffFTE"]].map(([icon,lbl2,field])=>(
          <div key={field} style={card({textAlign:"center",padding:16})}>
            <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
            {editing?<input style={inp({textAlign:"center",fontSize:18,fontWeight:700})} value={form[field]||""} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}/>
                    :<div style={{fontSize:20,fontWeight:800,color:C.text}}>{profile[field]||"—"}</div>}
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{lbl2}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DonorHub ────────────────────────────────────────────────────────────── */
function DonorHub({donors,setDonors}){
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({name:"",type:"Major Donor",amount:"",lastGift:"",notes:"",socials:"",phone:"",email:""});

  function openAdd(){setEditing(null);setForm({name:"",type:"Major Donor",amount:"",lastGift:"",notes:"",socials:"",phone:"",email:""});setShowForm(true);}
  function openEdit(d){setEditing(d.id);setForm({...d});setShowForm(true);}
  function save(){
    if(!form.name.trim())return;
    if(editing)setDonors(prev=>prev.map(d=>d.id===editing?{...d,...form}:d));
    else setDonors(prev=>[{id:uid(),...form},...prev]);
    setShowForm(false);
  }
  function del(id){setDonors(prev=>prev.filter(d=>d.id!==id));}

  return(
    <div>
      <div style={card({background:"linear-gradient(135deg,#111113,#1a1a1f)",color:C.white,marginBottom:20,border:"1px solid rgba(255,255,255,0.08)"})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>Relationship Management</div>
            <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>💛 DonorHub</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{donors.length} contacts</div>
          </div>
          <button style={btn("primary")} onClick={openAdd}>+ Add Contact</button>
        </div>
      </div>
      <div style={{display:"grid",gap:14}}>
        {donors.map(d=>(
          <div key={d.id} style={card()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                  <div style={{fontSize:16,fontWeight:700,color:C.text}}>{d.name}</div>
                  <span style={badge(d.type==="Major Donor"?"gold":d.type==="Faith Partner"?"blue":"green")}>{d.type}</span>
                </div>
                {d.amount&&<div style={{fontSize:13,fontWeight:600,color:C.green,marginBottom:4}}>💰 {d.amount}{d.lastGift&&<span style={{color:C.muted,fontWeight:400}}> · Last gift {fmtDate(d.lastGift)}</span>}</div>}
                <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:6}}>
                  {d.email&&<div style={{fontSize:12,color:C.muted}}>✉️ {parseContact(d.email)}</div>}
                  {d.phone&&<div style={{fontSize:12,color:C.muted}}>📞 {parseContact(d.phone)}</div>}
                  {d.socials&&<div style={{fontSize:12,color:C.muted}}>🌐 {parseContact(d.socials)}</div>}
                </div>
                {d.notes&&<div style={{fontSize:12,color:C.textL,padding:"8px 10px",background:C.surfaceXL,borderRadius:7,borderLeft:`2px solid ${C.border}`}}>{d.notes}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button style={btn("outline",{fontSize:11,padding:"7px 12px"})} onClick={()=>openEdit(d)}>Edit</button>
                <button style={{...btn("outline",{fontSize:11,padding:"7px 12px"}),color:C.red}} onClick={()=>del(d.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        <div style={card({background:C.bg,border:`1px dashed ${C.borderStr}`,textAlign:"center",padding:40})}>
          <div style={{fontSize:30,marginBottom:8}}>🌐</div>
          <div style={{fontSize:14,fontWeight:600,color:C.textL,marginBottom:6}}>GoForth Network</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Add donors, board members, and faith partners to build your relationship map.</div>
          <button style={btn("navy")} onClick={openAdd}>+ Add Contact</button>
        </div>
      </div>
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowForm(false)}>
          <div style={{background:C.surface,borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",padding:24,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>{editing?"Edit Contact":"Add Contact"}</div>
            {[["Name","name"],["Type","type"],["Gift Amount","amount"],["Email","email"],["Phone","phone"],["Website / Social","socials"]].map(([l,k])=>(
              <div key={k} style={{marginBottom:12}}>
                <label style={lbl()}>{l}</label>
                {k==="type"
                  ?<select style={inp()} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}>
                    {["Major Donor","Mid-Level Donor","Faith Partner","Board Member","Corporate Partner"].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  :<input style={inp()} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={l}/>}
              </div>
            ))}
            <div style={{marginBottom:12}}><label style={lbl()}>Last Gift Date</label><input type="date" style={inp()} value={form.lastGift||""} onChange={e=>setForm(p=>({...p,lastGift:e.target.value}))}/></div>
            <div style={{marginBottom:18}}><label style={lbl()}>Notes</label><textarea style={inp({minHeight:70,resize:"vertical"})} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Relationship notes, giving history, interests"/></div>
            <div style={{display:"flex",gap:8}}>
              <button style={btn("navy",{flex:1})} onClick={save}>{editing?"Save":"Add"}</button>
              <button style={btn("outline",{flex:1})} onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Settings ────────────────────────────────────────────────────────────── */
function Settings({profile,setProfile,apiKey,setApiKey}){
  const [key,setKey]=useState(apiKey||"");
  const [saved,setSaved]=useState(false);
  const [orgForm,setOrgForm]=useState({...profile});

  function saveAll(){
    setApiKey(key);save("gf_apikey",key);
    setProfile(p=>({...p,...orgForm}));save("gf_profile",{...profile,...orgForm});
    setSaved(true);setTimeout(()=>setSaved(false),2500);
  }

  return(
    <div>
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:20,border:"none"})}>
        <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>Configuration</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>⚙️ Settings</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Manage your API keys and organization defaults</div>
      </div>
      <div style={card({marginBottom:16})}>
        <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:4}}>🔑 Anthropic API Key</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Required for AI features. Get yours at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{color:C.blue}}>console.anthropic.com</a></div>
        <input type="password" style={inp({marginBottom:10,fontFamily:"monospace"})} value={key} onChange={e=>setKey(e.target.value)} placeholder="sk-ant-..."/>
        {apiKey&&<div style={{fontSize:12,color:C.green}}>✅ API key is set · AI features enabled</div>}
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:14}}>🌿 Organization Defaults</div>
        {[["Organization Name","org"],["Mission Statement","mission"],["Programs","programs"],["Current Funding Mix","currentFunding"],["Outcome Statement","outcomeStatement"]].map(([l,k])=>(
          <div key={k} style={{marginBottom:12}}>
            <label style={lbl()}>{l}</label>
            <textarea style={inp({minHeight:60,resize:"vertical"})} value={orgForm[k]||""} onChange={e=>setOrgForm(p=>({...p,[k]:e.target.value}))}/>
          </div>
        ))}
      </div>
      <button
        style={{width:"100%",padding:"18px 24px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:16,letterSpacing:0.3,
          background:saved?"linear-gradient(135deg,#1A7A52,#14613F)":`linear-gradient(135deg,${C.goldBright},${C.gold})`,
          color:saved?"#FFFFFF":"#1C1917",
          boxShadow:saved?"0 4px 20px rgba(26,122,82,0.30)":"0 4px 20px rgba(184,146,29,0.35)",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.25s"}}
        onClick={saveAll}
      >
        {saved?"✅ Settings Saved!":"💾 Save All Settings"}
      </button>
    </div>
  );
}

/* ─── HelpTab ─────────────────────────────────────────────────────────────── */
function HelpTab({setTab}){
  const faqs=[
    {q:"How do I get started?",a:"Go to Settings first — enter your Anthropic API key and fill in your organization details. Then visit Dashboard for an overview, add funders in the Pipeline, and use Writing Studio to draft your first grant."},
    {q:"Do I need an API key for basic features?",a:"No. Data entry, Funders Pipeline, Calendar, Tasks, Portfolio, and DonorHub all work without an API key. You only need one for AI features: Daily Plan, Funder Analysis, and Writing Studio."},
    {q:"Where do I get an Anthropic API key?",a:"Visit console.anthropic.com, create an account, and generate a key under API Keys. It starts with 'sk-ant-'. Paste it in Settings."},
    {q:"How does the AI Funder Analysis work?",a:"In the Funders Pipeline, click 'Analyze' on any funder card. Claude generates a match score, strategic angle, opening hook, board messaging points, risks, next steps, and a suggested ask."},
    {q:"Can I use this on mobile?",a:"Yes. On mobile you'll see a hamburger menu (☰) for the sidebar and a bottom navigation bar for quick access to your most-used tabs."},
    {q:"Is my data saved between sessions?",a:"Yes. All data is saved to your browser's localStorage automatically. Click Save All Settings in Settings to persist API key and org settings."},
    {q:"How do I add deadlines to the Dashboard?",a:"Add a Deadline date to any funder in the Pipeline. Funders with deadlines within 14 days automatically appear in the Dashboard's Urgent Deadlines section."},
    {q:"How do I write a grant LOI?",a:"Go to Writing Studio, select 'LOI', choose your target funder, and click Generate Draft. Edit the result in the text box, then copy to your word processor."},
  ];
  return(
    <div>
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:20,border:"none"})}>
        <div style={{fontSize:11,fontWeight:600,color:C.goldBright,letterSpacing:1.2,textTransform:"uppercase",marginBottom:6}}>Help & Documentation</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>❓ Quick Start Guide</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Everything you need to know about GoForth</div>
      </div>
      <div style={card({marginBottom:16})}>
        <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:16}}>🚀 Getting Started in 4 Steps</div>
        {[
          {n:"1",title:"Configure Settings",desc:"Add your Anthropic API key and fill in your organization's mission, programs, and outcomes.",tab:"settings"},
          {n:"2",title:"Add Funders",desc:"Populate your Funders Pipeline with prospects. More detail = better AI analysis.",tab:"funders"},
          {n:"3",title:"Generate Your Daily Plan",desc:"Each morning, visit Daily Plan and click Generate for an AI-powered briefing.",tab:"daily"},
          {n:"4",title:"Write Your First Grant",desc:"Use Writing Studio to draft an LOI in seconds. Edit, then paste into your word processor.",tab:"writing"},
        ].map(({n,title,desc,tab})=>(
          <div key={n} style={{display:"flex",gap:14,marginBottom:14,alignItems:"flex-start",cursor:"pointer"}} onClick={()=>setTab(tab)}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.goldBright},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#1C1917",flexShrink:0}}>{n}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:C.blue,marginBottom:2}}>{title} →</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={card({marginBottom:16})}>
        <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:14}}>📋 Feature Overview</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {icon:"🏠",name:"Dashboard",desc:"Metrics, pipeline summary, and urgent deadlines at a glance"},
            {icon:"🤝",name:"Funders Pipeline",desc:"Track prospects by stage; AI analysis per funder card"},
            {icon:"☀️",name:"Daily Plan",desc:"AI morning briefing with sprint items and messaging angles"},
            {icon:"📅",name:"Calendar",desc:"Grant deadlines and events in a monthly view"},
            {icon:"✅",name:"Tasks",desc:"Priority task management with tags, due dates, and filters"},
            {icon:"✍️",name:"Writing Studio",desc:"AI-generated LOIs, narratives, thank-you letters, and more"},
            {icon:"🌿",name:"Portfolio",desc:"Organization profile, impact stats, and program details"},
            {icon:"💛",name:"DonorHub",desc:"Donor and partner CRM with clickable contact links"},
          ].map(({icon,name,desc})=>(
            <div key={name} style={{padding:"10px 12px",background:C.surfaceXL,borderRadius:9,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:3}}>{icon} {name}</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={card()}>
        <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:14}}>💬 FAQ</div>
        {faqs.map(({q,a},i)=>(
          <div key={i} style={{marginBottom:16,paddingBottom:16,borderBottom:i<faqs.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:6}}>{q}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────────────────────────── */
export default function GoForth(){
  const [tab,setTab]=useState("dashboard");
  const [profile,setProfile]=useState(()=>load("gf_profile",DEF_PROFILE));
  const [funders,setFunders]=useState(()=>load("gf_funders",DEF_FUNDERS));
  const [tasks,setTasks]=useState(()=>load("gf_tasks",DEF_TASKS));
  const [events,setEvents]=useState(()=>load("gf_events",DEF_EVENTS));
  const [donors,setDonors]=useState(()=>load("gf_donors",DEF_DONORS));
  const [apiKey,setApiKey]=useState(()=>load("gf_apikey",""));
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [isMobile,setIsMobile]=useState(false);

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768);
    check();window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[]);

  useEffect(()=>{save("gf_funders",funders);},[funders]);
  useEffect(()=>{save("gf_tasks",tasks);},[tasks]);
  useEffect(()=>{save("gf_events",events);},[events]);
  useEffect(()=>{save("gf_donors",donors);},[donors]);

  const near=funders.filter(f=>f.deadline&&daysUntil(f.deadline)<=7&&f.stage!=="won"&&f.stage!=="lost");

  function renderTab(){
    switch(tab){
      case"dashboard":return<Dashboard profile={profile} funders={funders} tasks={tasks} setTab={setTab}/>;
      case"funders":return<FundersPipeline funders={funders} setFunders={setFunders} profile={profile} apiKey={apiKey}/>;
      case"daily":return<DailyPlan profile={profile} funders={funders} tasks={tasks} apiKey={apiKey}/>;
      case"calendar":return<CalendarView events={events} setEvents={setEvents}/>;
      case"tasks":return<TasksView tasks={tasks} setTasks={setTasks}/>;
      case"writing":return<WritingStudio profile={profile} funders={funders} apiKey={apiKey}/>;
      case"portfolio":return<Portfolio profile={profile} setProfile={setProfile}/>;
      case"donors":return<DonorHub donors={donors} setDonors={setDonors}/>;
      case"settings":return<Settings profile={profile} setProfile={setProfile} apiKey={apiKey} setApiKey={setApiKey}/>;
      case"help":return<HelpTab setTab={setTab}/>;
      default:return<Dashboard profile={profile} funders={funders} tasks={tasks} setTab={setTab}/>;
    }
  }

  const SidebarContent=()=>(
    <div style={{width:216,background:C.navy,height:"100%",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"20px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
          <span style={{fontSize:18}}>🌿</span>
          <span style={{fontSize:15,fontWeight:800,color:C.white,letterSpacing:0.2}}>GoForth</span>
        </div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:0.5,marginTop:2}}>GRANT INTELLIGENCE</div>
      </div>
      <nav style={{flex:1,overflowY:"auto",padding:"10px 8px"}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return(
            <div key={t.id}
              style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px 9px 8px",cursor:"pointer",
                color:active?"#fff":"rgba(255,255,255,0.55)",
                background:active?"rgba(255,255,255,0.09)":"transparent",
                borderRadius:8,borderLeft:active?`3px solid ${C.goldBright}`:"3px solid transparent",
                fontSize:12.5,fontWeight:active?600:400,transition:"all 0.12s",marginBottom:1}}
              onClick={()=>{setTab(t.id);if(isMobile)setSidebarOpen(false);}}>
              <span style={{fontSize:14}}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          );
        })}
      </nav>
      <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",lineHeight:1.5}}>GoForth v5.4<br/>AI-powered grant strategy</div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ── Desktop ── */}
      {!isMobile&&(
        <div style={{display:"flex",flex:1}}>
          <SidebarContent/>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{profile.org||"GoForth Ministries"}</div>
                <div style={{fontSize:11,color:C.muted}}>{todayFull()}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {near.slice(0,2).map(f=>{
                  const d=daysUntil(f.deadline);
                  return(
                    <div key={f.id} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:20,background:d<=3?C.redL:C.amberL,border:`1px solid ${d<=3?"rgba(190,58,43,0.20)":"rgba(201,123,15,0.20)"}`}}>
                      <span style={{fontSize:11,fontWeight:700,color:d<=3?C.red:C.amber}}>🔔 {f.name}</span>
                      <span style={badge(d<=3?"red":"amber",{fontSize:10})}>{d}d</span>
                    </div>
                  );
                })}
                {!apiKey&&<button style={btn("outline",{fontSize:11,padding:"6px 12px"})} onClick={()=>setTab("settings")}>⚙️ Setup API Key</button>}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:24}}>{renderTab()}</div>
          </div>
        </div>
      )}

      {/* ── Mobile ── */}
      {isMobile&&(
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"sticky",top:0,zIndex:50}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:C.text,lineHeight:1,padding:"4px"}}>☰</button>
            <div style={{fontSize:13,fontWeight:700,color:C.text}}>🌿 GoForth</div>
            {!apiKey
              ?<button style={btn("outline",{fontSize:10,padding:"5px 8px"})} onClick={()=>setTab("settings")}>Setup</button>
              :<div style={{width:36}}/>}
          </div>
          {sidebarOpen&&(
            <>
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99}} onClick={()=>setSidebarOpen(false)}/>
              <div style={{position:"fixed",left:0,top:0,height:"100%",zIndex:100,display:"flex"}}><SidebarContent/></div>
            </>
          )}
          <div style={{flex:1,overflowY:"auto",padding:16,paddingBottom:70}}>{renderTab()}</div>
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.navy,borderTop:"1px solid rgba(255,255,255,0.08)",display:"flex",zIndex:50,height:58}}>
            {BOTTOM_TABS.map(tid=>{
              const t=TABS.find(x=>x.id===tid);
              if(!t)return null;
              const active=tab===t.id;
              return(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,padding:"6px 0",color:active?C.goldBright:"rgba(255,255,255,0.45)",transition:"color 0.15s"}}>
                  <span style={{fontSize:16}}>{t.icon}</span>
                  <span style={{fontSize:9,fontWeight:active?700:400,letterSpacing:0.2}}>{t.label.split(" ")[0]}</span>
                </button>
              );
            })}
            <button onClick={()=>setSidebarOpen(true)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,padding:"6px 0",color:"rgba(255,255,255,0.45)"}}>
              <span style={{fontSize:16}}>⋯</span>
              <span style={{fontSize:9,fontWeight:400,letterSpacing:0.2}}>More</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};color:${C.text};line-height:1.5;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:3px;}
        input:focus,select:focus,textarea:focus{outline:2px solid ${C.gold};outline-offset:-1px;}
        button:disabled{opacity:0.5;cursor:not-allowed;}
        nav>div:hover:not([style*="rgba(255,255,255,0.09)"]){background:rgba(255,255,255,0.05)!important;color:rgba(255,255,255,0.88)!important;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>
    </div>
  );
}
