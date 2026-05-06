import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  // Deep dark surfaces — slight blue-black undertone for depth
  bg:"#080809",
  surface:"#0e0e10",
  surfaceL:"#141417",    // cards
  surfaceXL:"#1e1e22",   // hover/active states

  // Legacy nav aliases
  navy:"#0e0e10", navyL:"#141417", navyXL:"#1e1e22",
  navyDeep:"#060607",

  // Champagne gold — sophisticated, not garish
  gold:"#c9a96e", goldBright:"#d9bc8a",
  goldL:"rgba(201,169,110,0.11)", goldD:"#a07845",

  // Status
  green:"#22c55e", greenL:"rgba(34,197,94,0.10)",
  red:"#f43f5e",   redL:"rgba(244,63,94,0.10)",
  amber:"#f59e0b", amberL:"rgba(245,158,11,0.10)",
  blue:"#60a5fa",  blueL:"rgba(96,165,250,0.10)",

  // Typography — softer whites for less harshness
  white:"#ffffff",
  text:"#e8e8ec",
  muted:"#6b6b78",
  mutedL:"#9898a8",

  // Borders & shadows — more refined
  border:"rgba(255,255,255,0.06)",
  borderStr:"rgba(255,255,255,0.11)",
  shadow:"rgba(0,0,0,0.4)",
  shadowMd:"rgba(0,0,0,0.6)",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2,9);
const todayISO = () => new Date().toISOString().slice(0,10);
const todayFull = () => new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
const daysUntil = iso => Math.ceil((new Date(iso)-new Date(todayISO()))/86400000);
const fmtDate = iso => iso ? new Date(iso+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const priorityColor = p => p==="high"?"red":p==="medium"?"amber":"blue";

function load(key, def) {
  try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; } catch{ return def; }
}
function save(key, val) { try{ localStorage.setItem(key,JSON.stringify(val)); }catch{} }

/* ─── Defaults ────────────────────────────────────────────────────────────── */
const DEF_PROFILE = {
  name:"St. Teresa Center for the Works of Mercy",
  apostolate:"Pope John XXIII House for Women",
  ein:"81-3756179",
  address:"600 South Martin Luther King Drive",
  city:"Saint Martinville", state:"LA", zip:"70582",
  phone:"337-680-6271", website:"www.saintteresacenter.com",
  diocese:"Diocese of Lafayette",
  director:"Fr. Michael Champagne, CJC",
  founded:"2016",
  mission:"To provide free, dignified service to the poor of Saint Martinville through the corporal and spiritual works of mercy, restoring the dignity of every person in the spirit of Saint Mother Teresa of Calcutta.",
  programs:"Food pantry (450+ families/week), Soup kitchen (250 hot meals/Thursday), Pope John XXIII House for Women (19 women served in 2025), Don Bosco Oratory youth formation, Mother Drexel Wellness Center, Bonne Mort Society, St. Joseph the Worker",
  volunteers:"120", families:"450", mealsWeekly:"250", womenServed:"19",
  govFunding:false, catholic:true,
  canonicalStatus:"Catholic Private Association of the Christian Faithful, Diocese of Lafayette (canonically erected 1986)",
};

const DEF_FUNDERS = [
  {id:uid(),name:"Community Foundation of Acadiana",type:"Regional",stage:"active",ask:"$15,000",deadline:"2026-05-14",notes:"First-round Eligibility Form due May 14. Full proposal June 22–July 23. Decisions September.",priority:"high",catholic:false,contact:"DonorServices@cfacadiana.org · 337-769-4840"},
  {id:uid(),name:"Diocese of Lafayette Foundation",type:"Diocesan",stage:"prospect",ask:"$25,000",deadline:"2026-06-01",notes:"Critical first relationship. Request Bishop letter of support. Unlocks Catholic Extension access.",priority:"high",catholic:true,contact:"1408 Carmel Ave, Lafayette · 337-261-5600 · diolaf.org"},
  {id:uid(),name:"Raskob Foundation for Catholic Activities",type:"National Catholic",stage:"prospect",ask:"$25,000–$40,000",deadline:"2026-09-15",notes:"No LOI required. Must be in Official Catholic Directory. Spring & Fall cycles.",priority:"high",catholic:true,contact:"appdocs@rfca.org · 302-655-4440 · rfcagrants.powerappsportals.com"},
  {id:uid(),name:"Catholic Extension Society",type:"National Catholic",stage:"prospect",ask:"$30,000–$50,000",deadline:"2026-07-15",notes:"Cannot apply directly — must go through Diocese of Lafayette. Ask about Rural Ministries Microgrant.",priority:"medium",catholic:true,contact:"Odette Barrientos · 312-795-6082 · info@catholicextension.org"},
  {id:uid(),name:"Keith & Ginger Myers Family Foundation",type:"Louisiana Private",stage:"prospect",ask:"$50,000–$100,000",deadline:"",notes:"Sunset, LA. $8M+ assets, $2M+ annual grants. Catholic charities + healthcare education focus.",priority:"high",catholic:false,contact:"Sunset, St. Landry Parish, Louisiana"},
  {id:uid(),name:"Rucks Family Foundation",type:"Louisiana Private",stage:"prospect",ask:"$30,000–$100,000",deadline:"",notes:"Lafayette-based family philanthropy. Community strengthening + humanitarian causes.",priority:"medium",catholic:false,contact:"Lafayette, Louisiana"},
  {id:uid(),name:"Ourso Family Foundation",type:"Louisiana Private",stage:"prospect",ask:"$15,000–$25,000",deadline:"",notes:"South Louisiana priority. Quarterly grants. Human services + religion + education.",priority:"medium",catholic:false,contact:"South Louisiana focus"},
  {id:uid(),name:"Knights of Columbus Charities (National)",type:"National Catholic",stage:"prospect",ask:"$25,000–$30,000",deadline:"2026-12-01",notes:"Women's Housing & Protection category. Apply independently of local councils.",priority:"medium",catholic:true,contact:"kofc.org/en/charities · New Haven, CT"},
];

const DEF_TASKS = [
  {id:uid(),text:"Submit CFA Eligibility & Interest Form",funder:"Community Foundation of Acadiana",due:"2026-05-14",done:false,priority:"high"},
  {id:uid(),text:"Confirm listing in Official Catholic Directory (P.J. Kennedy)",funder:"Raskob Foundation",due:"2026-04-30",done:false,priority:"high"},
  {id:uid(),text:"Request meeting with Diocese of Lafayette development office",funder:"Diocese of Lafayette Foundation",due:"2026-05-07",done:false,priority:"high"},
  {id:uid(),text:"Request Bishop's letter of support",funder:"Diocese of Lafayette Foundation",due:"2026-05-15",done:false,priority:"high"},
  {id:uid(),text:"Draft Myers Family Foundation alignment memo",funder:"Keith & Ginger Myers Family Foundation",due:"2026-04-28",done:false,priority:"high"},
  {id:uid(),text:"Prepare May 2 'Come and See' donor invitations (5 sponsored guests)",funder:"General Cultivation",due:"2026-04-28",done:false,priority:"high"},
  {id:uid(),text:"Contact Grand Knight of nearest K of C council re: Sponsor-a-Bed",funder:"Knights of Columbus",due:"2026-05-30",done:false,priority:"medium"},
  {id:uid(),text:"Subscribe to Catholic Funding Guide (catholicfundingguide.com)",funder:"Research",due:"2026-05-30",done:false,priority:"medium"},
  {id:uid(),text:"Gather 2025 program outcome data for full CFA proposal",funder:"Community Foundation of Acadiana",due:"2026-06-15",done:false,priority:"medium"},
];

const DEF_EVENTS = [
  {id:uid(),title:"CFA Eligibility Form Deadline",date:"2026-05-14",type:"deadline",funder:"Community Foundation of Acadiana",color:C.red},
  {id:uid(),title:"Sister Servants 'Come and See' Day",date:"2026-05-02",type:"event",funder:"Donor Cultivation",color:C.gold},
  {id:uid(),title:"Myers Alignment Memo Due",date:"2026-04-28",type:"task",funder:"Myers Family Foundation",color:C.amber},
  {id:uid(),title:"CFA Full Proposal Window Opens",date:"2026-06-22",type:"deadline",funder:"Community Foundation of Acadiana",color:C.blue},
  {id:uid(),title:"Digging Deeper Women's Retreat",date:"2026-10-09",type:"event",funder:"Major Donor Cultivation",color:C.text},
  {id:uid(),title:"iGiveCatholic Campaign",date:"2026-11-17",type:"event",funder:"Annual Campaign",color:C.green},
  {id:uid(),title:"Raskob Fall Cycle Opens",date:"2026-09-01",type:"deadline",funder:"Raskob Foundation",color:C.blue},
];

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const card = (extra={}) => ({
  background:C.surfaceL,borderRadius:16,border:`1px solid ${C.border}`,padding:28,marginBottom:20,
  boxShadow:`0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.22), 0 16px 48px rgba(0,0,0,0.12)`,
  transition:"box-shadow 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)",...extra
});
const btn = (v="primary",extra={}) => ({
  padding:"9px 20px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,letterSpacing:0.3,
  background:v==="primary"?`linear-gradient(160deg,${C.goldBright} 0%,${C.gold} 100%)`:
             v==="navy"?`rgba(255,255,255,0.07)`:
             v==="green"?C.green:v==="red"?C.red:
             v==="outline"?"transparent":"rgba(255,255,255,0.05)",
  color:v==="outline"?C.mutedL:v==="primary"?"#0e0c08":v==="muted"?C.muted:C.white,
  border:v==="outline"?`1px solid ${C.borderStr}`:"none",
  boxShadow:v==="primary"?`0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 12px rgba(201,169,110,0.25)`:
            v==="outline"?"none":v==="muted"?"none":`0 1px 3px rgba(0,0,0,0.25)`,
  display:"inline-flex",alignItems:"center",gap:6,
  transition:"all 0.18s cubic-bezier(0.4,0,0.2,1)",...extra
});
const badge = (c="blue") => ({
  display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:0.2,
  background:c==="red"?C.redL:c==="amber"?C.amberL:c==="green"?C.greenL:C.blueL,
  color:c==="red"?"#f87171":c==="amber"?"#fbbf24":c==="green"?"#34d399":"#60a5fa",
  border:`1px solid ${c==="red"?"rgba(239,68,68,0.2)":c==="amber"?"rgba(245,158,11,0.2)":c==="green"?"rgba(16,185,129,0.2)":"rgba(59,130,246,0.2)"}`,
});
const input = (extra={}) => ({
  width:"100%",padding:"9px 13px",borderRadius:8,border:`1px solid ${C.border}`,
  fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",
  background:"rgba(255,255,255,0.04)",color:C.text,
  boxShadow:"inset 0 1px 2px rgba(0,0,0,0.2)",...extra
});
const label = {display:"block",fontSize:10.5,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:0.7};

