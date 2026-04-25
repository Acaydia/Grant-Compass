import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  navy:"#1a2744", navyL:"#243256", navyXL:"#2e3f6f",
  gold:"#c9a84c", goldL:"#f8eecc", goldD:"#9a7a2a",
  green:"#27674a", greenL:"#e6f4ec",
  red:"#b92c2c", redL:"#fceaea",
  amber:"#996600", amberL:"#fff8e1",
  blue:"#1a4a7a", blueL:"#e8f0fb",
  bg:"#f4f5fa", white:"#ffffff",
  border:"#e1e5ed", text:"#1c2233", muted:"#6b7280",
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
  {id:uid(),title:"Digging Deeper Women's Retreat",date:"2026-10-09",type:"event",funder:"Major Donor Cultivation",color:C.navy},
  {id:uid(),title:"iGiveCatholic Campaign",date:"2026-11-17",type:"event",funder:"Annual Campaign",color:C.green},
  {id:uid(),title:"Raskob Fall Cycle Opens",date:"2026-09-01",type:"deadline",funder:"Raskob Foundation",color:C.blue},
];

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const card = (extra={}) => ({background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:24,marginBottom:20,...extra});
const btn = (v="primary",extra={}) => ({
  padding:"9px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,
  background:v==="primary"?C.gold:v==="navy"?C.navy:v==="green"?C.green:v==="red"?C.red:"#f0f1f5",
  color:v==="outline"?C.navy:v==="primary"?C.navy:C.white,
  border:v==="outline"?`1px solid ${C.border}`:"none",
  display:"inline-flex",alignItems:"center",gap:6,...extra
});
const badge = (c="blue") => ({
  display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700,
  background:c==="red"?C.redL:c==="amber"?C.amberL:c==="green"?C.greenL:C.blueL,
  color:c==="red"?C.red:c==="amber"?C.amber:c==="green"?C.green:C.blue,
});
const input = (extra={}) => ({width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",...extra});
const label = {display:"block",fontSize:11,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:0.5};

/* ─── TABS ────────────────────────────────────────────────────────────────── */
const TABS = [
  {id:"dashboard",icon:"⚡",label:"Dashboard"},
  {id:"daily",icon:"📋",label:"Daily Plan"},
  {id:"funders",icon:"🔍",label:"Funders"},
  {id:"calendar",icon:"📅",label:"Calendar"},
  {id:"tasks",icon:"✅",label:"Tasks"},
  {id:"writing",icon:"✍️",label:"Writing Studio"},
  {id:"portfolio",icon:"🏛️",label:"Portfolio"},
  {id:"donors",icon:"🤝",label:"Donor Hub"},
  {id:"settings",icon:"⚙️",label:"Settings"},
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
      <div style={card({padding:"20px 24px",background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyXL} 100%)`,color:C.white,marginBottom:24})}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:C.gold}}>{profile.name}</div>
            <div style={{fontSize:13,color:"#aabbd4",marginTop:3}}>{profile.apostolate} · {profile.city}, {profile.state} · {todayFull()}</div>
          </div>
          {nextDeadline && (
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"#aabbd4",textTransform:"uppercase",letterSpacing:1}}>Next Deadline</div>
              <div style={{fontSize:28,fontWeight:900,color:daysUntil(nextDeadline.date)<=7?C.red:C.gold}}>{daysUntil(nextDeadline.date)}d</div>
              <div style={{fontSize:12,color:"#c0d0e8"}}>{nextDeadline.title}</div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[
          {icon:"👨‍👩‍👧‍👦",label:"Families Served",value:profile.families+"+",sub:"weekly",color:C.navy},
          {icon:"🍲",label:"Hot Meals / Week",value:profile.mealsWeekly,sub:"every Thursday",color:C.green},
          {icon:"🏠",label:"Women Housed",value:profile.womenServed,sub:"in 2025",color:C.blue},
          {icon:"🙏",label:"Volunteers",value:profile.volunteers,sub:"100% volunteer-run",color:C.gold},
        ].map(m=>(
          <div key={m.label} style={card({padding:20,marginBottom:0})}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28}}>{m.icon}</div>
              <div>
                <div style={{fontSize:24,fontWeight:900,color:m.color,lineHeight:1}}>{m.value}</div>
                <div style={{fontSize:12,fontWeight:600,marginTop:2}}>{m.label}</div>
                <div style={{fontSize:11,color:C.muted}}>{m.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* Upcoming deadlines */}
        <div style={card({marginBottom:0})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15}}>📅 Upcoming Deadlines</div>
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
            <div style={{fontWeight:700,fontSize:15}}>✅ Open Tasks</div>
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
          <div style={{fontWeight:700,fontSize:15}}>💼 Active Funder Pipeline</div>
          <button style={btn("outline",{fontSize:12,padding:"5px 12px"})} onClick={()=>setTab("funders")}>Full Pipeline</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {["prospect","active","submitted","won","lost"].map(stage=>{
            const count=funders.filter(f=>f.stage===stage).length;
            const colors={prospect:C.blueL,active:C.amberL,submitted:C.goldL,won:C.greenL,lost:"#f5f5f5"};
            const textColors={prospect:C.blue,active:C.amber,submitted:C.goldD,won:C.green,lost:C.muted};
            return (
              <div key={stage} style={{background:colors[stage],borderRadius:10,padding:"14px 12px",textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:900,color:textColors[stage]}}>{count}</div>
                <div style={{fontSize:11,fontWeight:700,color:textColors[stage],textTransform:"capitalize",marginTop:3}}>{stage}</div>
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
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:C.gold}}>📋 {dow} Development Plan</div>
            <div style={{fontSize:13,color:"#aabbd4",marginTop:3}}>{todayFull()} · {profile.name}</div>
          </div>
          <button style={btn("primary",{fontSize:14,padding:"11px 24px"})} onClick={generate} disabled={loading}>
            {loading?"⏳ Generating...":"⚡ Generate Today's Plan"}
          </button>
        </div>
      </div>

      {err&&<div style={card({background:C.redL,border:`1px solid ${C.red}`,color:C.red,padding:16})}>{err}</div>}

      {!plan&&!loading&&(
        <div style={card({textAlign:"center",padding:60,color:C.muted})}>
          <div style={{fontSize:48,marginBottom:16}}>📋</div>
          <div style={{fontSize:18,fontWeight:700,color:C.navy,marginBottom:8}}>Ready to generate today's plan</div>
          <div style={{fontSize:14,marginBottom:24}}>Click "Generate Today's Plan" to get a daily-refreshed donor prospect briefing with a featured local funder, deadline countdown, messaging framework, and 7-day sprint.</div>
          <div style={{fontSize:12,color:C.amber,fontWeight:600}}>Powered by live web search + Claude AI</div>
        </div>
      )}

      {loading&&(
        <div style={card({textAlign:"center",padding:60})}>
          <div style={{fontSize:40,marginBottom:16,animation:"spin 1s linear infinite"}}>⚡</div>
          <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:8}}>Searching live databases...</div>
          <div style={{fontSize:13,color:C.muted}}>Scanning foundation 990s, local philanthropy networks, and grant portals for today's featured funder</div>
          <div style={{marginTop:16,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",background:C.gold,borderRadius:2,animation:"progress 2s ease-in-out infinite"}}/>
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
            <div style={card({background:`linear-gradient(135deg,${C.goldL},#fff9e0)`,border:`1px solid ${C.gold}`})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.goldD,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>⭐ Today's Featured Funder</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.navy}}>{plan.featuredFunder.name}</div>
                  <div style={{fontSize:13,color:C.navyL,marginTop:4}}>{plan.featuredFunder.type} · {plan.featuredFunder.location}</div>
                  {plan.featuredFunder.assets&&<div style={{fontSize:13,color:C.green,fontWeight:600,marginTop:4}}>Assets: {plan.featuredFunder.assets} · Annual Grants: {plan.featuredFunder.annualGrants}</div>}
                  <div style={{fontSize:13,color:C.text,marginTop:10,lineHeight:1.6}}>{plan.featuredFunder.connection}</div>
                </div>
                <div style={{textAlign:"right",minWidth:120}}>
                  <div style={{fontSize:11,color:C.muted,textTransform:"uppercase"}}>Ask Range</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.navy,marginTop:2}}>{plan.featuredFunder.askRange}</div>
                  <div style={{marginTop:8}}><span style={badge("amber")}>{plan.featuredFunder.status||"Prospect"}</span></div>
                </div>
              </div>
              {plan.featuredFunder.strategyNote&&(
                <div style={{marginTop:16,padding:"12px 16px",background:"rgba(255,255,255,0.7)",borderRadius:8,fontSize:13,color:C.navy,lineHeight:1.6}}>
                  <strong>Strategy:</strong> {plan.featuredFunder.strategyNote}
                </div>
              )}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {/* Messaging */}
            {plan.messaging&&(
              <div style={card({marginBottom:0})}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.navy}}>💬 Today's Messaging</div>
                <div style={{fontSize:13,lineHeight:1.7,color:C.text,marginBottom:12,padding:"12px 14px",background:C.blueL,borderRadius:8,fontStyle:"italic"}}>"{plan.messaging.core}"</div>
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
                <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.navy}}>🏃 7-Day Sprint</div>
                {plan.sprint.map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:C.navy,color:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{item}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deadlines */}
          {plan.deadlines?.length>0&&(
            <div style={card()}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.navy}}>⏰ Active Deadlines</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {plan.deadlines.map((d,i)=>{
                  const dc=d.daysOut<=7?"red":d.daysOut<=21?"amber":"green";
                  return (
                    <div key={i} style={{padding:16,borderRadius:10,background:dc==="red"?C.redL:dc==="amber"?C.amberL:C.greenL,border:`1px solid ${dc==="red"?C.red:dc==="amber"?C.amber:C.green}`}}>
                      <div style={{fontSize:28,fontWeight:900,color:dc==="red"?C.red:dc==="amber"?C.amber:C.green}}>{d.daysOut}d</div>
                      <div style={{fontSize:13,fontWeight:700,color:C.navy,marginTop:4}}>{d.name}</div>
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
              <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.navy}}>🚀 Assets to Deploy Today</div>
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
function FundersPipeline({funders,setFunders,setTasks,tasks}){
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [discovering,setDiscovering]=useState(false);
  const [discovered,setDiscovered]=useState([]);
  const [newF,setNewF]=useState({name:"",type:"Private",stage:"prospect",ask:"",deadline:"",notes:"",priority:"medium",catholic:false,contact:""});
  const [activeStage,setActiveStage]=useState("all");

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

  return (
    <div>
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
          <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:C.navy}}>🌟 Newly Discovered Funders</div>
          {discovered.map((f,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${C.gold}`,gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:C.navy}}>{f.name}</div>
                <div style={{fontSize:12,color:C.navyL,marginTop:2}}>{f.type} · {f.askRange}</div>
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
          <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.navy}}>Add New Funder</div>
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
        return (
          <div key={f.id} style={card({marginBottom:12,borderLeft:`4px solid ${f.priority==="high"?C.red:f.priority==="medium"?C.amber:C.blue}`})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.navy}}>{f.name}</span>
                  <span style={badge(f.stage==="won"?"green":f.stage==="lost"?"red":f.stage==="submitted"?"green":f.stage==="active"?"amber":"blue")}>{f.stage}</span>
                  {f.catholic&&<span style={badge("blue")}>⛪ Catholic</span>}
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{f.type} · Ask: {f.ask||"TBD"}{f.contact?" · "+f.contact:""}</div>
                {f.notes&&<div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{f.notes}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
                {f.deadline&&<span style={badge(dc)}>{d===0?"DUE TODAY":d<0?`${Math.abs(d)}d overdue`:`${d}d · ${fmtDate(f.deadline)}`}</span>}
                <select style={{...input({width:"auto",padding:"4px 8px",fontSize:12}),cursor:"pointer"}} value={f.stage} onChange={e=>updateStage(f.id,e.target.value)}>
                  {stages.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12}} onClick={()=>deleteFunder(f.id)}>✕ Remove</button>
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
              <div style={{fontSize:18,fontWeight:700,color:C.navy,minWidth:200,textAlign:"center"}}>{monthName}</div>
              <button style={btn("outline",{padding:"6px 12px"})} onClick={next}>›</button>
            </div>
            <button style={btn("primary")} onClick={()=>setShowAdd(true)}>+ Add Event</button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:"0 0 12px 12px",overflow:"hidden",marginBottom:20}}>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:C.navy}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:12,fontWeight:700,color:"#aabbd4"}}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
            {Array(firstDay).fill(null).map((_,i)=>(
              <div key={"e"+i} style={{minHeight:80,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:"#fafafa"}}/>
            ))}
            {Array(daysInMonth).fill(null).map((_,i)=>{
              const day=i+1;
              const dayEvents=eventsOnDay(day);
              const isToday=new Date().getDate()===day&&new Date().getMonth()===m&&new Date().getFullYear()===y;
              return (
                <div key={day} style={{minHeight:80,padding:6,borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:isToday?C.goldL:""}}>
                  <div style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?C.goldD:C.muted,marginBottom:4}}>{day}</div>
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
        <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.navy}}>Upcoming</div>
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
          <div style={{fontWeight:700,fontSize:14,color:C.navy,marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${C.gold}`}}>{group} <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({gtasks.filter(t=>!t.done).length} open)</span></div>
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
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:C.navy}}>Document Settings</div>
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
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:C.navy}}>Quick Generate</div>
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
              <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:8}}>Ready to write</div>
              <div style={{fontSize:14}}>Select a funder and document type, then click Generate.</div>
            </div>
          )}
          {loading&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:40}}>
              <div style={{fontSize:40,marginBottom:16}}>✍️</div>
              <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:8}}>Writing your {docType}...</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Applying your org profile, funder priorities, and grant strategy</div>
              <div style={{width:"100%",height:4,background:C.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:"60%",background:C.gold,borderRadius:2}}/>
              </div>
            </div>
          )}
          {output&&(
            <div style={{flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:15,fontWeight:700,color:C.navy}}>{docType} — {funder}</div>
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
          <div style={{fontWeight:700,fontSize:15,color:C.navy,marginBottom:12}}>Our Mission</div>
          <div style={{fontSize:14,lineHeight:1.8,color:C.text}}>{profile.mission}</div>
          {profile.canonicalStatus&&<div style={{marginTop:12,padding:"10px 14px",background:C.blueL,borderRadius:8,fontSize:12,color:C.blue}}><strong>Canonical Status:</strong> {profile.canonicalStatus}</div>}
        </div>

        <div style={card({marginBottom:0})}>
          <div style={{fontWeight:700,fontSize:15,color:C.navy,marginBottom:12}}>Impact by the Numbers</div>
          {[
            {n:profile.families+"+",l:"Families Served Weekly"},
            {n:profile.mealsWeekly,l:"Hot Meals Every Thursday"},
            {n:profile.womenServed,l:"Women Housed in 2025"},
            {n:profile.volunteers,l:"Dedicated Volunteers"},
            {n:"$0",l:"Administrative Overhead"},
          ].map(({n,l})=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.text}}>{l}</span>
              <span style={{fontSize:16,fontWeight:800,color:C.navy}}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card()}>
        <div style={{fontWeight:700,fontSize:15,color:C.navy,marginBottom:16}}>Programs & Apostolates</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {programs.map((p,i)=>(
            <div key={i} style={{padding:"12px 14px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,color:C.text}}>
              <span style={{color:C.gold,fontWeight:700,marginRight:6}}>▶</span>{p}
            </div>
          ))}
        </div>
      </div>

      <div style={card({background:C.goldL,border:`1px solid ${C.gold}`})}>
        <div style={{fontWeight:700,fontSize:15,color:C.navy,marginBottom:8}}>Contact & Connect</div>
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
      <div style={card({background:`linear-gradient(135deg,${C.navy},${C.navyXL})`,color:C.white,marginBottom:20})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:C.gold}}>🤝 Donor Hub</div>
            <div style={{fontSize:13,color:"#aabbd4",marginTop:4}}>Authentic connections between your mission and the people who fund it. Transparent, real, and relationship-first.</div>
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
                <div style={{fontSize:15,fontWeight:700,color:C.navy}}>{d.name}</div>
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
        <div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:6}}>GoForth Network — Coming Soon</div>
        <div style={{fontSize:13,color:C.muted}}>Donors will be able to discover your mission, follow your live impact feed, and connect directly — all on the GoForth platform.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════════════════════════════════════ */