/* ─── TABS ────────────────────────────────────────────────────────────────── */
const TABS = [
  {id:"dashboard",label:"Dashboard"},
  {id:"daily",label:"Daily Plan"},
  {id:"funders",label:"Funders"},
  {id:"calendar",label:"Calendar"},
  {id:"tasks",label:"Tasks"},
  {id:"writing",label:"Writing Studio"},
  {id:"portfolio",label:"Portfolio"},
  {id:"donors",label:"Donor Hub"},
  {id:"settings",label:"Settings"},
];

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */
function Dashboard({profile,funders,tasks,events,setTab}){
  const upcoming = [...events].filter(e=>daysUntil(e.date)>=0).sort((a,b)=>daysUntil(a.date)-daysUntil(b.date)).slice(0,5);
  const openTasks = tasks.filter(t=>!t.done).sort((a,b)=>daysUntil(a.due||"2099-12-31")-daysUntil(b.due||"2099-12-31")).slice(0,5);
  const wonFunders = funders.filter(f=>f.stage==="won");
  const activeFunders = funders.filter(f=>["active","submitted"].includes(f.stage));
  const nextDeadline = upcoming.find(e=>e.type==="deadline");

  return (
    <div>
      {/* Header bar */}
      <div style={{borderRadius:18,background:`linear-gradient(160deg, #0c0c0f 0%, #111115 60%, #161620 100%)`,color:C.white,marginBottom:24,border:`1px solid rgba(255,255,255,0.07)`,boxShadow:`0 1px 0 rgba(255,255,255,0.05) inset, 0 2px 4px rgba(0,0,0,0.4), 0 12px 48px rgba(0,0,0,0.35)`,padding:"28px 32px",position:"relative",overflow:"hidden"}}>
        {/* Subtle grid texture */}
        <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 80% 20%, rgba(201,169,110,0.04) 0%, transparent 60%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,position:"relative"}}>
          <div>
            <div style={{fontSize:10.5,color:C.gold,fontWeight:600,letterSpacing:1.6,textTransform:"uppercase",marginBottom:6,opacity:0.9}}>Active Organization</div>
            <div style={{fontSize:21,fontWeight:800,color:"#fff",letterSpacing:-0.4,lineHeight:1.2}}>{profile.name}</div>
            <div style={{fontSize:12,color:"rgba(161,161,170,0.7)",marginTop:5}}>{profile.apostolate} · {profile.city}, {profile.state}</div>
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              <span style={{fontSize:10,fontWeight:600,background:"rgba(34,197,94,0.10)",color:"#4ade80",border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:"2px 10px",letterSpacing:0.5}}>Zero Overhead</span>
              <span style={{fontSize:10,fontWeight:600,background:"rgba(201,169,110,0.10)",color:C.gold,border:"1px solid rgba(201,169,110,0.2)",borderRadius:20,padding:"2px 10px",letterSpacing:0.5}}>100% Volunteer-Run</span>
            </div>
          </div>
          {nextDeadline && (
            <div style={{textAlign:"right",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"14px 20px",backdropFilter:"blur(4px)"}}>
              <div style={{fontSize:9.5,color:"rgba(200,215,230,0.6)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:4}}>Next Deadline</div>
              <div style={{fontSize:36,fontWeight:900,color:daysUntil(nextDeadline.date)<=7?C.red:C.gold,lineHeight:1,letterSpacing:-1}}>{daysUntil(nextDeadline.date)}<span style={{fontSize:16,letterSpacing:0}}> d</span></div>
              <div style={{fontSize:11,color:"rgba(192,208,232,0.8)",marginTop:4,maxWidth:160}}>{nextDeadline.title}</div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {label:"Families Served",value:profile.families+"+",sub:"weekly",color:"#a78bfa",accent:"rgba(167,139,250,0.08)",border:"rgba(167,139,250,0.15)"},
          {label:"Hot Meals / Week",value:profile.mealsWeekly,sub:"every Thursday",color:C.green,accent:"rgba(34,197,94,0.08)",border:"rgba(34,197,94,0.15)"},
          {label:"Women Housed",value:profile.womenServed,sub:"in 2025",color:C.blue,accent:"rgba(96,165,250,0.08)",border:"rgba(96,165,250,0.15)"},
          {label:"Volunteers",value:profile.volunteers,sub:"100% volunteer-run",color:C.gold,accent:"rgba(201,169,110,0.08)",border:"rgba(201,169,110,0.15)"},
        ].map(m=>(
          <div key={m.label} style={card({padding:22,marginBottom:0,position:"relative",overflow:"hidden"})}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.color}cc,${m.color}33)`}}/>
            <div style={{display:"flex",alignItems:"center",gap:14,paddingTop:6}}>
              <div style={{width:40,height:40,borderRadius:12,background:m.accent,border:`1px solid ${m.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:16,height:16,borderRadius:4,background:m.color,opacity:0.9}}/>
              </div>
              <div>
                <div style={{fontSize:28,fontWeight:800,color:m.color,lineHeight:1,letterSpacing:-0.8}}>{m.value}</div>
                <div style={{fontSize:11.5,fontWeight:600,marginTop:3,color:C.text}}>{m.label}</div>
                <div style={{fontSize:10.5,color:C.muted,marginTop:1}}>{m.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* Upcoming deadlines */}
        <div style={card({marginBottom:0})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,letterSpacing:-0.2,color:C.text}}>Upcoming Deadlines</div>
            <button style={btn("outline",{fontSize:12,padding:"5px 12px"})} onClick={()=>setTab("calendar")}>View Calendar</button>
          </div>
          {upcoming.map(e=>{
            const d=daysUntil(e.date);
            const c=d<=7?"red":d<=21?"amber":"green";
            return (
              <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{e.title}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>{fmtDate(e.date)} · {e.funder}</div>
                </div>
                <span style={badge(c)}>{d===0?"TODAY":d<0?`${Math.abs(d)}d ago`:`${d}d`}</span>
              </div>
            );
          })}
          {upcoming.length===0&&<div style={{color:C.muted,fontSize:13}}>No upcoming deadlines.</div>}
        </div>

        {/* Open tasks */}
        <div style={card({marginBottom:0})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14,letterSpacing:-0.2,color:C.text}}>Open Tasks</div>
            <button style={btn("outline",{fontSize:12,padding:"5px 12px"})} onClick={()=>setTab("tasks")}>View All</button>
          </div>
          {openTasks.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:t.priority==="high"?C.red:t.priority==="medium"?C.amber:C.blue,marginTop:4,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500}}>{t.text}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>{t.funder}{t.due?" · Due "+fmtDate(t.due):""}</div>
              </div>
            </div>
          ))}
          {openTasks.length===0&&<div style={{color:C.green,fontSize:13,fontWeight:600}}>✓ All tasks complete!</div>}
        </div>
      </div>

      {/* Active pipeline */}
      <div style={card({marginTop:20})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:14,letterSpacing:-0.2,color:C.text}}>Active Pipeline</div>
          <button style={btn("outline",{fontSize:12,padding:"5px 12px"})} onClick={()=>setTab("funders")}>Full Pipeline</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {["prospect","active","submitted","won","lost"].map(stage=>{
            const count=funders.filter(f=>f.stage===stage).length;
            const configs={
              prospect:{bg:C.blueL,tc:"#60a5fa",border:"rgba(59,130,246,0.18)"},
              active:{bg:C.amberL,tc:"#fbbf24",border:"rgba(245,158,11,0.18)"},
              submitted:{bg:C.goldL,tc:C.gold,border:"rgba(212,168,67,0.22)"},
              won:{bg:C.greenL,tc:"#34d399",border:"rgba(16,185,129,0.18)"},
              lost:{bg:"rgba(255,255,255,0.03)",tc:C.muted,border:"rgba(255,255,255,0.07)"},
            };
            const cfg=configs[stage];
            return (
              <div key={stage} style={{background:cfg.bg,borderRadius:12,padding:"16px 12px",textAlign:"center",border:`1px solid ${cfg.border}`}}>
                <div style={{fontSize:28,fontWeight:900,color:cfg.tc,lineHeight:1,letterSpacing:-0.5}}>{count}</div>
                <div style={{fontSize:10.5,fontWeight:700,color:cfg.tc,textTransform:"capitalize",marginTop:4,letterSpacing:0.3}}>{stage}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DAILY PLAN
   ═══════════════════════════════════════════════════════════════════════════ */
function DailyPlan({profile,funders,events}){
  const [plan,setPlan]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const generate=async()=>{
    setLoading(true); setErr(""); setPlan(null);
    try{
      const deadlines=events.filter(e=>daysUntil(e.date)>=0&&daysUntil(e.date)<=45).sort((a,b)=>daysUntil(a.date)-daysUntil(b.date)).slice(0,3);
      const res=await fetch("/api/daily-plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile,funders,deadlines})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Generation failed");
      setPlan(data);
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const dow=new Date().toLocaleDateString("en-US",{weekday:"long"});

  return (
    <div>
      <div style={card({background:`linear-gradient(135deg,#111113,#1a1a1f)`,color:C.white,border:`1px solid rgba(255,255,255,0.08)`})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:19,fontWeight:700,color:C.gold,letterSpacing:-0.3}}>{dow} Development Plan</div>
            <div style={{fontSize:13,color:"rgba(161,161,170,0.75)",marginTop:3}}>{todayFull()} · {profile.name}</div>
          </div>
          <button style={btn("primary",{fontSize:14,padding:"11px 24px"})} onClick={generate} disabled={loading}>
            {loading?"⏳ Generating...":"⚡ Generate Today's Plan"}
          </button>
        </div>
      </div>

      {err&&<div style={card({background:C.redL,border:`1px solid ${C.red}`,color:C.red,padding:16})}>{err}</div>}

      {!plan&&!loading&&(
        <div style={card({textAlign:"center",padding:60,color:C.muted})}>
          <div style={{width:56,height:56,borderRadius:16,background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 32px rgba(201,169,110,0.06)"}}>
            <div style={{width:24,height:24,borderRadius:6,background:C.gold,opacity:0.7}}/>
          </div>
          <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8,letterSpacing:-0.3}}>Ready to generate today's plan</div>
          <div style={{fontSize:14,marginBottom:24,color:C.muted}}>Click "Generate Today's Plan" to get a daily-refreshed donor prospect briefing with a featured local funder, deadline countdown, messaging framework, and 7-day sprint.</div>
          <div style={{fontSize:12,color:C.gold,fontWeight:600}}>Powered by live web search + Claude AI</div>
        </div>
      )}

      {loading&&(
        <div style={card({textAlign:"center",padding:60})}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.18)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"subtlePulse 1.6s ease-in-out infinite"}}>
            <div style={{width:18,height:18,borderRadius:4,background:`linear-gradient(135deg,${C.goldBright},${C.gold})`,animation:"spin 1.2s linear infinite"}}/>
          </div>
          <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8,letterSpacing:-0.3}}>Searching live databases...</div>
          <div style={{fontSize:13,color:C.muted}}>Scanning foundation 990s, local philanthropy networks, and grant portals for today's featured funder</div>
          <div style={{marginTop:16,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",background:`linear-gradient(90deg,${C.gold},${C.goldBright})`,borderRadius:2,animation:"progress 2s ease-in-out infinite"}}/>
          </div>
        </div>
      )}

      {plan&&(
        <div>
          {/* Executive Summary */}
          <div style={card({borderLeft:`4px solid ${C.gold}`})}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Executive Summary</div>
            <div style={{fontSize:14,lineHeight:1.7,color:C.text}}>{plan.executiveSummary}</div>
          </div>

          {/* Featured Funder */}
          {plan.featuredFunder&&(
            <div style={card({background:`linear-gradient(135deg,rgba(212,168,67,0.08),rgba(212,168,67,0.04))`,border:`1px solid rgba(212,168,67,0.25)`})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10.5,fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6}}>⭐ Today's Featured Funder</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.text}}>{plan.featuredFunder.name}</div>
                  <div style={{fontSize:13,color:C.muted,marginTop:4}}>{plan.featuredFunder.type} · {plan.featuredFunder.location}</div>
                  {plan.featuredFunder.assets&&<div style={{fontSize:13,color:"#34d399",fontWeight:600,marginTop:4}}>Assets: {plan.featuredFunder.assets} · Annual Grants: {plan.featuredFunder.annualGrants}</div>}
                  <div style={{fontSize:13,color:C.text,marginTop:10,lineHeight:1.6}}>{plan.featuredFunder.connection}</div>
                </div>
                <div style={{textAlign:"right",minWidth:120}}>
                  <div style={{fontSize:10.5,color:C.muted,textTransform:"uppercase",letterSpacing:0.5}}>Ask Range</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.gold,marginTop:2}}>{plan.featuredFunder.askRange}</div>
                  <div style={{marginTop:8}}><span style={badge("amber")}>{plan.featuredFunder.status||"Prospect"}</span></div>
                </div>
              </div>
              {plan.featuredFunder.strategyNote&&(
                <div style={{marginTop:16,padding:"12px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,fontSize:13,color:C.text,lineHeight:1.6}}>
                  <strong style={{color:C.gold}}>Strategy:</strong> {plan.featuredFunder.strategyNote}
                </div>
              )}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {/* Messaging */}
            {plan.messaging&&(
              <div style={card({marginBottom:0})}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.text}}>💬 Today's Messaging</div>
                <div style={{fontSize:13,lineHeight:1.7,color:C.text,marginBottom:12,padding:"12px 14px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:8,fontStyle:"italic"}}>"{plan.messaging.core}"</div>
                {plan.messaging.themes?.map((t,i)=>(
                  <div key={i} style={{fontSize:13,color:C.text,padding:"8px 0",borderBottom:`1px solid ${C.border}`,lineHeight:1.5}}>
                    <span style={{color:C.gold,fontWeight:700}}>◆ </span>{t}
                  </div>
                ))}
              </div>
            )}

            {/* 7-Day Sprint */}
            {plan.sprint&&(
              <div style={card({marginBottom:0})}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.text}}>🏃 7-Day Sprint</div>
                {plan.sprint.map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:`rgba(212,168,67,0.12)`,color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,border:`1px solid rgba(212,168,67,0.2)`}}>{i+1}</div>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{item}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deadlines */}
          {plan.deadlines?.length>0&&(
            <div style={card()}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.text}}>⏰ Active Deadlines</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {plan.deadlines.map((d,i)=>{
                  const dc=d.daysOut<=7?"red":d.daysOut<=21?"amber":"green";
                  return (
                    <div key={i} style={{padding:16,borderRadius:10,background:dc==="red"?C.redL:dc==="amber"?C.amberL:C.greenL,border:`1px solid ${dc==="red"?C.red:dc==="amber"?C.amber:C.green}`}}>
                      <div style={{fontSize:28,fontWeight:900,color:dc==="red"?C.red:dc==="amber"?C.amber:C.green}}>{d.daysOut}d</div>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:4}}>{d.name}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{d.action}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assets */}
          {plan.assets?.length>0&&(
            <div style={card()}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.text}}>🚀 Assets to Deploy Today</div>
              {plan.assets.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.gold,fontSize:16}}>▶</span>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{a}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{fontSize:12,color:C.muted,textAlign:"center",marginTop:8}}>
            Generated {todayFull()} · Powered by live web search + Claude AI
            {plan.webSearched&&<span style={{color:C.green,fontWeight:600}}> · ✓ Live data used</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FUNDERS PIPELINE
   ═══════════════════════════════════════════════════════════════════════════ */
function CompetitiveBriefModal({brief, funderName, onClose}){
  if(!brief) return null;
  const alignColor = brief.alignment?.score==="strong"?C.green:brief.alignment?.score==="moderate"?C.amber:C.red;
  const alignBg = brief.alignment?.score==="strong"?C.greenL:brief.alignment?.score==="moderate"?C.amberL:C.redL;
  const Section = ({title, children}) => (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:3,height:16,background:C.gold,borderRadius:2}}/>
        <div style={{fontWeight:700,fontSize:11,color:C.text,textTransform:"uppercase",letterSpacing:"0.09em"}}>{title}</div>
      </div>
      {children}
    </div>
  );
  const Pill = ({text,color}) => <span style={{display:"inline-block",background:color+"18",color,border:`1px solid ${color}38`,borderRadius:20,padding:"4px 13px",fontSize:11.5,fontWeight:600,marginRight:6,marginBottom:6,letterSpacing:0.1}}>{text}</span>;
  const Row = ({label,value}) => value ? <div style={{display:"flex",gap:10,marginBottom:7,fontSize:13}}><span style={{color:C.muted,minWidth:130,flexShrink:0,fontSize:12}}>{label}</span><span style={{color:C.text,fontWeight:500,lineHeight:1.5}}>{value}</span></div> : null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(6,10,20,0.78)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"40px 16px"}}>
      <div style={{background:C.surfaceL,borderRadius:20,border:`1px solid ${C.borderStr}`,width:"100%",maxWidth:780,boxShadow:"0 32px 100px rgba(0,0,0,0.7)",animation:"fadeIn 0.2s ease"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.navyDeep} 0%,${C.navyXL} 100%)`,borderRadius:"20px 20px 0 0",padding:"26px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Competitive Intelligence Brief</div>
            <div style={{fontSize:21,fontWeight:800,color:C.white,letterSpacing:-0.3}}>{funderName}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{background:"rgba(255,255,255,0.08)",border:`1.5px solid ${alignColor}66`,borderRadius:10,padding:"8px 18px",textAlign:"center",backdropFilter:"blur(4px)"}}>
              <div style={{fontSize:9.5,color:alignColor,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8}}>Alignment</div>
              <div style={{fontSize:17,color:alignColor,fontWeight:800,textTransform:"capitalize",marginTop:1}}>{brief.alignment?.score}</div>
            </div>
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.9)",borderRadius:9,padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:600,letterSpacing:0.2}}>✕ Close</button>
          </div>
        </div>

        <div style={{padding:"30px 32px 36px"}}>
          {/* Executive Summary */}
          {brief.executiveSummary && (
            <div style={{background:"rgba(59,130,246,0.07)",border:`1px solid rgba(59,130,246,0.15)`,borderLeft:`3px solid ${C.blue}`,borderRadius:12,padding:"16px 20px",marginBottom:26,fontSize:13.5,lineHeight:1.75,color:C.text,fontStyle:"italic"}}>
              "{brief.executiveSummary}"
            </div>
          )}

          {/* Funder Snapshot */}
          <Section title="📊 Funder Snapshot">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <Row label="Est. Grant Range" value={brief.funderSnapshot?.grantRange || brief.funderSnapshot?.estimatedGrant}/>
              <Row label="Geographic Focus" value={brief.funderSnapshot?.geographicFocus}/>
              <Row label="Grant Cycle" value={brief.funderSnapshot?.grantCycle}/>
              <Row label="Application Process" value={brief.funderSnapshot?.applicationProcess}/>
            </div>
            {brief.funderSnapshot?.knownPriorities && <div style={{marginTop:8,fontSize:13,color:C.text,lineHeight:1.6}}><strong>Known Priorities:</strong> {brief.funderSnapshot.knownPriorities}</div>}
          </Section>

          {/* What Wins With This Funder */}
          <Section title="🏆 What Wins With This Funder">
            {brief.fundedOrgProfile?.whatWins && <div style={{fontSize:13,lineHeight:1.7,color:C.text,marginBottom:10}}>{brief.fundedOrgProfile.whatWins}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:6}}>
              <Row label="Typical Missions" value={brief.fundedOrgProfile?.typicalMissions}/>
              <Row label="Budget Range" value={brief.fundedOrgProfile?.typicalBudgetRange}/>
              <Row label="Faith Pattern" value={brief.fundedOrgProfile?.faithPattern}/>
              <Row label="Geography" value={brief.fundedOrgProfile?.geographicPattern}/>
            </div>
          </Section>

          {/* Alignment */}
          <Section title="🎯 Your Competitive Position">
            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:10}}>{brief.alignment?.scoreRationale}</div>
              {brief.alignment?.strengths?.length>0 && (
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:6}}>✓ STRENGTHS</div>
                  {brief.alignment.strengths.map((s,i)=><div key={i} style={{fontSize:13,color:C.text,marginBottom:4,paddingLeft:12}}>· {s}</div>)}
                </div>
              )}
              {brief.alignment?.uniqueDifferentiators?.length>0 && (
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:6}}>⭐ DIFFERENTIATORS — LEAD WITH THESE</div>
                  {brief.alignment.uniqueDifferentiators.map((d,i)=><div key={i} style={{fontSize:13,color:C.text,marginBottom:4,paddingLeft:12,fontWeight:600}}>· {d}</div>)}
                </div>
              )}
              {brief.alignment?.concerns?.length>0 && (
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:6}}>⚠ WATCH POINTS</div>
                  {brief.alignment.concerns.map((c,i)=><div key={i} style={{fontSize:13,color:C.text,marginBottom:4,paddingLeft:12}}>· {c}</div>)}
                </div>
              )}
            </div>
          </Section>

          {/* Messaging Blueprint */}
          <Section title="✍️ Messaging Blueprint">
            {brief.messagingBlueprint?.openingHook && (
              <div style={{background:C.goldL,border:`1px solid ${C.gold}`,borderRadius:8,padding:14,marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:C.gold,textTransform:"uppercase",marginBottom:6,letterSpacing:0.8}}>Opening Hook — Copy This</div>
                <div style={{fontSize:14,color:C.text,lineHeight:1.7,fontStyle:"italic"}}>"{brief.messagingBlueprint.openingHook}"</div>
              </div>
            )}
            {brief.messagingBlueprint?.framingStrategy && (
              <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:12}}><strong>Framing Strategy:</strong> {brief.messagingBlueprint.framingStrategy}</div>
            )}
            <Row label="Recommended Ask" value={brief.messagingBlueprint?.recommendedAsk}/>
            <Row label="Tone" value={brief.messagingBlueprint?.toneGuidance}/>
            {brief.messagingBlueprint?.keyPhrases?.length>0 && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>KEY PHRASES TO USE:</div>
                <div>{brief.messagingBlueprint.keyPhrases.map((p,i)=><Pill key={i} text={p} color={C.green}/>)}</div>
              </div>
            )}
            {brief.messagingBlueprint?.metricsToLead?.length>0 && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>LEAD WITH THESE METRICS:</div>
                <div>{brief.messagingBlueprint.metricsToLead.map((m,i)=><Pill key={i} text={m} color={C.blue}/>)}</div>
              </div>
            )}
            {brief.messagingBlueprint?.thingsToAvoid?.length>0 && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:8}}>AVOID:</div>
                <div>{brief.messagingBlueprint.thingsToAvoid.map((a,i)=><Pill key={i} text={a} color={C.red}/>)}</div>
              </div>
            )}
          </Section>

          {/* Relationship Strategy */}
          <Section title="🤝 Relationship Strategy">
            <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:8}}>{brief.relationshipStrategy?.approach}</div>
            <Row label="Timeline" value={brief.relationshipStrategy?.timeline}/>
            {brief.relationshipStrategy?.warmPathNotes && <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginTop:4}}><strong>Warm Path:</strong> {brief.relationshipStrategy.warmPathNotes}</div>}
            {brief.relationshipStrategy?.nextImmediateAction && (
              <div style={{background:C.greenL,border:`1px solid ${C.green}44`,borderRadius:8,padding:12,marginTop:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.green,marginBottom:4}}>NEXT ACTION</div>
                <div style={{fontSize:13,color:C.text,fontWeight:600}}>{brief.relationshipStrategy.nextImmediateAction}</div>
              </div>
            )}
          </Section>

          {/* Donor Preferences */}
          {brief.donorPreferences && (
            <Section title="💡 Donor Preference Patterns">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <Row label="Typical Grant Size" value={brief.donorPreferences?.typicalGrantSize}/>
                <Row label="Preferred Org Type" value={brief.donorPreferences?.preferredOrgCharacteristics}/>
              </div>
              {brief.donorPreferences?.topFundingPatterns && (
                <div style={{marginTop:10,padding:"12px 14px",background:C.blueL,borderRadius:8,fontSize:13,color:C.text,lineHeight:1.6}}>
                  <strong>Top Funding Patterns:</strong> {brief.donorPreferences.topFundingPatterns}
                </div>
              )}
              {brief.donorPreferences?.keyDonorTriggers && (
                <div style={{marginTop:8,padding:"12px 14px",background:C.greenL,borderRadius:8,fontSize:13,color:C.text,lineHeight:1.6}}>
                  <strong>What Makes Them Say Yes:</strong> {brief.donorPreferences.keyDonorTriggers}
                </div>
              )}
              {brief.donorPreferences?.avoidancePatterns && (
                <div style={{marginTop:8,padding:"12px 14px",background:C.redL,borderRadius:8,fontSize:13,color:C.text,lineHeight:1.6}}>
                  <strong>What They Avoid:</strong> {brief.donorPreferences.avoidancePatterns}
                </div>
              )}
              {brief.donorPreferences?.repeatGranteeNotes && (
                <div style={{marginTop:8,fontSize:13,color:C.muted,lineHeight:1.5,fontStyle:"italic"}}>{brief.donorPreferences.repeatGranteeNotes}</div>
              )}
            </Section>
          )}

          {/* Board / Leadership Intel */}
          {brief.boardProfile && (
            <Section title={`👥 Board & Leadership Intel ${brief.boardProfile?.dataQuality==="minimal"?"(Limited Data)":brief.boardProfile?.dataQuality==="partial"?"(Partial Data)":"(Rich Data)"}`}>
              {brief.boardProfile?.dataQuality==="minimal" ? (
                <div style={{fontSize:13,color:C.muted,fontStyle:"italic",marginBottom:12}}>Limited public data found for this funder's leadership. Hooks below are inferred from funder type and mission.</div>
              ) : (
                <>
                  {brief.boardProfile?.keyLeaders && (
                    <div style={{marginBottom:10,fontSize:13,color:C.text,lineHeight:1.6}}><strong>Key Leaders:</strong> {brief.boardProfile.keyLeaders}</div>
                  )}
                  {brief.boardProfile?.leaderInsights && (
                    <div style={{marginBottom:10,padding:"12px 14px",background:C.amberL,borderRadius:8,fontSize:13,color:C.text,lineHeight:1.6}}>
                      <strong>Leadership Insights:</strong> {brief.boardProfile.leaderInsights}
                    </div>
                  )}
                  {brief.boardProfile?.networkConnections && (
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5,marginBottom:10}}><strong>Network Connections:</strong> {brief.boardProfile.networkConnections}</div>
                  )}
                </>
              )}
              {brief.boardProfile?.messagingHooks?.length > 0 && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>LEADERSHIP-TAILORED MESSAGING HOOKS:</div>
                  {brief.boardProfile.messagingHooks.map((h,i)=>(
                    <div key={i} style={{display:"flex",gap:10,marginBottom:8,padding:"10px 12px",background:C.bg,borderRadius:8,borderLeft:`3px solid ${C.gold}`}}>
                      <span style={{color:C.gold,fontWeight:800,fontSize:14,flexShrink:0}}>→</span>
                      <span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {brief.competitiveRisk && (
            <Section title="⚔️ Competitive Risk">
              <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{brief.competitiveRisk}</div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function FundersPipeline({funders,setFunders,setTasks,tasks,profile}){
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [discovering,setDiscovering]=useState(false);
  const [discovered,setDiscovered]=useState([]);
  const [newF,setNewF]=useState({name:"",type:"Private",stage:"prospect",ask:"",deadline:"",notes:"",priority:"medium",catholic:false,contact:""});
  const [activeStage,setActiveStage]=useState("all");
  const [analyzing,setAnalyzing]=useState(null);
  const [activeBrief,setActiveBrief]=useState(null);
  const [briefFunderName,setBriefFunderName]=useState("");

  const stages=["prospect","active","submitted","won","lost"];
  const filtered=funders.filter(f=>{
    const matchSearch=f.name.toLowerCase().includes(search.toLowerCase())||f.notes?.toLowerCase().includes(search.toLowerCase());
    const matchStage=activeStage==="all"||f.stage===activeStage;
    return matchSearch&&matchStage;
  });

  const addFunder=()=>{
    if(!newF.name.trim()) return;
    const f={...newF,id:uid()};
    setFunders(prev=>[...prev,f]);
    // Auto-generate tasks
    const autoTasks=[];
    if(f.deadline) autoTasks.push({id:uid(),text:`Submit application to ${f.name}`,funder:f.name,due:f.deadline,done:false,priority:"high"});
    if(f.catholic) autoTasks.push({id:uid(),text:`Verify Catholic Directory listing for ${f.name}`,funder:f.name,due:"",done:false,priority:"high"});
    autoTasks.push({id:uid(),text:`Research ${f.name} giving history and priorities`,funder:f.name,due:"",done:false,priority:"medium"});
    if(autoTasks.length) setTasks(prev=>[...prev,...autoTasks]);
    setNewF({name:"",type:"Private",stage:"prospect",ask:"",deadline:"",notes:"",priority:"medium",catholic:false,contact:""});
    setShowAdd(false);
  };

  const discoverFunders=async()=>{
    setDiscovering(true); setDiscovered([]);
    try{
      const res=await fetch("/api/search-funders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"Saint Martinville, Louisiana",cause:"Catholic mercy women housing youth",structure:"Catholic nonprofit"})});
      const data=await res.json();
      setDiscovered(data.funders||[]);
    }catch(e){setDiscovered([]);}
    setDiscovering(false);
  };

  const addDiscovered=(f)=>{
    const funder={id:uid(),name:f.name,type:f.type||"Private",stage:"prospect",ask:f.askRange||"",deadline:f.deadline||"",notes:f.notes||"",priority:f.priority||"medium",catholic:f.catholic||false,contact:f.contact||""};
    setFunders(prev=>[...prev,funder]);
    setDiscovered(prev=>prev.filter(d=>d.name!==f.name));
  };

  const updateStage=(id,stage)=>setFunders(prev=>prev.map(f=>f.id===id?{...f,stage}:f));
  const deleteFunder=(id)=>setFunders(prev=>prev.filter(f=>f.id!==id));

  const analyzeFunder=async(f)=>{
    setAnalyzing(f.id);
    try{
      const res=await fetch("/api/analyze-funder",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({funder:f,profile:profile||null})
      });
      const data=await res.json();
      if(data.brief){ setActiveBrief(data.brief); setBriefFunderName(f.name); }
    }catch(e){ const msg=e?.message||"Unknown error"; alert("Analysis failed: "+msg+"\n\nCheck that your ANTHROPIC_API_KEY is configured in Vercel → Settings → Environment Variables (all environments)."); }
    setAnalyzing(null);
  };

  return (
    <div>
      {activeBrief&&<CompetitiveBriefModal brief={activeBrief} funderName={briefFunderName} onClose={()=>setActiveBrief(null)}/>}
      {/* Header */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <input style={input({flex:1,minWidth:200})} placeholder="Search funders..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button style={btn("navy")} onClick={discoverFunders} disabled={discovering}>
          {discovering?"🔍 Searching...":"🔍 Discover New Funders"}
        </button>
        <button style={btn("primary")} onClick={()=>setShowAdd(true)}>+ Add Funder</button>
      </div>

      {/* Stage filter */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["all",...stages].map(s=>(
          <button key={s} style={{...btn("outline"),background:activeStage===s?C.navy:"",color:activeStage===s?C.white:"",border:activeStage===s?`1px solid ${C.navy}`:`1px solid ${C.border}`,textTransform:"capitalize",padding:"6px 14px"}} onClick={()=>setActiveStage(s)}>
            {s} {s!=="all"&&<span style={{opacity:0.7}}>({funders.filter(f=>f.stage===s).length})</span>}
          </button>
        ))}
      </div>

      {/* Discovered funders */}
      {discovered.length>0&&(
        <div style={card({background:C.goldL,border:`1px solid ${C.gold}`,marginBottom:20})}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.text}}>🌟 Newly Discovered Funders</div>
          {discovered.map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${C.gold}`,gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:C.text}}>{f.name}</div>
                <div style={{fontSize:12,color:C.mutedL,marginTop:2}}>{f.type} · {f.askRange}</div>
                <div style={{fontSize:12,color:C.text,marginTop:4}}>{f.notes}</div>
              </div>
              <button style={btn("primary",{padding:"6px 14px",fontSize:12,flexShrink:0})} onClick={()=>addDiscovered(f)}>Add to Pipeline</button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd&&(
        <div style={card({marginBottom:20,border:`2px solid ${C.gold}`})}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.text}}>Add New Funder</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><span style={label}>Funder Name *</span><input style={input()} value={newF.name} onChange={e=>setNewF(p=>({...p,name:e.target.value}))} placeholder="Foundation name"/></div>
            <div><span style={label}>Type</span>
              <select style={input()} value={newF.type} onChange={e=>setNewF(p=>({...p,type:e.target.value}))}>
                {["Diocesan","National Catholic","Louisiana Private","Regional","Federal","Corporate","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><span style={label}>Ask Range</span><input style={input()} value={newF.ask} onChange={e=>setNewF(p=>({...p,ask:e.target.value}))} placeholder="$25,000–$50,000"/></div>
            <div><span style={label}>Deadline</span><input type="date" style={input()} value={newF.deadline} onChange={e=>setNewF(p=>({...p,deadline:e.target.value}))}/></div>
            <div><span style={label}>Priority</span>
              <select style={input()} value={newF.priority} onChange={e=>setNewF(p=>({...p,priority:e.target.value}))}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
            <div><span style={label}>Contact</span><input style={input()} value={newF.contact} onChange={e=>setNewF(p=>({...p,contact:e.target.value}))} placeholder="Email / phone / website"/></div>
          </div>
          <div style={{marginBottom:12}}><span style={label}>Notes</span><textarea style={input({height:70})} value={newF.notes} onChange={e=>setNewF(p=>({...p,notes:e.target.value}))} placeholder="Strategy notes, requirements, relationship context..."/></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}>
              <input type="checkbox" checked={newF.catholic} onChange={e=>setNewF(p=>({...p,catholic:e.target.checked}))}/> Catholic funder
            </label>
            <div style={{flex:1}}/>
            <button style={btn("outline")} onClick={()=>setShowAdd(false)}>Cancel</button>
            <button style={btn("primary")} onClick={addFunder}>Add Funder</button>
          </div>
        </div>
      )}

      {/* Funder list */}
      {filtered.length===0&&<div style={card({color:C.muted,textAlign:"center",padding:40})}>No funders found. Add one or discover new ones.</div>}
      {filtered.map(f=>{
        const d=f.deadline?daysUntil(f.deadline):null;
        const dc=d===null?"blue":d<=7?"red":d<=21?"amber":"green";
        const prioColor=f.priority==="high"?C.red:f.priority==="medium"?C.amber:C.blue;
        const stageBadge=f.stage==="won"?"green":f.stage==="lost"?"red":f.stage==="submitted"?"green":f.stage==="active"?"amber":"blue";
        return (
          <div key={f.id} style={card({
            marginBottom:10,padding:"18px 20px",
            borderLeft:`3px solid ${prioColor}`,
            transition:"box-shadow 0.15s, transform 0.15s",
          })}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:14.5,fontWeight:700,color:C.text,letterSpacing:-0.2}}>{f.name}</span>
                  <span style={badge(stageBadge)}>{f.stage}</span>
                  {f.catholic&&<span style={{...badge("blue"),background:"rgba(26,61,122,0.07)"}}>⛪ Catholic</span>}
                  {f.ask&&<span style={{fontSize:11.5,color:C.gold,fontWeight:700,background:C.goldL,border:`1px solid rgba(212,168,67,0.25)`,borderRadius:6,padding:"2px 8px"}}>{f.ask}</span>}
                </div>
                <div style={{fontSize:11.5,color:C.muted,marginBottom:f.notes?6:0}}>
                  {f.type}{f.contact&&<span> · {f.contact}</span>}
                </div>
                {f.notes&&<div style={{fontSize:12.5,color:C.text,lineHeight:1.6,opacity:0.82}}>{f.notes}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7,flexShrink:0}}>
                {f.deadline&&<span style={badge(dc)}>{d===0?"DUE TODAY":d<0?`${Math.abs(d)}d overdue`:`${d}d · ${fmtDate(f.deadline)}`}</span>}
                <select style={{...input({width:"auto",padding:"5px 8px",fontSize:11.5}),cursor:"pointer",borderRadius:7}} value={f.stage} onChange={e=>updateStage(f.id,e.target.value)}>
                  {stages.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  style={{...btn("navy",{padding:"6px 14px",fontSize:11.5}),opacity:analyzing===f.id?0.6:1,minWidth:100}}
                  onClick={()=>analyzeFunder(f)}
                  disabled={analyzing===f.id}
                  title="Run competitive intelligence analysis using 990-PF data + AI"
                >
                  {analyzing===f.id?"⏳ Analyzing...":"🧠 Analyze"}
                </button>
                <button style={{background:"none",border:"none",color:"rgba(100,116,139,0.5)",cursor:"pointer",fontSize:11,letterSpacing:0.2}} onClick={()=>deleteFunder(f.id)}>✕ Remove</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CALENDAR
   ═══════════════════════════════════════════════════════════════════════════ */
function CalendarView({events,setEvents}){
  const [month,setMonth]=useState(()=>new Date());
  const [showAdd,setShowAdd]=useState(false);
  const [newE,setNewE]=useState({title:"",date:todayISO(),type:"deadline",funder:"",color:C.red});

  const y=month.getFullYear(), m=month.getMonth();
  const firstDay=new Date(y,m,1).getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const monthName=month.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const prev=()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1));
  const next=()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1));

  const eventsOnDay=(day)=>{
    const iso=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter(e=>e.date===iso);
  };

  const addEvent=()=>{
    if(!newE.title||!newE.date) return;
    setEvents(prev=>[...prev,{...newE,id:uid()}]);
    setNewE({title:"",date:todayISO(),type:"deadline",funder:"",color:C.red});
    setShowAdd(false);
  };

  const upcoming=[...events].filter(e=>daysUntil(e.date)>=0).sort((a,b)=>daysUntil(a.date)-daysUntil(b.date)).slice(0,8);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
      <div>
        {/* Calendar header */}
        <div style={card({padding:"16px 24px",marginBottom:0,borderBottomLeftRadius:0,borderBottomRightRadius:0,borderBottom:"none"})}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button style={btn("outline",{padding:"6px 12px"})} onClick={prev}>‹</button>
              <div style={{fontSize:18,fontWeight:700,color:C.text,minWidth:200,textAlign:"center"}}>{monthName}</div>
              <button style={btn("outline",{padding:"6px 12px"})} onClick={next}>›</button>
            </div>
            <button style={btn("primary")} onClick={()=>setShowAdd(true)}>+ Add Event</button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{background:C.surfaceL,border:`1px solid ${C.border}`,borderRadius:"0 0 12px 12px",overflow:"hidden",marginBottom:20}}>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"rgba(255,255,255,0.03)",borderBottom:`1px solid ${C.border}`}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,letterSpacing:0.5}}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {Array(firstDay).fill(null).map((_,i)=>(
              <div key={"e"+i} style={{minHeight:80,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:"transparent"}}/>
            ))}
            {Array(daysInMonth).fill(null).map((_,i)=>{
              const day=i+1;
              const dayEvents=eventsOnDay(day);
              const isToday=new Date().getDate()===day&&new Date().getMonth()===m&&new Date().getFullYear()===y;
              return (
                <div key={day} style={{minHeight:80,padding:6,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:isToday?"rgba(212,168,67,0.08)":"transparent"}}>
                  <div style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?C.gold:C.muted,marginBottom:4}}>{day}</div>
                  {dayEvents.map(e=>(
                    <div key={e.id} style={{fontSize:10,fontWeight:600,padding:"2px 5px",borderRadius:4,marginBottom:2,background:e.color||C.blue,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={e.title}>
                      {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add event form */}
        {showAdd&&(
          <div style={card({border:`2px solid ${C.gold}`})}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Add Calendar Event</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><span style={label}>Event Title</span><input style={input()} value={newE.title} onChange={e=>setNewE(p=>({...p,title:e.target.value}))} placeholder="CFA Deadline, Board Meeting..."/></div>
              <div><span style={label}>Date</span><input type="date" style={input()} value={newE.date} onChange={e=>setNewE(p=>({...p,date:e.target.value}))}/></div>
              <div><span style={label}>Type</span>
                <select style={input()} value={newE.type} onChange={e=>setNewE(p=>({...p,type:e.target.value,color:e.target.value==="deadline"?C.red:e.target.value==="event"?C.gold:C.blue}))}>
                  <option value="deadline">Deadline</option><option value="event">Event</option><option value="task">Task</option><option value="report">Report Due</option>
                </select>
              </div>
              <div><span style={label}>Funder / Context</span><input style={input()} value={newE.funder} onChange={e=>setNewE(p=>({...p,funder:e.target.value}))} placeholder="Funder name or context"/></div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button style={btn("outline")} onClick={()=>setShowAdd(false)}>Cancel</button>
              <button style={btn("primary")} onClick={addEvent}>Add Event</button>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming sidebar */}
      <div style={card({height:"fit-content",position:"sticky",top:0})}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.text}}>Upcoming</div>
        {upcoming.map(e=>{
          const d=daysUntil(e.date);
          const dc=d<=7?"red":d<=21?"amber":"green";
          return (
            <div key={e.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:6,borderRadius:3,background:e.color||C.blue,flexShrink:0,alignSelf:"stretch"}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{e.title}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>{fmtDate(e.date)}</div>
                {e.funder&&<div style={{fontSize:11,color:C.muted}}>{e.funder}</div>}
              </div>
              <span style={badge(dc)}>{d===0?"TODAY":`${d}d`}</span>
            </div>
          );
        })}
        {upcoming.length===0&&<div style={{color:C.muted,fontSize:13}}>No upcoming events.</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TASKS
   ═══════════════════════════════════════════════════════════════════════════ */
function TasksView({tasks,setTasks,funders}){
  const [filter,setFilter]=useState("open");
  const [showAdd,setShowAdd]=useState(false);
  const [newT,setNewT]=useState({text:"",funder:"",due:"",priority:"medium",done:false});

  const addTask=()=>{
    if(!newT.text.trim()) return;
    setTasks(prev=>[...prev,{...newT,id:uid()}]);
    setNewT({text:"",funder:"",due:"",priority:"medium",done:false});
    setShowAdd(false);
  };
  const toggle=(id)=>setTasks(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
  const del=(id)=>setTasks(prev=>prev.filter(t=>t.id!==id));

  const shown=tasks.filter(t=>filter==="all"?true:filter==="open"?!t.done:t.done).sort((a,b)=>daysUntil(a.due||"2099")-daysUntil(b.due||"2099"));

  // Group by funder
  const groups={};
  shown.forEach(t=>{
    const g=t.funder||"General";
    if(!groups[g]) groups[g]=[];
    groups[g].push(t);
  });

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        {["open","done","all"].map(f=>(
          <button key={f} style={{...btn("outline"),background:filter===f?C.navy:"",color:filter===f?C.white:"",border:filter===f?`1px solid ${C.navy}`:`1px solid ${C.border}`,textTransform:"capitalize",padding:"6px 14px"}} onClick={()=>setFilter(f)}>
            {f} ({tasks.filter(t=>f==="all"?true:f==="open"?!t.done:t.done).length})
          </button>
        ))}
        <div style={{flex:1}}/>
        <button style={btn("primary")} onClick={()=>setShowAdd(true)}>+ Add Task</button>
      </div>

      {showAdd&&(
        <div style={card({border:`2px solid ${C.gold}`,marginBottom:20})}>
          <div style={{fontWeight:700,marginBottom:12}}>Add Task</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
            <div style={{gridColumn:"span 3"}}><span style={label}>Task</span><input style={input()} value={newT.text} onChange={e=>setNewT(p=>({...p,text:e.target.value}))} placeholder="What needs to be done?"/></div>
            <div><span style={label}>Funder</span>
              <select style={input()} value={newT.funder} onChange={e=>setNewT(p=>({...p,funder:e.target.value}))}>
                <option value="">General</option>
                {funders.map(f=><option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div><span style={label}>Due Date</span><input type="date" style={input()} value={newT.due} onChange={e=>setNewT(p=>({...p,due:e.target.value}))}/></div>
            <div><span style={label}>Priority</span>
              <select style={input()} value={newT.priority} onChange={e=>setNewT(p=>({...p,priority:e.target.value}))}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={btn("outline")} onClick={()=>setShowAdd(false)}>Cancel</button>
            <button style={btn("primary")} onClick={addTask}>Add Task</button>
          </div>
        </div>
      )}

      {Object.entries(groups).map(([group,gtasks])=>(
        <div key={group} style={card({marginBottom:16})}>
          <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${C.gold}`}}>{group} <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({gtasks.filter(t=>!t.done).length} open)</span></div>
          {gtasks.map(t=>{
            const d=t.due?daysUntil(t.due):null;
            const dc=d===null?"blue":d<=0?"red":d<=7?"red":d<=14?"amber":"green";
            return (
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`,opacity:t.done?0.5:1}}>
                <input type="checkbox" checked={t.done} onChange={()=>toggle(t.id)} style={{width:16,height:16,cursor:"pointer",accentColor:C.green}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
                  <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                    <span style={badge(priorityColor(t.priority))}>{t.priority}</span>
                    {t.due&&<span style={badge(dc)}>{d===0?"DUE TODAY":d<0?`${Math.abs(d)}d overdue`:`Due ${fmtDate(t.due)}`}</span>}
                  </div>
                </div>
                <button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}} onClick={()=>del(t.id)}>✕</button>
              </div>
            );
          })}
        </div>
      ))}
      {Object.keys(groups).length===0&&<div style={card({color:C.muted,textAlign:"center",padding:40})}>No tasks. You're all caught up!</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WRITING STUDIO
   ═══════════════════════════════════════════════════════════════════════════ */
function WritingStudio({profile,funders}){
  const [funder,setFunder]=useState("");
  const [docType,setDocType]=useState("LOI");
  const [context,setContext]=useState("");
  const [output,setOutput]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [copied,setCopied]=useState(false);

  const DOC_TYPES=["LOI","Grant Proposal","Alignment Memo","One-Pager","Thank You Letter","Impact Report","Board Briefing","Donor Cultivation Email","Case for Support"];

  const generate=async()=>{
    if(!funder||!docType){setErr("Select a funder and document type."); return;}
    setLoading(true); setErr(""); setOutput("");
    try{
      const selectedFunder=funders.find(f=>f.name===funder)||{name:funder};
      const res=await fetch("/api/write-document",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profile,funder:selectedFunder,docType,context})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Generation failed");
      setOutput(data.document||data.text||"");
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const copy=()=>{navigator.clipboard.writeText(output).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})};

  return (
    <div>
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:20})}>
        <div style={{fontSize:20,fontWeight:800,color:C.gold}}>✍️ AI Writing Studio</div>
        <div style={{fontSize:13,color:"#aabbd4",marginTop:4}}>Generate grant proposals, LOIs, memos, and more — pre-filled with your organization's real data and each funder's known priorities.</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:20}}>
        {/* Controls */}
        <div>
          <div style={card()}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.text}}>Document Settings</div>
            <div style={{marginBottom:12}}>
              <span style={label}>Select Funder</span>
              <select style={input()} value={funder} onChange={e=>setFunder(e.target.value)}>
                <option value="">— Choose a funder —</option>
                {funders.map(f=><option key={f.id} value={f.name}>{f.name}</option>)}
                <option value="[Other funder]">Other...</option>
              </select>
            </div>
            <div style={{marginBottom:12}}>
              <span style={label}>Document Type</span>
              <select style={input()} value={docType} onChange={e=>setDocType(e.target.value)}>
                {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{marginBottom:16}}>
              <span style={label}>Additional Context (optional)</span>
              <textarea style={input({height:80})} value={context} onChange={e=>setContext(e.target.value)} placeholder="Specific program focus, amount requested, deadline, any special notes..."/>
            </div>
            <button style={btn("primary",{width:"100%",justifyContent:"center",padding:"12px"})} onClick={generate} disabled={loading}>
              {loading?"⏳ Generating...":"⚡ Generate Document"}
            </button>
            {err&&<div style={{color:C.red,fontSize:12,marginTop:8}}>{err}</div>}
          </div>

          <div style={card()}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:C.text}}>Quick Generate</div>
            {[
              {label:"CFA Eligibility Form",funder:"Community Foundation of Acadiana",doc:"LOI"},
              {label:"Myers Alignment Memo",funder:"Keith & Ginger Myers Family Foundation",doc:"Alignment Memo"},
              {label:"Diocese Support Letter Request",funder:"Diocese of Lafayette Foundation",doc:"Donor Cultivation Email"},
              {label:"Raskob Application",funder:"Raskob Foundation for Catholic Activities",doc:"Grant Proposal"},
            ].map(q=>(
              <button key={q.label} style={{...btn("outline"),display:"block",width:"100%",textAlign:"left",marginBottom:6,fontSize:12,padding:"8px 12px"}} onClick={()=>{setFunder(q.funder);setDocType(q.doc);}}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output */}
        <div style={card({display:"flex",flexDirection:"column",minHeight:500})}>
          {!output&&!loading&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",color:C.muted,textAlign:"center",padding:40}}>
              <div style={{fontSize:48,marginBottom:16}}>✍️</div>
              <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>Ready to write</div>
              <div style={{fontSize:14}}>Select a funder and document type, then click Generate.</div>
            </div>
          )}
          {loading&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:40}}>
              <div style={{fontSize:40,marginBottom:16}}>✍️</div>
              <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>Writing your {docType}...</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Applying your org profile, funder priorities, and grant strategy</div>
              <div style={{width:"100%",height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:"60%",background:C.gold,borderRadius:2}}/>
              </div>
            </div>
          )}
          {output&&(
            <div style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>{docType} — {funder}</div>
                <div style={{display:"flex",gap:8}}>
                  <button style={btn("outline",{fontSize:12,padding:"6px 12px"})} onClick={copy}>{copied?"✓ Copied!":"Copy Text"}</button>
                  <button style={btn("primary",{fontSize:12,padding:"6px 12px"})} onClick={generate}>Regenerate</button>
                </div>
              </div>
              <textarea
                style={{flex:1,width:"100%",padding:"16px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,fontFamily:"'Georgia', serif",lineHeight:1.8,resize:"none",outline:"none",color:C.text,boxSizing:"border-box",minHeight:400}}
                value={output}
                onChange={e=>setOutput(e.target.value)}
              />
              <div style={{fontSize:11,color:C.muted,marginTop:8}}>You can edit the generated text above before copying or saving.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PORTFOLIO
   ═══════════════════════════════════════════════════════════════════════════ */
function Portfolio({profile}){
  const programs=(profile.programs||"").split(",").map(p=>p.trim()).filter(Boolean);
  return (
    <div>
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:"#aabbd4",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Public Portfolio Preview</div>
            <div style={{fontSize:22,fontWeight:800,color:C.gold}}>{profile.name}</div>
            {profile.apostolate&&<div style={{fontSize:15,color:"#c0d0e8",marginTop:4}}>{profile.apostolate}</div>}
            <div style={{fontSize:13,color:"#aabbd4",marginTop:4}}>{profile.city}, {profile.state} · Founded {profile.founded}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {profile.catholic&&<span style={{...badge("blue"),background:"rgba(255,255,255,0.15)",color:"#c0d0e8"}}>⛪ Catholic</span>}
            <span style={{...badge("green"),background:"rgba(255,255,255,0.15)",color:"#c0d0e8"}}>501(c)(3) · EIN {profile.ein}</span>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={card({marginBottom:0})}>
          <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:12}}>Our Mission</div>
          <div style={{fontSize:14,lineHeight:1.8,color:C.text}}>{profile.mission}</div>
          {profile.canonicalStatus&&<div style={{marginTop:12,padding:"10px 14px",background:C.blueL,borderRadius:8,fontSize:12,color:C.blue}}><strong>Canonical Status:</strong> {profile.canonicalStatus}</div>}
        </div>

        <div style={card({marginBottom:0})}>
          <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:12}}>Impact by the Numbers</div>
          {[
            {n:profile.families+"+",l:"Families Served Weekly"},
            {n:profile.mealsWeekly,l:"Hot Meals Every Thursday"},
            {n:profile.womenServed,l:"Women Housed in 2025"},
            {n:profile.volunteers,l:"Dedicated Volunteers"},
            {n:"$0",l:"Administrative Overhead"},
          ].map(({n,l})=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.text}}>{l}</span>
              <span style={{fontSize:16,fontWeight:800,color:C.text}}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card()}>
        <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:16}}>Programs & Apostolates</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {programs.map((p,i)=>(
            <div key={i} style={{padding:"12px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,color:C.text}}>
              <span style={{color:C.gold,fontWeight:700,marginRight:6}}>▶</span>{p}
            </div>
          ))}
        </div>
      </div>

      <div style={card({background:C.goldL,border:`1px solid ${C.gold}`})}>
        <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:8}}>Contact & Connect</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div><span style={{fontSize:12,color:C.muted,display:"block"}}>Director</span><span style={{fontSize:13,fontWeight:600}}>{profile.director}</span></div>
          <div><span style={{fontSize:12,color:C.muted,display:"block"}}>Phone</span><span style={{fontSize:13,fontWeight:600}}>{profile.phone}</span></div>
          <div><span style={{fontSize:12,color:C.muted,display:"block"}}>Website</span><span style={{fontSize:13,fontWeight:600,color:C.blue}}>{profile.website}</span></div>
          <div style={{gridColumn:"span 3"}}><span style={{fontSize:12,color:C.muted,display:"block"}}>Address</span><span style={{fontSize:13,fontWeight:600}}>{profile.address}, {profile.city}, {profile.state} {profile.zip}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DONOR HUB
   ═══════════════════════════════════════════════════════════════════════════ */