function Settings({profile,setProfile}){
  const [local,setLocal]=useState(profile);
  const [saved,setSaved]=useState(false);

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
      <div style={card()}>
        <div style={{fontWeight:700,fontSize:18,color:C.navy,marginBottom:4}}>Organization Profile</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>This profile powers all daily plans, grant applications, and AI-generated documents.</div>

        <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Organization Identity</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {field("name","Organization Name","text","St. Teresa Center...")}
          {field("apostolate","Primary Apostolate","text","Pope John XXIII House...")}
          {field("ein","EIN / Tax ID","text","81-XXXXXXX")}
          {field("founded","Year Founded","text","2016")}
          {field("director","Director / Executive","text","Fr. Michael Champagne, CJC")}
          {field("diocese","Diocese / Governing Body","text","Diocese of Lafayette")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Contact Information</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {field("address","Street Address")}
          {field("city","City")}
          {field("state","State","text","LA")}
          {field("zip","ZIP Code")}
          {field("phone","Phone")}
          {field("website","Website")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Mission & Programs</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:20}}>
          {field("mission","Mission Statement","textarea","Describe your organization's core mission...")}
          {field("programs","Programs & Apostolates","textarea","List programs, separated by commas...")}
          {field("canonicalStatus","Canonical / Legal Status","textarea","")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Impact Metrics</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
          {field("families","Families Served")}
          {field("volunteers","Active Volunteers")}
          {field("mealsWeekly","Hot Meals / Week")}
          {field("womenServed","Women Housed (Annual)")}
        </div>

        <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:12,paddingBottom:6,borderBottom:`2px solid ${C.gold}`}}>Funding Preferences</div>
        <div style={{display:"flex",gap:20,marginBottom:20,flexWrap:"wrap"}}>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
            <input type="checkbox" checked={local.catholic||false} onChange={e=>setLocal(p=>({...p,catholic:e.target.checked}))} style={{accentColor:C.navy}}/> Faith-based / Catholic organization
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer"}}>
            <input type="checkbox" checked={local.govFunding||false} onChange={e=>setLocal(p=>({...p,govFunding:e.target.checked}))} style={{accentColor:C.navy}}/> Include government funding sources
          </label>
        </div>

        <button style={btn("primary",{padding:"12px 24px",fontSize:14})} onClick={save_}>
          {saved?"✓ Saved!":"Save Profile"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */
export default function GoForth(){
  const [tab,setTab]=useState("dashboard");
  const [profile,setProfile_]=useState(()=>load("goforth_profile",DEF_PROFILE));
  const [funders,setFunders_]=useState(()=>load("goforth_funders",DEF_FUNDERS));
  const [tasks,setTasks_]=useState(()=>load("goforth_tasks",DEF_TASKS));
  const [events,setEvents_]=useState(()=>load("goforth_events",DEF_EVENTS));

  const setProfile=v=>{setProfile_(v);save("goforth_profile",v);};
  const setFunders=fn=>{setFunders_(p=>{const n=typeof fn==="function"?fn(p):fn;save("goforth_funders",n);return n;});};
  const setTasks=fn=>{setTasks_(p=>{const n=typeof fn==="function"?fn(p):fn;save("goforth_tasks",n);return n;});};
  const setEvents=fn=>{setEvents_(p=>{const n=typeof fn==="function"?fn(p):fn;save("goforth_events",n);return n;});};

  const openTasks=tasks.filter(t=>!t.done).length;
  const nextDeadline=[...events].filter(e=>daysUntil(e.date)>=0&&e.type==="deadline").sort((a,b)=>daysUntil(a.date)-daysUntil(b.date))[0];

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter','Segoe UI',Arial,sans-serif",background:C.bg,color:C.text,overflow:"hidden"}}>
      {/* Sidebar */}
      <div style={{width:215,background:C.navy,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"22px 18px 16px",borderBottom:`1px solid ${C.navyXL}`}}>
          <div style={{fontSize:24,fontWeight:900,color:C.gold,letterSpacing:-0.5}}>GoForth</div>
          <div style={{fontSize:10,color:"#7a8faa",marginTop:2,textTransform:"uppercase",letterSpacing:1}}>Development Platform</div>
        </div>
        <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
          {TABS.map(t=>{
            const active=tab===t.id;
            return (
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",cursor:"pointer",
                color:active?C.gold:"#b0c0d8",background:active?C.navyL:"transparent",
                borderLeft:active?`3px solid ${C.gold}`:"3px solid transparent",
                fontSize:13,fontWeight:active?700:400,transition:"all 0.12s"}}
                onClick={()=>setTab(t.id)}>
                <span style={{fontSize:15}}>{t.icon}</span>
                {t.label}
                {t.id==="tasks"&&openTasks>0&&<span style={{marginLeft:"auto",background:C.red,color:C.white,borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{openTasks}</span>}
              </div>
            );
          })}
        </nav>
        <div style={{padding:"14px 18px",borderTop:`1px solid ${C.navyXL}`}}>
          <div style={{fontSize:11,color:"#5a6e8a",lineHeight:1.5}}>
            {profile.name.slice(0,28)}{profile.name.length>28?"...":""}<br/>
            EIN {profile.ein}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Top bar */}
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,flexShrink:0}}>
          <div style={{fontWeight:700,fontSize:15,color:C.navy}}>
            {TABS.find(t=>t.id===tab)?.icon} {TABS.find(t=>t.id===tab)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {nextDeadline&&(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",background:daysUntil(nextDeadline.date)<=7?C.redL:C.amberL,borderRadius:20}}>
                <span style={{fontSize:12,color:daysUntil(nextDeadline.date)<=7?C.red:C.amber}}>⏰</span>
                <span style={{fontSize:12,fontWeight:600,color:daysUntil(nextDeadline.date)<=7?C.red:C.amber}}>
                  {daysUntil(nextDeadline.date)}d · {nextDeadline.title}
                </span>
              </div>
            )}
            <div style={{fontSize:12,color:C.muted}}>{todayFull()}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          {tab==="dashboard"&&<Dashboard profile={profile} funders={funders} tasks={tasks} events={events} setTab={setTab}/>}
          {tab==="daily"&&<DailyPlan profile={profile} funders={funders} events={events}/>}
          {tab==="funders"&&<FundersPipeline funders={funders} setFunders={setFunders} tasks={tasks} setTasks={setTasks}/>}
          {tab==="calendar"&&<CalendarView events={events} setEvents={setEvents}/>}
          {tab==="tasks"&&<TasksView tasks={tasks} setTasks={setTasks} funders={funders}/>}
          {tab==="writing"&&<WritingStudio profile={profile} funders={funders}/>}
          {tab==="portfolio"&&<Portfolio profile={profile}/>}
          {tab==="donors"&&<DonorHub/>}
          {tab==="settings"&&<Settings profile={profile} setProfile={setProfile}/>}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5e0; border-radius: 3px; }
        @keyframes progress { 0%{width:10%} 50%{width:80%} 100%{width:95%} }
        select, input, textarea { background: white; }
        button:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}