function DonorHub(){
  const [donors,setDonors]=useState(()=>load("goforth_donors",[
    {id:uid(),name:"Keith & Ginger Myers Family Foundation",type:"Family Foundation",focus:"Catholic charities, healthcare education",location:"Sunset, LA",socials:"",media:"$8M+ assets · $2M+ annual grants · Active local philanthropy",connected:false},
    {id:uid(),name:"Rucks Family Foundation",type:"Family Foundation",focus:"Community strengthening, humanitarian causes",location:"Lafayette, LA",socials:"",media:"Active grantmaking to local nonprofits across Acadiana",connected:false},
    {id:uid(),name:"Community Foundation of Acadiana",type:"Community Foundation",focus:"Nonprofit capacity, human services, youth",location:"Lafayette, LA",socials:"cfacadiana.org",media:"2026 Competitive Grants cycle open",connected:true},
  ]));
  const [showAdd,setShowAdd]=useState(false);
  const [newD,setNewD]=useState({name:"",type:"Individual",focus:"",location:"",socials:"",media:"",connected:false});

  useEffect(()=>save("goforth_donors",donors),[donors]);

  const addDonor=()=>{
    if(!newD.name) return;
    setDonors(p=>[...p,{...newD,id:uid()}]);
    setNewD({name:"",type:"Individual",focus:"",location:"",socials:"",media:"",connected:false});
    setShowAdd(false);
  };

  return (
    <div>
      <div style={card({background:`linear-gradient(135deg,#111113,#1a1a1f)`,color:C.white,marginBottom:20,border:`1px solid rgba(255,255,255,0.08)`})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:C.gold}}>🤝 Donor Hub</div>
            <div style={{fontSize:13,color:"rgba(161,161,170,0.75)",marginTop:4}}>Authentic connections between your mission and the people who fund it. Transparent, real, and relationship-first.</div>
          </div>
          <button style={btn("primary")} onClick={()=>setShowAdd(true)}>+ Add Donor Profile</button>
        </div>
      </div>

      {showAdd&&(
        <div style={card({border:`2px solid ${C.gold}`,marginBottom:20})}>
          <div style={{fontWeight:700,marginBottom:14}}>New Donor / Funder Profile</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><span style={label}>Name / Foundation</span><input style={input()} value={newD.name} onChange={e=>setNewD(p=>({...p,name:e.target.value}))} placeholder="Name or foundation"/></div>
            <div><span style={label}>Type</span>
              <select style={input()} value={newD.type} onChange={e=>setNewD(p=>({...p,type:e.target.value}))}>
                {["Individual","Family Foundation","Community Foundation","Corporate","Faith Community","Other"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><span style={label}>Giving Focus</span><input style={input()} value={newD.focus} onChange={e=>setNewD(p=>({...p,focus:e.target.value}))} placeholder="Catholic charities, healthcare, youth..."/></div>
            <div><span style={label}>Location</span><input style={input()} value={newD.location} onChange={e=>setNewD(p=>({...p,location:e.target.value}))} placeholder="City, State"/></div>
            <div><span style={label}>Social / Website</span><input style={input()} value={newD.socials} onChange={e=>setNewD(p=>({...p,socials:e.target.value}))} placeholder="website.org or @handle"/></div>
            <div><span style={label}>About / Media</span><input style={input()} value={newD.media} onChange={e=>setNewD(p=>({...p,media:e.target.value}))} placeholder="Recent news, press releases, giving history..."/></div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button style={btn("outline")} onClick={()=>setShowAdd(false)}>Cancel</button>
            <button style={btn("primary")} onClick={addDonor}>Add Profile</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {donors.map(d=>(
          <div key={d.id} style={card({marginBottom:0,borderTop:`3px solid ${d.connected?C.green:C.gold}`})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:C.text}}>{d.name}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{d.type} · {d.location}</div>
              </div>
              <span style={badge(d.connected?"green":"amber")}>{d.connected?"Connected":"Prospect"}</span>
            </div>
            {d.focus&&<div style={{fontSize:13,color:C.text,marginBottom:8}}><strong>Focus:</strong> {d.focus}</div>}
            {d.media&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:8}}>{d.media}</div>}
            {d.socials&&<div style={{fontSize:12,color:C.blue}}><strong>Web:</strong> {d.socials}</div>}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button style={btn("outline",{fontSize:11,padding:"5px 10px"})} onClick={()=>setDonors(p=>p.map(x=>x.id===d.id?{...x,connected:!x.connected}:x))}>
                {d.connected?"Disconnect":"Mark Connected"}
              </button>
              <button style={{...btn("outline",{fontSize:11,padding:"5px 10px"}),color:C.red,borderColor:C.red}} onClick={()=>setDonors(p=>p.filter(x=>x.id!==d.id))}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div style={card({marginTop:20,background:C.bg,border:`1px dashed ${C.border}`,textAlign:"center",padding:40})}>
        <div style={{fontSize:24,marginBottom:8}}>🌐</div>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>GoForth Network — Coming Soon</div>
        <div style={{fontSize:13,color:C.muted}}>Donors will be able to discover your mission, follow your live impact feed, and connect directly — all on the GoForth platform.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════════════════════════════════════ */
function Settings({profile,setProfile,profiles,setProfiles,activeProfileId,setActiveProfileId,addProfile,deleteProfile}){
  const [local,setLocal]=useState(profile);
  const [saved,setSaved]=useState(false);

  // Sync local state when active profile changes externally
  const [lastProfileId,setLastProfileId]=useState(profile.id);
  if(profile.id!==lastProfileId){setLocal(profile);setLastProfileId(profile.id);}

  const save_=()=>{setProfile(local);setSaved(true);setTimeout(()=>setSaved(false),2000);};

  const field=(key,lbl,type="text",placeholder="")=>(
    <div>
      <span style={label}>{lbl}</span>
      {type==="textarea"
        ?<textarea style={input({height:80})} value={local[key]||""} onChange={e=>setLocal(p=>({...p,[key]:e.target.value}))} placeholder={placeholder}/>
        :<input type={type} style={input()} value={local[key]||""} onChange={e=>setLocal(p=>({...p,[key]:e.target.value}))} placeholder={placeholder}/>
      }
    </div>
  );

  return (
    <div>
      {/* ── Multi-org profile switcher ─────────────────────────────────── */}
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:16})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:"#aabbd4",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Organization Profiles</div>
            <div style={{fontSize:18,fontWeight:800,color:C.gold}}>{profiles.length} Profile{profiles.length!==1?"s":""} Configured</div>
          </div>
          <button style={btn("primary")} onClick={addProfile}>+ Add Organization</button>
        </div>
        {profiles.length>1&&(
          <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
            {profiles.map(p=>(
              <button key={p.id} style={{
                padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                background:p.id===activeProfileId?C.gold:"rgba(255,255,255,0.1)",
                color:p.id===activeProfileId?C.navy:C.white,
                border:p.id===activeProfileId?"none":"1px solid rgba(255,255,255,0.2)"
              }} onClick={()=>setActiveProfileId(p.id)}>
                {p.name.slice(0,24)}{p.name.length>24?"...":""}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={card()}>
        <div style={{fontWeight:700,fontSize:18,color:C.text,marginBottom:4}}>Organization Profile</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>This profile powers all daily plans, grant applications, and AI-generated documents.</div>

        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Organization Identity</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {field("name","Organization Name","text","St. Teresa Center...")}
          {field("apostolate","Primary Apostolate","text","Pope John XXIII House...")}
          {field("ein","EIN / Tax ID","text","81-XXXXXXX")}
          {field("founded","Year Founded","text","2016")}
          {field("director","Director / Executive","text","Fr. Michael Champagne, CJC")}
          {field("diocese","Diocese / Governing Body","text","Diocese of Lafayette")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Contact Information</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {field("address","Street Address")}
          {field("city","City")}
          {field("state","State","text","LA")}
          {field("zip","ZIP Code")}
          {field("phone","Phone")}
          {field("website","Website")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Mission & Programs</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:20}}>
          {field("mission","Mission Statement","textarea","Describe your organization's core mission...")}
          {field("programs","Programs & Apostolates","textarea","List programs, separated by commas...")}
          {field("canonicalStatus","Canonical / Legal Status","textarea","")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Impact Metrics</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
          {field("families","Families Served")}
          {field("volunteers","Active Volunteers")}
          {field("mealsWeekly","Hot Meals / Week")}
          {field("womenServed","Women Housed (Annual)")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Funding Preferences</div>
        <div style={{display:"flex",gap:20,marginBottom:20,flexWrap:"wrap"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
            <input type="checkbox" checked={local.catholic||false} onChange={e=>setLocal(p=>({...p,catholic:e.target.checked}))} style={{accentColor:C.navy}}/> Faith-based / Catholic organization
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
            <input type="checkbox" checked={local.govFunding||false} onChange={e=>setLocal(p=>({...p,govFunding:e.target.checked}))} style={{accentColor:C.navy}}/> Include government funding sources
          </label>
        </div>

        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <button style={btn("primary",{padding:"12px 24px",fontSize:14})} onClick={save_}>
            {saved?"✓ Saved!":"Save Profile"}
          </button>
          {profiles.length>1&&(
            <button style={{...btn("outline",{padding:"12px 24px",fontSize:14}),color:C.red,borderColor:C.red}}
              onClick={()=>{if(window.confirm(`Delete "${profile.name}"? This cannot be undone.`))deleteProfile(profile.id);}}>
              🗑 Delete This Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */
export default function GoForth(){
  const [tab,setTab]=useState("dashboard");

  // ── Multi-org profile system ──────────────────────────────────────────────
  const [profiles,setProfiles_]=useState(()=>{
    const stored=load("goforth_profiles",null);
    if(stored&&stored.length>0) return stored;
    // Migrate legacy single profile if present
    const legacy=load("goforth_profile",null);
    const base=legacy||DEF_PROFILE;
    return [{...base,id:base.id||uid()}];
  });
  const [activeProfileId,setActiveProfileId_]=useState(()=>{
    const stored=load("goforth_active_profile_id",null);
    return stored;
  });

  const profile=profiles.find(p=>p.id===activeProfileId)||profiles[0];
  const setProfiles=v=>{setProfiles_(v);save("goforth_profiles",v);};
  const setActiveProfileId=id=>{setActiveProfileId_(id);save("goforth_active_profile_id",id);};
  const setProfile=v=>{
    const updated=profiles.map(p=>p.id===profile.id?{...v,id:p.id}:p);
    setProfiles(updated);
  };
  const addProfile=()=>{
    const newId=uid();
    const newProf={...DEF_PROFILE,id:newId,name:"New Organization",ein:"",founded:""};
    setProfiles([...profiles,newProf]);
    setActiveProfileId(newId);
    setTab("settings");
  };
  const deleteProfile=(id)=>{
    if(profiles.length<=1){alert("You must have at least one organization profile.");return;}
    const remaining=profiles.filter(p=>p.id!==id);
    setProfiles(remaining);
    setActiveProfileId(remaining[0].id);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const [funders,setFunders_]=useState(()=>load("goforth_funders",DEF_FUNDERS));
  const [tasks,setTasks_]=useState(()=>load("goforth_tasks",DEF_TASKS));
  const [events,setEvents_]=useState(()=>load("goforth_events",DEF_EVENTS));

  const setFunders=fn=>{setFunders_(p=>{const n=typeof fn==="function"?fn(p):fn;save("goforth_funders",n);return n;});};
  const setTasks=fn=>{setTasks_(p=>{const n=typeof fn==="function"?fn(p):fn;save("goforth_tasks",n);return n;});};
  const setEvents=fn=>{setEvents_(p=>{const n=typeof fn==="function"?fn(p):fn;save("goforth_events",n);return n;});};

  const openTasks=tasks.filter(t=>!t.done).length;
  const nextDeadline=[...events].filter(e=>daysUntil(e.date)>=0&&e.type==="deadline").sort((a,b)=>daysUntil(a.date)-daysUntil(b.date))[0];

  return (
    <div style={{display:"flex",height:"100dvh",fontFamily:"'Inter','Segoe UI',Arial,sans-serif",background:C.bg,color:C.text,overflow:"hidden",position:"relative"}}>
      {/* Sidebar */}
      <div style={{width:224,background:"#0a0a0c",display:"flex",flexDirection:"column",flexShrink:0,borderRight:`1px solid rgba(255,255,255,0.06)`,boxShadow:`4px 0 24px rgba(0,0,0,0.5)`}}>
        {/* Logo */}
        <div style={{padding:"26px 20px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
            <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(145deg,${C.goldBright} 0%,${C.gold} 60%,${C.goldD} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 0 1px rgba(255,255,255,0.1) inset, 0 2px 12px rgba(201,169,110,0.25)`}}>
              <span style={{fontSize:15,fontWeight:800,color:"#0e0c08",lineHeight:1,letterSpacing:-0.5}}>G</span>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#f0f0f4",letterSpacing:-0.5,lineHeight:1}}>GoForth</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",marginTop:2,textTransform:"uppercase",letterSpacing:1.6}}>Grant Intelligence</div>
            </div>
          </div>
          <div style={{height:"1px",background:`linear-gradient(90deg,rgba(201,169,110,0.35),transparent)`,marginTop:18}}/>
        </div>
        <nav style={{flex:1,padding:"4px 10px",overflowY:"auto"}}>
          {TABS.map(t=>{
            const active=tab===t.id;
            return (
              <div key={t.id} style={{
                display:"flex",alignItems:"center",gap:9,
                padding:active?"9px 11px 9px 10px":"9px 11px 9px 12px",
                cursor:"pointer",
                color:active?"#f0f0f4":"rgba(152,152,168,0.72)",
                background:active?`rgba(201,169,110,0.08)`:"transparent",
                borderRadius:9,
                borderLeft:active?`2px solid ${C.gold}`:"2px solid transparent",
                fontSize:13,fontWeight:active?600:400,
                letterSpacing:active?-0.1:0,
                transition:"all 0.18s cubic-bezier(0.4,0,0.2,1)",
                marginBottom:2}}
                onClick={()=>setTab(t.id)}>
                {t.label}
                {t.id==="tasks"&&openTasks>0&&<span style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:7,fontSize:9.5,fontWeight:700,padding:"2px 6px",lineHeight:1.4}}>{openTasks}</span>}
              </div>
            );
          })}
        </nav>
        {/* Org switcher */}
        <div style={{padding:"14px 18px 18px",borderTop:`1px solid rgba(255,255,255,0.05)`}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.22)",textTransform:"uppercase",letterSpacing:1.2,marginBottom:6}}>Active Organization</div>
          {profiles.length>1?(
            <select style={{width:"100%",background:"rgba(255,255,255,0.05)",border:`1px solid rgba(255,255,255,0.09)`,color:"rgba(212,212,216,0.85)",fontSize:11,borderRadius:7,padding:"5px 7px",cursor:"pointer",marginBottom:4}}
              value={profile.id} onChange={e=>setActiveProfileId(e.target.value)}>
              {profiles.map(p=><option key={p.id} value={p.id} style={{background:"#111"}}>{p.name.slice(0,30)}</option>)}
            </select>
          ):(
            <div style={{fontSize:11,color:"rgba(161,161,170,0.7)",marginBottom:4,lineHeight:1.4}}>{profile.name.slice(0,28)}{profile.name.length>28?"...":""}</div>
          )}
          <div style={{fontSize:9,color:"rgba(255,255,255,0.18)",marginBottom:6}}>EIN {profile.ein||"—"}</div>
          <button style={{background:"rgba(255,255,255,0.04)",border:`1px dashed rgba(255,255,255,0.12)`,color:"rgba(161,161,170,0.55)",borderRadius:7,padding:"5px 10px",fontSize:10,cursor:"pointer",width:"100%",transition:"all 0.13s"}} onClick={addProfile}>+ Add Organization</button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",zIndex:1}}>
        {/* Top bar */}
        <div style={{background:"rgba(9,9,11,0.85)",backdropFilter:"blur(16px)",borderBottom:`1px solid rgba(255,255,255,0.07)`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,flexShrink:0}}>
          <div style={{fontWeight:600,fontSize:14,color:"#e8e8ec",letterSpacing:-0.2}}>
            {TABS.find(t=>t.id===tab)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {nextDeadline&&(
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 12px",background:daysUntil(nextDeadline.date)<=7?C.redL:C.amberL,borderRadius:20,border:`1px solid ${daysUntil(nextDeadline.date)<=7?"rgba(244,63,94,0.2)":"rgba(245,158,11,0.2)"}`}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:daysUntil(nextDeadline.date)<=7?"#f43f5e":"#f59e0b",flexShrink:0}}/>
                <span style={{fontSize:11.5,fontWeight:600,color:daysUntil(nextDeadline.date)<=7?"#fb7185":"#fbbf24"}}>
                  {daysUntil(nextDeadline.date)}d · {nextDeadline.title}
                </span>
              </div>
            )}
            <div style={{fontSize:11,color:C.muted,letterSpacing:0.1}}>{todayFull()}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:28,WebkitOverflowScrolling:"touch",animation:"fadeIn 0.18s ease",background:C.bg}}>
          {tab==="dashboard"&&<Dashboard profile={profile} funders={funders} tasks={tasks} events={events} setTab={setTab}/>}
          {tab==="daily"&&<DailyPlan profile={profile} funders={funders} events={events}/>}
          {tab==="funders"&&<FundersPipeline funders={funders} setFunders={setFunders} tasks={tasks} setTasks={setTasks} profile={profile}/>}
          {tab==="calendar"&&<CalendarView events={events} setEvents={setEvents}/>}
          {tab==="tasks"&&<TasksView tasks={tasks} setTasks={setTasks} funders={funders}/>}
          {tab==="writing"&&<WritingStudio profile={profile} funders={funders}/>}
          {tab==="portfolio"&&<Portfolio profile={profile}/>}
          {tab==="donors"&&<DonorHub/>}
          {tab==="settings"&&<Settings profile={profile} setProfile={setProfile} profiles={profiles} setProfiles={setProfiles} activeProfileId={profile.id} setActiveProfileId={setActiveProfileId} addProfile={addProfile} deleteProfile={deleteProfile}/>}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..900;1,14..32,300..900&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { height: 100%; overflow: hidden; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; background: #080809; color: #e8e8ec; }
        button { touch-action: manipulation; cursor: pointer; font-family: inherit; }
        a { touch-action: manipulation; }
        input, select, textarea { font-family: inherit; -webkit-font-smoothing: antialiased; background: rgba(255,255,255,0.04); color: #e8e8ec; border-color: rgba(255,255,255,0.07); }
        input::placeholder, textarea::placeholder { color: rgba(107,107,120,0.8); }
        select option { background: #141417; color: #e8e8ec; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @keyframes progress { 0%{width:8%} 40%{width:65%} 80%{width:88%} 100%{width:95%} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes subtlePulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,169,110,0)} 50%{box-shadow:0 0 0 4px rgba(201,169,110,0.08)} }
        button:hover { filter: brightness(1.1); transform: translateY(-1px); }
        button:active { transform: scale(0.975) translateY(0); filter: brightness(0.95); }
        nav > div:hover:not([style*="rgba(201,169,110"]) { background: rgba(255,255,255,0.04) !important; color: rgba(232,232,236,0.9) !important; }
        .gc-card-hover:hover { transform: translateY(-2px); box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.28), 0 24px 56px rgba(0,0,0,0.14) !important; }
        @media (max-width: 768px) { button { min-height: 44px; min-width: 44px; } }
      `}</style>
    </div>
  );
}
