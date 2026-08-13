import { useState, useRef, useCallback, useEffect } from "react";

const sage = "#2B6040", sageLt = "#E2F0E8", sageMid = "#4A8A5E";
const deep = "#0B1A0F", forest = "#193820";
const ink = "#18140E", slate = "#4A5450", muted = "#857C74";
const border = "#DDD5C5", bg = "#F5F2ED", cream = "#F0E7D4";
const openBg = "#D0EDD8", openFg = "#114824";
const soonBg = "#FEF0DA", soonFg = "#854810";
const rollBg = "#EBF1F5", rollFg = "#365268";
const amber = "#A66510";

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;} body{font-family:'DM Sans',sans-serif;background:#F5F2ED;color:#18140E;-webkit-font-smoothing:antialiased;} @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}} .fu{animation:fadeUp .4s ease both} .fi{animation:fadeIn .3s ease both} .d1{animation-delay:.07s}.d2{animation-delay:.15s}.d3{animation-delay:.24s} .app{min-height:100vh;display:flex;flex-direction:column;} .nav{height:54px;background:#0B1A0F;padding:0 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:300;border-bottom:1px solid rgba(255,255,255,.06);} .logo{font-family:'Lora',serif;font-size:17px;font-weight:700;color:#fff;cursor:pointer;} .logo em{color:#6EC282;font-style:normal;} .nav-tabs{display:flex;gap:2px;flex-wrap:wrap;} .ntab{background:transparent;border:none;color:rgba(255,255,255,.5);padding:6px 10px;border-radius:6px;font-size:12.5px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;white-space:nowrap;} .ntab:hover{background:rgba(255,255,255,.08);color:#fff;} .ntab.on{background:rgba(255,255,255,.13);color:#fff;font-weight:500;} .page{max-width:680px;margin:0 auto;padding:24px 18px;width:100%;} .pg-ey{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#2B6040;margin-bottom:6px;} .pg-h1{font-family:'Lora',serif;font-size:clamp(20px,5vw,28px);font-weight:700;margin-bottom:6px;line-height:1.2;letter-spacing:-.2px;} .pg-sub{font-size:14px;color:#4A5450;line-height:1.7;font-weight:300;margin-bottom:20px;} .card{background:#fff;border:1px solid #DDD5C5;border-radius:12px;padding:18px;} .btn{display:inline-flex;align-items:center;gap:5px;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:all .15s;} .btn:disabled{opacity:.36;cursor:not-allowed;} .btn-p{background:#2B6040;color:#fff;} .btn-p:hover:not(:disabled){background:#1D4A2E;} .btn-g{background:transparent;color:#857C74;border:1px solid #DDD5C5;} .btn-g:hover{background:#F0E7D4;color:#18140E;} .btn-o{background:transparent;color:#2B6040;border:1.5px solid #2B6040;} .btn-o:hover{background:#E2F0E8;} .btn-a{background:#A66510;color:#fff;} .btn-a:hover{background:#7E4C08;} .btn-sm{padding:6px 12px;font-size:12.5px;border-radius:6px;} .btn-full{width:100%;justify-content:center;} .badge{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:3px 9px;font-size:11px;font-weight:500;} .b-open{background:#D0EDD8;color:#114824;} .b-soon{background:#FEF0DA;color:#854810;} .b-roll{background:#EBF1F5;color:#365268;} .b-gem{background:#FFF7DF;border:1px solid #FFC830;color:#A84800;} .b-new{background:#D8E8F8;color:#163875;} .cat-pill{display:inline-block;border-radius:4px;padding:2px 7px;font-size:10.5px;font-weight:600;line-height:1.5;} .cat-local{background:#E4F4EA;color:#184E22;}.cat-faith{background:#FFF1E0;color:#7A4000;} .cat-private{background:#EBE5F4;color:#460C88;}.cat-ngo{background:#DFEEF9;color:#0A3A7A;} .cat-government{background:#F0E3F5;color:#5E0E88;}.cat-corporate{background:#DCEEE9;color:#024038;} .cat-microgrant{background:#FFFAE0;color:#CC4800;}.cat-donor{background:#FAE0E8;color:#7A0A36;} .cat-fellowship{background:#E4E6F4;color:#161C78;} .filters{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px;} .fb{background:#fff;border:1.5px solid #DDD5C5;border-radius:20px;padding:5px 12px;font-size:12px;color:#4A5450;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;} .fb:hover{border-color:#4A8A5E;} .fb.on{background:#2B6040;border-color:#2B6040;color:#fff;font-weight:500;} .opp{background:#fff;border:1px solid #DDD5C5;border-radius:12px;padding:16px;margin-bottom:10px;transition:box-shadow .2s,border-color .2s;} .opp:hover{box-shadow:0 2px 14px rgba(0,0,0,.07);} .opp.sv{border-color:#2B6040;} .opp-name{font-family:'Lora',serif;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:2px;line-height:1.3;} .opp-name:hover{color:#2B6040;} .opp-org{font-size:11.5px;color:#857C74;margin-bottom:7px;} .opp-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#857C74;margin-top:7px;} .opp-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;} .opp-tag{background:#F5F2ED;border:1px solid #DDD5C5;border-radius:4px;padding:2px 7px;font-size:11px;color:#4A5450;} .opp-exp{margin-top:14px;padding-top:14px;border-top:1px solid #DDD5C5;} .save-btn{cursor:pointer;padding:5px 10px;border-radius:5px;font-size:12px;border:1px solid #DDD5C5;background:transparent;color:#857C74;transition:all .15s;font-family:'DM Sans',sans-serif;} .save-btn:hover{border-color:#2B6040;color:#2B6040;} .save-btn.on{background:#E2F0E8;border-color:#2B6040;color:#2B6040;font-weight:500;} .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;} .info-box{background:#F5F2ED;border-radius:7px;padding:9px 11px;} .info-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#857C74;margin-bottom:3px;font-weight:600;} .info-val{font-size:13px;line-height:1.4;} .cl-group{margin-bottom:11px;} .cl-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;} .cl-lbl{font-size:10px;letter-spacing:.7px;text-transform:uppercase;color:#857C74;font-weight:600;} .cl-cnt{font-size:10.5px;font-weight:600;} .cl-item{display:flex;align-items:flex-start;gap:9px;padding:7px 0;border-bottom:1px solid #DDD5C5;cursor:pointer;font-size:13.5px;line-height:1.45;} .cl-item:last-child{border-bottom:none;} .cl-box{width:16px;height:16px;border-radius:3px;flex-shrink:0;margin-top:1px;border:2px solid #DDD5C5;display:flex;align-items:center;justify-content:center;font-size:10px;transition:all .15s;} .cl-box.ck{background:#2B6040;border-color:#2B6040;color:#fff;} .cl-txt.ck{text-decoration:line-through;color:#857C74;} .cl-bar{height:3px;background:#DDD5C5;border-radius:2px;margin-top:7px;overflow:hidden;} .cl-fill{height:100%;background:#2B6040;border-radius:2px;transition:width .4s;} .ns-list{display:flex;flex-direction:column;gap:7px;margin-bottom:13px;} .ns-card{background:#fff;border:1px solid #DDD5C5;border-radius:7px;padding:10px 12px;display:flex;gap:9px;font-size:13.5px;line-height:1.45;align-items:flex-start;} .ai-bubble{background:#193820;color:#fff;border-radius:14px 14px 4px 14px;padding:14px 18px;margin-bottom:14px;font-size:14.5px;line-height:1.72;position:relative;} .ai-tag{font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px;} .ai-bubble::after{content:'';position:absolute;bottom:-8px;left:16px;border:8px solid transparent;border-top-color:#193820;border-bottom:none;border-left:none;} .q-card{background:#fff;border:1px solid #DDD5C5;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.05);} .q-step{font-size:11px;color:#857C74;margin-bottom:5px;} .q-text{font-family:'Lora',serif;font-size:17px;font-weight:600;line-height:1.3;margin-bottom:14px;} .q-opts{display:flex;flex-direction:column;gap:6px;} .q-opt{background:#F5F2ED;border:1.5px solid #DDD5C5;border-radius:8px;padding:11px 14px;font-size:14px;color:#18140E;cursor:pointer;font-family:'DM Sans',sans-serif;text-align:left;transition:all .15s;line-height:1.4;} .q-opt:hover{border-color:#4A8A5E;background:#fff;} .q-opt.sel{border-color:#2B6040;background:#E2F0E8;color:#2B6040;font-weight:500;} .q-ta{width:100%;border:1.5px solid #DDD5C5;border-radius:8px;padding:10px 13px;font-size:14px;font-family:'DM Sans',sans-serif;background:#F5F2ED;color:#18140E;outline:none;transition:border .15s;resize:vertical;min-height:68px;} .q-ta:focus{border-color:#2B6040;background:#fff;} .q-inp{width:100%;border:1.5px solid #DDD5C5;border-radius:8px;padding:10px 13px;font-size:14px;font-family:'DM Sans',sans-serif;background:#F5F2ED;color:#18140E;outline:none;transition:border .15s;} .q-inp:focus{border-color:#2B6040;background:#fff;} .prog-bar{height:3px;background:#DDD5C5;border-radius:2px;margin-top:12px;overflow:hidden;} .prog-fill{height:100%;background:#2B6040;border-radius:2px;transition:width .3s;} .sp-lg{width:42px;height:42px;border:3px solid #DDD5C5;border-top-color:#2B6040;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;} .sp-sm{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;display:inline-block;} .skel{background:linear-gradient(90deg,#DDD5C5 25%,#F0E7D4 50%,#DDD5C5 75%);background-size:200%;animation:shim 1.5s infinite;border-radius:6px;} .loading-wrap{display:flex;align-items:center;justify-content:center;min-height:300px;} .loading-box{text-align:center;max-width:400px;width:100%;} .cursor-b{display:inline-block;width:2px;height:13px;background:#2B6040;margin-left:2px;animation:blink 1s step-end infinite;vertical-align:middle;} .ai-banner{background:#0B1A0F;color:#fff;border-radius:10px;padding:13px 16px;margin-bottom:16px;display:flex;align-items:center;gap:11px;} .ai-dot{width:8px;height:8px;border-radius:50%;background:#6EC282;flex-shrink:0;animation:blink 2s ease-in-out infinite;} .rc{font-size:12.5px;color:#857C74;margin-bottom:13px;padding:9px 12px;background:#F0E7D4;border-radius:7px;border:1px solid #DDD5C5;} .rc strong{color:#2B6040;} .sec-div{display:flex;align-items:center;gap:9px;margin:16px 0 12px;} .sec-div-line{height:1px;flex:1;background:#DDD5C5;} .sec-div-txt{font-size:10.5px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;white-space:nowrap;} .err-box{background:#FFF0F0;border:1px solid #FFCDD2;border-radius:10px;padding:16px 18px;margin-bottom:16px;} .err-box p{color:#C62828;font-size:14px;margin-bottom:10px;line-height:1.5;} .tl-mo{font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#857C74;margin-bottom:9px;display:flex;align-items:center;gap:9px;} .tl-mo::after{content:'';flex:1;height:1px;background:#DDD5C5;} .tl-item{display:flex;gap:11px;margin-bottom:9px;} .tl-dot-col{display:flex;flex-direction:column;align-items:center;padding-top:4px;} .tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;} .dot-open{background:#114824;}.dot-soon{background:#854810;}.dot-roll{background:#365268;} .tl-vert{width:1px;background:#DDD5C5;flex:1;margin-top:4px;} .tl-card{flex:1;background:#fff;border:1px solid #DDD5C5;border-radius:10px;padding:12px 14px;cursor:pointer;transition:all .2s;} .tl-card:hover{box-shadow:0 2px 12px rgba(0,0,0,.07);} .tl-card.exp{border-color:#2B6040;} .tl-name{font-family:'Lora',serif;font-size:14px;font-weight:600;margin-bottom:2px;} .tl-org{font-size:11px;color:#857C74;margin-bottom:5px;} .tl-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#857C74;} .days-tag{border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600;} .days-u{background:#FEF0DA;color:#854810;} .days-m{background:#EBF1F5;color:#365268;} .days-g{background:#D0EDD8;color:#114824;} .rbar{width:80px;height:4px;background:#DDD5C5;border-radius:2px;overflow:hidden;} .rbar-fill{height:100%;border-radius:2px;transition:width .4s;} .sec-tabs{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:13px;} .sec-tab{background:#fff;border:1.5px solid #DDD5C5;border-radius:7px;padding:6px 11px;font-size:12.5px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;} .sec-tab:hover{border-color:#4A8A5E;} .sec-tab.on{border-color:#2B6040;background:#E2F0E8;color:#2B6040;font-weight:500;} .sec-tab.done{border-color:#114824;color:#114824;} .writer-area{background:#fff;border:1px solid #DDD5C5;border-radius:12px;padding:16px;min-height:220px;} .writer-ta{width:100%;border:none;outline:none;font-size:14px;line-height:1.85;font-family:'DM Sans',sans-serif;color:#18140E;resize:vertical;min-height:180px;background:transparent;} .writer-ta::placeholder{color:#857C74;} .tips-box{background:#0B1A0F;border-radius:12px;padding:16px;color:#fff;margin-top:14px;} .tips-title{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6EC282;margin-bottom:11px;} .tip{border-bottom:1px solid rgba(255,255,255,.08);padding:8px 0;font-size:12px;} .tip:last-child{border-bottom:none;} .tip-tag{font-size:9px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;margin-bottom:2px;} .tip-i{color:#6EC282;}.tip-w{color:#FFB74D;}.tip-f{color:#CE93D8;}.tip-d{color:#64B5F6;} .tip-title{font-size:12px;color:rgba(255,255,255,.86);font-weight:500;margin-bottom:2px;} .tip-body{font-size:11.5px;color:rgba(255,255,255,.55);line-height:1.6;} .setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;} .setup-full{grid-column:1/-1;} .form-field{display:flex;flex-direction:column;gap:4px;} .form-lbl{font-size:11.5px;font-weight:600;color:#857C74;} .form-inp{border:1.5px solid #DDD5C5;border-radius:7px;padding:9px 11px;font-size:14px;font-family:'DM Sans',sans-serif;background:#F5F2ED;color:#18140E;outline:none;transition:border .15s;} .form-inp:focus{border-color:#2B6040;background:#fff;} .form-ta{border:1.5px solid #DDD5C5;border-radius:7px;padding:9px 11px;font-size:14px;font-family:'DM Sans',sans-serif;background:#F5F2ED;color:#18140E;outline:none;transition:border .15s;resize:vertical;min-height:70px;} .form-ta:focus{border-color:#2B6040;background:#fff;} .draft-box{background:#F0E7D4;border:1px solid #DDD5C5;border-radius:10px;padding:14px;margin-top:14px;max-height:280px;overflow-y:auto;font-size:13px;line-height:1.8;white-space:pre-wrap;font-family:Georgia,serif;} .toast{position:fixed;bottom:20px;right:16px;z-index:999;background:#193820;color:#fff;border-radius:10px;padding:12px 18px;font-size:13.5px;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:fadeUp .3s ease both;max-width:300px;line-height:1.5;} .toast strong{display:block;font-weight:600;margin-bottom:2px;} .ind-banner{background:linear-gradient(135deg,#F0E7D4,#FFF6EA);border:1px solid #DDD0B8;border-radius:11px;padding:14px 17px;margin-bottom:15px;} .ind-banner h3{font-family:'Lora',serif;font-size:14px;color:#A66510;margin-bottom:5px;} .pchips{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;} .pchip{background:#fff;border:1px solid #DDD0B8;border-radius:20px;padding:4px 11px;font-size:12px;color:#4A5450;} .prof-card{background:#F0E7D4;border:1px solid #DDD5C5;border-radius:9px;padding:12px 15px;margin-bottom:14px;} .prof-card h4{font-size:11px;color:#2B6040;font-weight:700;margin-bottom:7px;letter-spacing:.5px;text-transform:uppercase;} .prof-tag{display:inline-block;background:#fff;border:1px solid #DDD5C5;border-radius:4px;padding:2px 7px;font-size:12px;color:#4A5450;margin:2px;} .empty{text-align:center;padding:48px 20px;color:#857C74;} .empty-icon{font-size:40px;margin-bottom:11px;} .empty-h{font-family:'Lora',serif;font-size:18px;color:#4A5450;margin-bottom:7px;} .hero{background:#0B1A0F;padding:54px 20px 46px;position:relative;overflow:hidden;} .hero::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 10% 55%,rgba(43,96,64,.28) 0%,transparent 68%),radial-gradient(ellipse 40% 35% at 85% 15%,rgba(166,101,16,.1) 0%,transparent 62%);} .hero-in{max-width:660px;margin:0 auto;position:relative;} .hero-ey{display:inline-flex;align-items:center;gap:7px;background:rgba(43,96,64,.22);border:1px solid rgba(110,194,130,.24);border-radius:20px;padding:4px 13px;font-size:11px;font-weight:600;color:#A4D8AF;letter-spacing:.7px;text-transform:uppercase;margin-bottom:20px;} .hero-dot{width:6px;height:6px;border-radius:50%;background:#6EC282;animation:blink 2s ease-in-out infinite;} .hero-h1{font-family:'Lora',serif;font-size:clamp(26px,6vw,46px);font-weight:700;line-height:1.15;color:#fff;margin-bottom:14px;letter-spacing:-.3px;} .hero-h1 em{font-style:italic;color:#6EC282;} .hero-sub{font-size:clamp(14px,3.5vw,16px);line-height:1.74;color:rgba(255,255,255,.62);max-width:500px;margin-bottom:26px;font-weight:300;} .hero-sub strong{color:rgba(255,255,255,.86);font-weight:500;} .hero-btns{display:flex;gap:10px;flex-wrap:wrap;} .hbp{background:#2B6040;color:#fff;border:none;border-radius:8px;padding:13px 26px;font-size:15px;font-family:'DM Sans',sans-serif;cursor:pointer;font-weight:500;transition:background .15s;} .hbp:hover{background:#1D4A2E;} .hbg{background:rgba(255,255,255,.09);color:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:13px 22px;font-size:15px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;} .hbg:hover{background:rgba(255,255,255,.15);color:#fff;} .feat-list{display:flex;flex-direction:column;gap:12px;margin:28px 0;} .feat-item{display:flex;gap:14px;align-items:flex-start;background:#fff;border:1px solid #DDD5C5;border-radius:12px;padding:16px;} .feat-icon{font-size:26px;flex-shrink:0;margin-top:2px;} .feat-title{font-family:'Lora',serif;font-size:15px;font-weight:600;margin-bottom:4px;} .feat-body{font-size:13px;color:#4A5450;line-height:1.62;} .eth-box{background:#0B1A0F;border-radius:12px;padding:22px 20px;margin-top:28px;} .eth-title{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6EC282;margin-bottom:10px;} .eth-item{font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;display:flex;gap:8px;margin-bottom:8px;} .eth-item::before{content:'→';color:#6EC282;flex-shrink:0;margin-top:1px;} @media(max-width:600px){.info-grid{grid-template-columns:1fr;}.setup-grid{grid-template-columns:1fr;}.setup-full{grid-column:auto;}.page{padding:16px 14px;}}`;

const QS = [
  {id:"cause",type:"text",text:"What cause or community does your work serve?",placeholder:"e.g. rural families without food access, women leaving incarceration, homebound elderly, disaster recovery, faith community programs…"},
  {id:"location",type:"text",text:"What city and state is your work based in?",placeholder:"e.g. Saint Martinville, Louisiana  or  rural Appalachian Kentucky  or  Pine Ridge, South Dakota\n\nBe specific — the more detail you give, the better the local results."},
  {id:"structure",type:"opt",text:"How would you describe your situation?",opts:["I'm an individual — no formal org","We're an informal group or collective","We're a volunteer-run organization","We're a small nonprofit (501c3)","We're a faith community or church","Not sure yet"]},
  {id:"stage",type:"opt",text:"How far along is your work?",opts:["Just an idea — nothing started yet","We've started planning or piloting","We're active and need more support","We've been running a while and need sustainability"]},
  {id:"amount",type:"opt",text:"What size of funding would help most right now?",opts:["Small start ($500–$5,000)","Growing ($5,000–$25,000)","Bigger ($25,000–$100,000)","Not sure — show me what's available"]},
];

const WSECS = [
  {id:"cover",label:"Cover Letter",icon:"✉️"},
  {id:"need",label:"Statement of Need",icon:"🔍"},
  {id:"description",label:"Project Description",icon:"⚙️"},
  {id:"objectives",label:"Goals & Objectives",icon:"🎯"},
  {id:"evaluation",label:"Evaluation Plan",icon:"📊"},
  {id:"capacity",label:"Org. Capacity",icon:"🏗️"},
  {id:"budget",label:"Budget Narrative",icon:"💰"},
  {id:"sustainability",label:"Sustainability",icon:"🌱"},
];

const TIPS = {
  cover:[{t:"i",title:"Find the name",body:"Call the funder and ask for the program officer's name. Using their name separates you from most applications."},{t:"i",title:"Four paragraphs, one page",body:"Para 1: what you need and why it fits them. Para 2: your best proof point. Para 3: who you serve. Para 4: the exact ask — '$X to do Y for Z people in [place].'"},{t:"w",title:"Don't start with your org",body:"Start with the problem or the person. 'Every week in Saint Martinville…' beats 'Our organization was founded in…'"},{t:"d",title:"Done when…",body:"Someone who has never heard of you reads only the cover letter and knows exactly what you need and why it matters."}],
  need:[{t:"i",title:"Open with a person",body:"One real story from your community is worth three national statistics. Start there."},{t:"w",title:"The So What test",body:"After every fact, ask: what does this mean for a real person in this community?"},{t:"i",title:"Local data wins",body:"One local number beats three national ones. If you don't have it, use state data plus a local story."},{t:"d",title:"Done when…",body:"A stranger reads it and says 'Yes, this problem clearly needs to be solved — right there.'"}],
  description:[{t:"i",title:"Describe what you actually do",body:"Walk someone through a real day of your work. What happens? Who shows up? What changes?"},{t:"i",title:"Your theory of change",body:"'If we do X, then Y will happen, because Z is true about this community.' Write that sentence. Build around it."},{t:"w",title:"Plain language only",body:"If someone who has never heard of your issue can't understand it, rewrite it."},{t:"d",title:"Done when…",body:"Someone could explain it to a friend in two sentences."}],
  objectives:[{t:"i",title:"SMART objectives",body:"Each one needs: who, what change, by when, measured how. 'We will serve 20 families by December 2026 measured by intake records.'"},{t:"w",title:"Never 'raise awareness'",body:"Name the real change — behavior, access, skill, connection. Those are outcomes. Awareness is not."},{t:"d",title:"Done when…",body:"You can picture the exact data you'd collect to prove each objective was met."}],
  evaluation:[{t:"i",title:"Two kinds of data",body:"Process: did you do what you said? Outcome: did it matter to the people you served?"},{t:"i",title:"Simple is fine",body:"Sign-in sheets, before/after surveys, case notes, short interviews. Small orgs don't need a research study."},{t:"d",title:"Done when…",body:"You can picture the actual folder or spreadsheet where this data lives."}],
  capacity:[{t:"i",title:"Prove you can be trusted",body:"Three specific things you've done before beat ten vague claims. Use real numbers and dates."},{t:"w",title:"If you're new",body:"Name your people: what has each person personally done before? A strong team substitutes for track record."},{t:"d",title:"Done when…",body:"A skeptic reads it and thinks: OK, these people can actually do this."}],
  budget:[{t:"i",title:"Every line needs a reason",body:"'Program coordinator: $18,000 (half-time at $36,000 local market rate)' — not just 'staff.'"},{t:"i",title:"Cost per person",body:"Serving 40 people for $8,000 is $200 per person. Say it. Funders love this math."},{t:"w",title:"Include what you give for free",body:"Space, volunteer hours, donated supplies — list as 'in-kind.' Shows community investment."},{t:"d",title:"Done when…",body:"Anyone could reconstruct exactly how you'd spend the money from the narrative alone."}],
  sustainability:[{t:"w",title:"Don't promise independence in year 2",body:"Funders know that's rarely true for small rural orgs. Honest planning is more credible."},{t:"i",title:"Name two other funders",body:"List who else you plan to approach. You don't need to have talked to them yet."},{t:"d",title:"Done when…",body:"The funder doesn't feel like the only thing keeping this work alive after the grant ends."}],
};

const CATS=[
  {id:"all",label:"All Sources"},
  {id:"local",label:"📍 Local"},
  {id:"government",label:"🏛 Federal / Gov't"},
  {id:"faith",label:"✝️ Faith-Based"},
  {id:"private",label:"🏛️ Private Foundation"},
  {id:"ngo",label:"🌐 NGO"},
  {id:"corporate",label:"💼 Corporate"},
  {id:"microgrant",label:"⚡ Microgrant"},
  {id:"donor",label:"🤝 Donors"},
  {id:"fellowship",label:"🎓 Fellowship"},
];

const MMAP={January:0,February:1,March:2,April:3,May:4,June:5,July:6,August:7,September:8,October:9,November:10,December:11};
function parseDeadline(dl){
  if(!dl) return null;
  const l=dl.toLowerCase();
  if(["rolling","ongoing","quarterly","monthly","weekly","varies","annual","open","cycle"].some(w=>l.includes(w))) return null;
  for(const [m,idx] of Object.entries(MMAP)){
    if(dl.includes(m)){
      const yr=(dl.match(/\d{4}/)||["2026"])[0];
      const d=((dl.match(/\b(\d{1,2})[,\s]/)||[null,"15"])[1]);
      return new Date(parseInt(yr),idx,parseInt(d));
    }
  }
  return null;
}
function daysLeft(dl){const d=parseDeadline(dl);if(!d) return null;return Math.round((d-new Date())/86400000);}
function downloadICS(g){
  const dl=parseDeadline(g.deadline);
  if(!dl){alert("This opportunity has a rolling deadline — no specific date to add to your calendar.");return;}
  const p=n=>String(n).padStart(2,"0");
  const fmt=d=>`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`;
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GrantCompass//EN","BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${fmt(dl)}`,`DTEND;VALUE=DATE:${fmt(dl)}`,
    `SUMMARY:Grant Deadline: ${g.name}`,`DESCRIPTION:Funder: ${g.org}\\nAmount: ${g.amount}`,
    "BEGIN:VALARM","TRIGGER:-P14D","ACTION:DISPLAY",`DESCRIPTION:2-week reminder: ${g.name}`,
    "END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));
  Object.assign(document.createElement("a"),{href:url,download:"grant-deadline.ics"}).click();
  URL.revokeObjectURL(url);
}

async function callAI(system, user, maxTokens){
  const res = await fetch("/api/write", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  const data = await res.json();
  return data.text || "";
}

/* JSON extraction: 5 strategies */
function extractArray(text){
  if(!text||!text.trim()) return null;
  try{const r=JSON.parse(text.trim());if(Array.isArray(r)&&r.length) return r;}catch{}
  const fc=text.match(/`(?:json)?\s*([\s\S]*?)`/s);
  if(fc){try{const r=JSON.parse(fc[1].trim());if(Array.isArray(r)&&r.length) return r;}catch{}}
  const a=text.indexOf("["),b=text.lastIndexOf("]");
  if(a!==-1&&b>a){try{const r=JSON.parse(text.slice(a,b+1));if(Array.isArray(r)&&r.length) return r;}catch{}}
  const objs=[];let depth=0,inStr=false,esc=false,start=-1;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(esc){esc=false;continue;}
    if(c==="\\"&&inStr){esc=true;continue;}
    if(c==='"') inStr=!inStr;
    if(!inStr){
      if(c==="{"){if(!depth) start=i;depth++;}
      else if(c==="}"){depth--;if(!depth&&start!==-1){try{objs.push(JSON.parse(text.slice(start,i+1)));}catch{}start=-1;}}
    }
  }
  if(objs.length) return objs;
  if(a!==-1&&b>a){
    try{
      const cleaned=text.slice(a,b+1).replace(/,\s*([}\]])/g,"$1");
      const r=JSON.parse(cleaned);
      if(Array.isArray(r)&&r.length) return r;
    }catch{}
  }
  return null;
}

function sanitize(g,i){
  const VALID_CATS=["local","faith","private","ngo","government","corporate","microgrant","donor","fellowship"];
  const cat=VALID_CATS.includes(g.cat)?g.cat:"private";
  const status=["open","soon","rolling"].includes(g.status)?g.status:"rolling";
  const badge={open:"b-open",soon:"b-soon",rolling:"b-roll"}[status];
  const badgeText={open:"🟢 Open now",soon:"🟡 Opens soon",rolling:"⚪ Rolling"}[status];
  const arr=v=>Array.isArray(v)&&v.length?v:null;
  return{
    id:String(g.id||`g${i}`),
    name:String(g.name||"Funding Opportunity"),
    org:String(g.org||""),
    cat,local:!!g.local,status,badge,badgeText,
    tags:arr(g.tags)||["Funding opportunity"],
    amount:String(g.amount||"Varies"),
    deadline:String(g.deadline||"Rolling"),
    window:String(g.window||"Varies"),
    seekingNew:!!g.seekingNew,gem:!!g.gem,
    desc:String(g.desc||"Contact this funder to learn more about fit and eligibility."),
    competitive:String(g.competitive||"Varies"),
    firstTimers:String(g.firstTimers||"Contact funder directly"),
    eligibility:arr(g.eligibility)||["Confirm eligibility with funder directly"],
    documents:arr(g.documents)||["Application form","Project description","Budget"],
    prep:arr(g.prep)||["Visit the funder website","Contact program staff before applying"],
    stalls:arr(g.stalls)||["Incomplete application","Missed deadline"],
    nextSteps:arr(g.nextSteps)||[{icon:"🔍",text:"Visit the funder's website"},{icon:"📞",text:"Call or email program staff"}],
  };
}

async function searchGrants(answers){

  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  const data = await res.json();
  const grants = (data.grants || []).map((g, i) => sanitize(g, i));
  return { grants, errors: [] };
}

function CheckGroup({items,label,checked,onToggle,prefix}){
  if(!items?.length) return null;
  const done=items.filter((_,i)=>checked.has(`${prefix}-${i}`)).length;
  return(
    <div className="cl-group">
      <div className="cl-hdr">
        <span className="cl-lbl">{label}</span>
        <span className="cl-cnt" style={{color:done===items.length?openFg:muted}}>{done}/{items.length}</span>
      </div>
      {items.map((item,i)=>{
        const k=`${prefix}-${i}`,ck=checked.has(k);
        return(
          <div className="cl-item" key={k} onClick={()=>onToggle(k)}>
            <div className={`cl-box${ck?" ck":""}`}>{ck?"✓":""}</div>
            <span className={`cl-txt${ck?" ck":""}`}>{item}</span>
          </div>
        );
      })}
      <div className="cl-bar"><div className="cl-fill" style={{width:`${(done/items.length)*100}%`}}/></div>
    </div>
  );
}

function OppCard({g,checked,onToggle,isSaved,onSave}){
  const [open,setOpen]=useState(false);
  const prfxs=["el","do","pr","st"];
  const szs=[(g.eligibility||[]).length,(g.documents||[]).length,(g.prep||[]).length,(g.stalls||[]).length];
  const total=szs.reduce((a,b)=>a+b,0);
  let done=0;
  szs.forEach((sz,pi)=>{for(let i=0;i<sz;i++) if(checked.has(`${g.id}-${prfxs[pi]}-${i}`)) done++;});
  const pct=total>0?Math.round((done/total)*100):0;
  const catLabel=CATS.find(c=>c.id===g.cat)?.label||g.cat;
  return(
    <div className={`opp${isSaved?" sv":""}`}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
        <span className={`cat-pill cat-${g.cat}`}>{catLabel}</span>
        {g.gem&&<span className="badge b-gem">💎 Hidden gem</span>}
        {g.local&&<span className="badge" style={{background:"#E4F4EA",color:"#184E22",fontSize:11}}>📍 Local</span>}
        {g.seekingNew&&<span className="badge b-new">⭐ Seeking applicants</span>}
        {pct>0&&<span className="badge" style={{background:openBg,color:openFg}}>{pct}% ready</span>}
      </div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
        <div style={{flex:1}}>
          <div className="opp-name" onClick={()=>setOpen(o=>!o)}>{open?"▾ ":"▸ "}{g.name}</div>
          <div className="opp-org">{g.org}</div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"flex-start",flexWrap:"wrap"}}>
          <span className={`badge ${g.badge}`}>{g.badgeText}</span>
          <button className={`save-btn${isSaved?" on":""}`} onClick={onSave}>{isSaved?"✓ Saved":"+ Save"}</button>
        </div>
      </div>
      <div className="opp-tags">{(g.tags||[]).slice(0,4).map(t=><span className="opp-tag" key={t}>{t}</span>)}</div>
      <div className="opp-meta"><span>💰 {g.amount}</span><span>📅 {g.deadline}</span><span>🔄 {g.window}</span></div>
      {open&&(
        <div className="opp-exp fi">
          <p style={{fontSize:14,lineHeight:1.7,color:"#4A5450",marginBottom:13}}>{g.desc}</p>
          <div className="info-grid">
            {[["How competitive",g.competitive],["First-time applicants",g.firstTimers],["Deadline",g.deadline],["Cycle",g.window]].map(([k,v])=>v&&(
              <div className="info-box" key={k}><div className="info-lbl">{k}</div><div className="info-val">{v}</div></div>
            ))}
          </div>
          <CheckGroup items={g.eligibility} label="Eligibility to Confirm" checked={checked} onToggle={onToggle} prefix={`${g.id}-el`}/>
          <CheckGroup items={g.documents} label="Documents You'll Need" checked={checked} onToggle={onToggle} prefix={`${g.id}-do`}/>
          <CheckGroup items={g.prep} label="Preparation Steps" checked={checked} onToggle={onToggle} prefix={`${g.id}-pr`}/>
          <CheckGroup items={g.stalls} label="Common Reasons Applications Stall" checked={checked} onToggle={onToggle} prefix={`${g.id}-st`}/>
          {(g.nextSteps||[]).length>0&&(
            <div style={{marginBottom:13}}>
              <div style={{fontFamily:"'Lora',serif",fontSize:14,fontWeight:600,marginBottom:9}}>🧭 Your Best Next Steps</div>
              <div className="ns-list">
                {g.nextSteps.map((s,i)=><div className="ns-card" key={i}><span style={{fontSize:18,flexShrink:0}}>{s.icon}</span><span>{s.text}</span></div>)}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="btn btn-p btn-sm" onClick={()=>downloadICS(g)}>📅 Add Deadline to Calendar</button>
            <button className={`save-btn${isSaved?" on":""}`} style={{padding:"6px 12px"}} onClick={onSave}>{isSaved?"✓ Saved":"+ Save to Planner"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function IntakeView({onComplete}){
  const [idx,setIdx]=useState(0);
  const [answers,setAnswers]=useState({});
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);
  const q=QS[idx];
  const isLast=idx===QS.length-1;
  const canGo=q.type==="opt"?!!answers[q.id]:!!(text.trim());
  const next=()=>{
    const val=q.type==="opt"?answers[q.id]:text.trim();
    if(!val) return;
    const a={...answers,[q.id]:val};
    setAnswers(a);
    if(isLast){setLoading(true);setTimeout(()=>onComplete(a),1000);}
    else{setIdx(i=>i+1);setText("");}
  };
  const msgs=[
    "Welcome. You don't need to know the funding system — I'll navigate it for you. Tell me about your work and I'll find what's available.",
    "Your location unlocks local funders that most people never discover. The more specific you are — city, parish, county — the better your local results.",
    "This helps me narrow down what's actually available to you.",
    "Almost there.",
    "Last question — then I'll search federal, state, local, and private sources all at once.",
  ];
  const handleKeyDown=e=>{if(e.key==="Enter"&&!e.shiftKey&&canGo){e.preventDefault();next();}};
  if(loading) return(
    <div className="page loading-wrap fu">
      <div className="loading-box">
        <div className="sp-lg"/>
        <p style={{fontFamily:"'Lora',serif",fontSize:19,marginBottom:10}}>Searching funding sources…</p>
        <p style={{fontSize:14,color:muted,lineHeight:1.65,marginBottom:20}}>Checking federal grants, state programs, local foundations, faith-based funders, and hidden sources — all at once, personalized to you.</p>
        {[1,2,3].map(i=>(
          <div key={i} style={{background:"#fff",border:`1px solid ${border}`,borderRadius:10,padding:16,marginBottom:10}}>
            <div className="skel" style={{height:13,width:"65%",marginBottom:10}}/>
            <div className="skel" style={{height:10,width:"45%",marginBottom:8}}/>
            <div className="skel" style={{height:10,width:"80%"}}/>
          </div>
        ))}
      </div>
    </div>
  );
  return(
    <div className="page fu">
      <div className="pg-ey">Getting Started</div>
      <h1 className="pg-h1">Let's find your funding.</h1>
      <p className="pg-sub">Answer {QS.length} short questions. I'll search federal, state, local, and private sources — and surface things most people never find.</p>
      <div className="ai-bubble">
        <div className="ai-tag">GrantCompass</div>
        {msgs[Math.min(idx,msgs.length-1)]}
      </div>
      <div className="q-card">
        <div className="q-step">Question {idx+1} of {QS.length}</div>
        <div className="q-text">{q.text}</div>
        {q.type==="opt"&&(
          <div className="q-opts">
            {q.opts.map(o=><button key={o} className={`q-opt${answers[q.id]===o?" sel":""}`} onClick={()=>setAnswers(p=>({...p,[q.id]:o}))}>{o}</button>)}
          </div>
        )}
        {q.type==="text"&&<textarea className="q-ta" placeholder={q.placeholder} value={text} onChange={e=>setText(e.target.value)} onKeyDown={handleKeyDown}/>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16}}>
          {idx>0?<button className="btn btn-g btn-sm" onClick={()=>{setIdx(i=>i-1);setText("");}}>← Back</button>:<span/>}
          <button className="btn btn-p" onClick={next} disabled={!canGo}>{isLast?"Search All Funding Sources →":"Continue →"}</button>
        </div>
      </div>
      <div className="prog-bar"><div className="prog-fill" style={{width:`${(idx/QS.length)*100}%`}}/></div>
    </div>
  );
}


// ── RefinePanel — tweak search without going back to intake ──

function RefinePanel({answers, onRefine, searchesLeft, disabled}){
  const [open, setOpen] = useState(false);
  const [cause, setCause] = useState(answers.cause || "");
  const [location, setLocation] = useState(answers.location || "");
  const [note, setNote] = useState("");
  const submit = () => {
    if(!cause.trim() && !location.trim() && !note.trim()) return;
    onRefine({
      ...answers,
      ...(cause.trim() ? {cause: cause.trim()} : {}),
      ...(location.trim() ? {location: location.trim()} : {}),
      ...(note.trim() ? {cause: `${cause.trim() || answers.cause}. Additional context: ${note.trim()}`} : {}),
    });
    setOpen(false);
    setNote("");
  };
  if(!open) return(
    <button
      className="btn btn-g btn-sm"
      style={{marginBottom:12,fontSize:12}}
      onClick={()=>setOpen(true)}
      disabled={disabled || searchesLeft === 0}
    >
      🔧 Refine search {searchesLeft > 0 ? `(${searchesLeft} of 3 left)` : "(limit reached)"}
    </button>
  );
  return(
    <div style={{background:"#F0E7D4",border:"1px solid #DDD5C5",borderRadius:10,padding:"14px 16px",marginBottom:14}} className="fi">
      <div style={{fontSize:12,fontWeight:700,letterSpacing:".6px",textTransform:"uppercase",color:"#2B6040",marginBottom:10}}>Refine Your Search</div>
      <p style={{fontSize:13,color:muted,marginBottom:10,lineHeight:1.5}}>
        Adjust any field and run a new search. Uses one of your {searchesLeft} remaining searches this hour.
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
        <input style={{flex:1,minWidth:160,border:"1.5px solid #DDD5C5",borderRadius:7,padding:"8px 11px",fontSize:13.5,fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#18140E",outline:"none"}} placeholder="Cause / community" value={cause} onChange={e=>setCause(e.target.value)}/>
        <input style={{flex:1,minWidth:140,border:"1.5px solid #DDD5C5",borderRadius:7,padding:"8px 11px",fontSize:13.5,fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#18140E",outline:"none"}} placeholder="City, state" value={location} onChange={e=>setLocation(e.target.value)}/>
      </div>
      <input style={{width:"100%",border:"1.5px solid #DDD5C5",borderRadius:7,padding:"8px 11px",fontSize:13.5,fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#18140E",outline:"none",marginBottom:10,boxSizing:"border-box"}}
        placeholder="Anything to add? e.g. 'focus on Catholic charities' or 'we also serve veterans'"
        value={note} onChange={e=>setNote(e.target.value)}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <button className="btn btn-p btn-sm" onClick={submit} disabled={disabled || searchesLeft === 0}>Search Again →</button>
        <button className="btn btn-g btn-sm" onClick={()=>setOpen(false)}>Cancel</button>
        {searchesLeft === 0 && <span style={{fontSize:12,color:amber}}>No searches remaining this hour.</span>}
      </div>
    </div>
  );
}

function DiscoverView({answers,onAnswersChange,checked,onToggle,saved,onSave,onLoaded}){
  const [grants,setGrants]=useState([]);
  const [errs,setErrs]=useState([]);
  const [status,setStatus]=useState("loading");
  const [catFilter,setCatFilter]=useState("all");
  const [msgIdx,setMsgIdx]=useState(0);
  const [searchesLeft,setSearchesLeft]=useState(3);
  const fetched=useRef(false);
  const msgTimer=useRef(null);
  const MSGS=[
    `Searching local sources near ${answers.location||"your area"}…`,
    "Checking federal programs on Grants.gov…",
    "Finding private and faith-based funders…",
    "Surfacing hidden gems most people never find…",
    "Compiling your results…",
  ];
  const doSearch=(ans)=>{
    setStatus("loading");setGrants([]);setErrs([]);setMsgIdx(0);
    msgTimer.current=setInterval(()=>setMsgIdx(n=>Math.min(n+1,MSGS.length-1)),2000);
    searchGrants(ans||answers)
      .then(({grants:g,errors:e})=>{
        clearInterval(msgTimer.current);
        setGrants(g);setErrs(e);onLoaded(g);setStatus("done");
        setSearchesLeft(n=>Math.max(0,n-1));
      })
      .catch(e=>{
        clearInterval(msgTimer.current);
        const msg=e.message||"Unknown error";
        if(msg.includes("hour")||msg.includes("limit")) setSearchesLeft(0);
        setErrs([msg]);setStatus("error");
      });
  };
  const handleRefine=(newAnswers)=>{
    onAnswersChange(newAnswers);
    doSearch(newAnswers);
  };
  useEffect(()=>{
    if(fetched.current) return;
    fetched.current=true;
    doSearch(answers);
    return()=>clearInterval(msgTimer.current);
  },[]);
  const isIndiv=(answers.structure||"").toLowerCase().match(/individual|informal|sure/);
  const filtered=grants.filter(g=>catFilter==="all"||g.cat===catFilter||(catFilter==="local"&&g.local));
  const localG=filtered.filter(g=>g.local);
  const otherG=filtered.filter(g=>!g.local);
  if(status==="loading") return(
    <div className="page loading-wrap fu">
      <div className="loading-box">
        <div className="sp-lg"/>
        <p style={{fontFamily:"'Lora',serif",fontSize:19,marginBottom:10,lineHeight:1.3}}>{MSGS[msgIdx]}</p>
        <p style={{fontSize:14,color:muted,lineHeight:1.65,marginBottom:20}}>Searching {answers.location?`near ${answers.location}, `:""}plus federal programs, private foundations, faith funders, and hidden gems — all personalized to your work.</p>
        {[1,2,3].map(i=>(
          <div key={i} style={{background:"#fff",border:`1px solid ${border}`,borderRadius:10,padding:16,marginBottom:10}}>
            <div className="skel" style={{height:13,width:"65%",marginBottom:10}}/>
            <div className="skel" style={{height:10,width:"45%",marginBottom:8}}/>
            <div className="skel" style={{height:10,width:"80%"}}/>
          </div>
        ))}
      </div>
    </div>
  );
  if(status==="error") return(
    <div className="page fu">
      <div className="pg-ey">Funding Discovery</div>
      <h1 className="pg-h1">Search failed</h1>
      <div className="err-box">
        <p>{errs[0]||"Something went wrong. This is usually temporary."}</p>
        {searchesLeft > 0
          ? <button className="btn btn-p" onClick={()=>doSearch(answers)}>Try Again →</button>
          : <p style={{fontSize:13,color:"#A66510",marginTop:6}}>You've used all 3 searches for this hour. Try again later, or refine your search below.</p>
        }
      </div>
      <RefinePanel answers={answers} onRefine={handleRefine} searchesLeft={searchesLeft} disabled={status==="loading"}/>
    </div>
  );
  return(
    <div className="page fu">
      <div className="pg-ey">Funding Discovery</div>
      <h1 className="pg-h1">Your Funding Results</h1>
      <p className="pg-sub">Searched federal, state, local, private, faith-based, and hidden sources — matched to your work and location.</p>
      {errs.length>0&&(
        <div style={{background:"#FEF9E0",border:"1px solid #FFD54F",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#7A5500",lineHeight:1.6}}>
          ⚠️ Partial results — some searches had issues: {errs.join(" | ")}
        </div>
      )}
      <div className="ai-banner">
        <span className="ai-dot"/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>AI-powered results for your profile</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)"}}>
            {grants.length} opportunities · {grants.filter(g=>g.local).length} local to {answers.location||"your area"} · {grants.filter(g=>g.gem).length} hidden gems
          </div>
        </div>
        <span style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{searchesLeft} of 3 searches left today</span>
      </div>
      <RefinePanel answers={answers} onRefine={handleRefine} searchesLeft={searchesLeft} disabled={status==="loading"}/>
      <div className="filters">
        {CATS.map(c=><button key={c.id} className={`fb${catFilter===c.id?" on":""}`} onClick={()=>setCatFilter(c.id)}>{c.label}</button>)}
      </div>
      <div className="rc">
        Showing <strong>{filtered.length}</strong> of {grants.length} results
        {catFilter!=="all"&&<> · {CATS.find(c=>c.id===catFilter)?.label} <button className="btn btn-g btn-sm" style={{marginLeft:8,fontSize:11.5}} onClick={()=>setCatFilter("all")}>Clear</button></>}
      </div>
      {isIndiv&&catFilter==="all"&&(
        <div className="ind-banner">
          <h3>You Don't Have to Be a Nonprofit</h3>
          <p style={{fontSize:13.5,color:"#4A5450",lineHeight:1.6,marginBottom:8}}>Many sources below work for individuals and informal groups. Structure should serve your mission — not block it.</p>
          <div className="pchips">
            {["Apply as an individual","Get a fiscal sponsor","Partner with an org","Start with a microgrant","Enter a fellowship"].map(c=><span className="pchip" key={c}>{c}</span>)}
          </div>
        </div>
      )}
      {Object.keys(answers).length>1&&(
        <div className="prof-card">
          <h4>Your Profile</h4>
          <div>{Object.values(answers).filter(Boolean).map((v,i)=><span className="prof-tag" key={i}>{v}</span>)}</div>
        </div>
      )}
      {localG.length>0&&(
        <>
          <div className="sec-div"><div className="sec-div-line"/><span className="sec-div-txt" style={{color:"#184E22"}}>📍 Local & Regional — {answers.location}</span><div className="sec-div-line"/></div>
          {localG.map(g=><OppCard key={g.id} g={g} checked={checked} onToggle={onToggle} isSaved={saved.has(g.id)} onSave={()=>onSave(g.id)}/>)}
        </>
      )}
      {otherG.length>0&&(
        <>
          <div className="sec-div"><div className="sec-div-line"/><span className="sec-div-txt" style={{color:muted}}>🌐 National, Federal & Broad Access</span><div className="sec-div-line"/></div>
          {otherG.map(g=><OppCard key={g.id} g={g} checked={checked} onToggle={onToggle} isSaved={saved.has(g.id)} onSave={()=>onSave(g.id)}/>)}
        </>
      )}
      {filtered.length===0&&(
        <div className="empty"><div className="empty-icon">🔍</div><div className="empty-h">No results for this filter</div>
          <button className="btn btn-p btn-sm" style={{marginTop:12}} onClick={()=>setCatFilter("all")}>Show All Results</button>
        </div>
      )}
      <div style={{background:deep,borderRadius:10,padding:"12px 16px",fontSize:12,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginTop:14}}>
        <strong style={{color:"rgba(255,255,255,.65)"}}>Transparently: </strong>Results are AI-generated from knowledge of real funders. Always verify deadlines, eligibility, and details directly with each funder before applying. Information changes. We provide navigation, not guarantees.
      </div>
    </div>
  );
}

function PlannerView({saved,onSave,checked,onToggle,allGrants}){
  const [expanded,setExpanded]=useState(null);
  const savedG=allGrants.filter(g=>saved.has(g.id));
  const withDl=savedG.filter(g=>parseDeadline(g.deadline));
  const rolling=savedG.filter(g=>!parseDeadline(g.deadline));
  const byMonth={};
  withDl.forEach(g=>{
    const d=parseDeadline(g.deadline);
    const key=`${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
    if(!byMonth[key]) byMonth[key]={date:d,grants:[]};
    byMonth[key].grants.push(g);
  });
  const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const prfxs=["el","do","pr","st"];
  const szFn=g=>[(g.eligibility||[]).length,(g.documents||[]).length,(g.prep||[]).length,(g.stalls||[]).length];
  const countDone=g=>{let n=0;prfxs.forEach((p,pi)=>{for(let i=0;i<szFn(g)[pi];i++) if(checked.has(`${g.id}-${p}-${i}`)) n++;});return n;};
  const totalItems=g=>szFn(g).reduce((a,b)=>a+b,0);
  if(savedG.length===0) return(
    <div className="page fu">
      <div className="pg-ey">Grant Planner</div>
      <h1 className="pg-h1">Your Grant Calendar</h1>
      <div className="empty card" style={{marginTop:20}}>
        <div className="empty-icon">📅</div>
        <div className="empty-h">No grants saved yet</div>
        <p style={{color:muted,marginBottom:16,fontSize:14}}>Go to Find Funding, open any grant, and tap "+ Save to Planner" to track it here.</p>
      </div>
    </div>
  );
  const renderCard=g=>{
    const days=daysLeft(g.deadline);
    const total=totalItems(g),done=countDone(g);
    const pct=total>0?Math.round((done/total)*100):0;
    const isExp=expanded===g.id;
    return(
      <div className="tl-item" key={g.id}>
        <div className="tl-dot-col">
          <div className={`tl-dot dot-${g.status}`}/>
          {isExp&&<div className="tl-vert"/>}
        </div>
        <div className={`tl-card${isExp?" exp":""}`} onClick={()=>setExpanded(isExp?null:g.id)}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
            <div style={{flex:1}}>
              <div className="tl-name">{g.name}</div>
              <div className="tl-org">{g.org}</div>
              <div className="tl-meta">
                <span>💰 {g.amount}</span><span>📅 {g.deadline}</span>
                {days!==null&&<span className={`days-tag ${days<=14?"days-u":days<=60?"days-m":"days-g"}`}>{days<=0?"⚠️ Past":days===0?"⚠️ Today!":days<=14?`⚠️ ${days} days`:`${days} days`}</span>}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:11,color:pct===100?openFg:muted,fontWeight:600,marginBottom:4}}>{pct}% ready</div>
              <div className="rbar"><div className="rbar-fill" style={{width:`${pct}%`,background:pct===100?openFg:sage}}/></div>
            </div>
          </div>
          {isExp&&(
            <div className="fi" style={{marginTop:13,paddingTop:13,borderTop:`1px solid ${border}`}}>
              <CheckGroup items={g.eligibility} label="Eligibility" checked={checked} onToggle={onToggle} prefix={`${g.id}-el`}/>
              <CheckGroup items={g.documents} label="Documents" checked={checked} onToggle={onToggle} prefix={`${g.id}-do`}/>
              <CheckGroup items={g.prep} label="Preparation" checked={checked} onToggle={onToggle} prefix={`${g.id}-pr`}/>
              <CheckGroup items={g.stalls} label="Stalls to Avoid" checked={checked} onToggle={onToggle} prefix={`${g.id}-st`}/>
              <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                <button className="btn btn-p btn-sm" onClick={e=>{e.stopPropagation();downloadICS(g);}}>📅 Add to Calendar</button>
                <button className="btn btn-g btn-sm" onClick={e=>{e.stopPropagation();onSave(g.id);}}>Remove</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  return(
    <div className="page fu">
      <div className="pg-ey">Grant Planner</div>
      <h1 className="pg-h1">Your Grant Calendar</h1>
      <p className="pg-sub">Track every deadline, monitor your readiness, and add cycles to your phone calendar with one tap.</p>
      {Object.entries(byMonth).sort().map(([key,{date,grants}])=>(
        <div key={key} style={{marginBottom:22}}>
          <div className="tl-mo">{MN[date.getMonth()]} {date.getFullYear()}</div>
          {grants.map(g=>renderCard(g))}
        </div>
      ))}
      {rolling.length>0&&<div style={{marginBottom:22}}><div className="tl-mo">Rolling / No Fixed Deadline</div>{rolling.map(g=>renderCard(g))}</div>}
    </div>
  );
}

function WriterView({answers}){
  const [step,setStep]=useState("setup");
  const [setup,setSetup]=useState({grantName:"",funderName:"",amount:"",deadline:"",orgName:"",location:answers.location||"",mission:"",population:"",problem:"",solution:"",outcomes:""});
  const [activeSection,setActiveSection]=useState("cover");
  const [content,setContent]=useState({});
  const [generating,setGenerating]=useState(false);
  const [showDraft,setShowDraft]=useState(false);
  const ctx=`Organization: ${setup.orgName||"[not provided]"}\nMission: ${setup.mission||"[not provided]"}\nPopulation: ${setup.population||"[not provided]"}\nLocation: ${setup.location||"[not provided]"}\nProblem: ${setup.problem||"[not provided]"}\nSolution: ${setup.solution||"[not provided]"}\nOutcomes: ${setup.outcomes||"[not provided]"}\nGrant: ${setup.grantName||"[not provided]"} from ${setup.funderName||"[not provided]"}\nAmount: ${setup.amount||"[not provided]"}\nDeadline: ${setup.deadline||"[not provided]"}`;
  const prompts={
    cover:"Write a grant cover letter. 4 paragraphs, one page max: (1) what you're requesting, how much, why it fits this funder. (2) Your one best proof point of credibility. (3) The community you serve and urgency of the need. (4) The explicit ask: 'We are requesting $X to do Y for Z people in [place].' Warm, clear, no jargon.",
    need:"Write a Statement of Need. Open with a real person from this community — not with the organization. Use the most specific local data available. 200–350 words. No jargon. Every fact connects to a real person's life.",
    description:"Write a Project Description. Start by describing what someone would actually see on a real day of this program. State the theory of change clearly. Include a brief timeline. 300–400 words. Concrete language.",
    objectives:"Write Goals and Objectives. 2–3 broad goals, 4–6 SMART objectives. Every objective: who, what change, by when, measured how. Never write 'raise awareness.'",
    evaluation:"Write an Evaluation Plan. Name both process indicators and outcome indicators. Say who collects what data and how often. Realistic for a small volunteer-run organization.",
    capacity:"Write an Organizational Capacity section. Prove trustworthiness with specific past accomplishments — real numbers and dates. If the org is new, highlight the team's personal relevant experience and advisors. 200–300 words.",
    budget:"Write a Budget Narrative. Justify every major line item with a specific rationale. Calculate and state cost per person served. Include any in-kind or matching contributions. 250–350 words.",
    sustainability:"Write a Sustainability section. Be honest — no promise of independence in year 2. Name 2 specific other funders you plan to approach. Address funder dependency directly.",
  };
  const generate=async()=>{
    setGenerating(true);
    try{
      const text=await callAI(
        "You are an expert grant writer specializing in small, rural, and faith-based organizations. Write in clear, human language. Lead with the people served. Use active voice and specific numbers. Output only the grant section — no preamble, no explanation, start directly.",
        `Context:\n${ctx}\n\nTask: ${prompts[activeSection]}\n\nWrite the section now:`,
        900
      );
      setContent(p=>({...p,[activeSection]:text}));
    }catch(e){setContent(p=>({...p,[activeSection]:`Error: ${e.message}. Please try again.`}));}
    setGenerating(false);
  };
  const done=WSECS.filter(s=>(content[s.id]||"").length>50);
  const fullDraft=WSECS.filter(s=>content[s.id]).map(s=>`==== ${s.label.toUpperCase()} ====\n\n${content[s.id]}`).join("\n\n\n");
  const tips=TIPS[activeSection]||[];
  const tagClass={i:"tip-i",w:"tip-w",f:"tip-f",d:"tip-d"};
  const tagLabel={i:"✦ Insight",w:"⚠ Watch out",f:"👁 Funder's view",d:"✓ Done when…"};
  if(step==="setup") return(
    <div className="page fu">
      <div className="pg-ey">AI Grant Writer</div>
      <h1 className="pg-h1">Write Your Proposal</h1>
      <p className="pg-sub">Section by section, with expert guidance alongside every word — at no cost.</p>
      <div className="card">
        <h2 style={{fontFamily:"'Lora',serif",fontSize:18,marginBottom:5}}>Tell me about your project and the grant</h2>
        <p style={{fontSize:13.5,color:muted,marginBottom:18,lineHeight:1.6}}>Fill in what you know. Leave blank what you don't — I'll work with what you have.</p>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase",color:muted,marginBottom:10}}>About This Grant</div>
        <div className="setup-grid" style={{marginBottom:18}}>
          {[["grantName","Grant Program Name","e.g. USDA Rural Development Grant"],["funderName","Funder / Agency","e.g. USDA Rural Development"],["amount","Amount Requesting","e.g. $15,000"],["deadline","Application Deadline","e.g. April 30, 2026"]].map(([k,l,ph])=>(
            <div className="form-field" key={k}><label className="form-lbl">{l}</label><input className="form-inp" type="text" placeholder={ph} value={setup[k]} onChange={e=>setSetup(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase",color:muted,marginBottom:10}}>About Your Organization or Project</div>
        <div className="setup-grid">
          {[["orgName","Organization or Project Name","e.g. St. Martin Food Pantry"],["location","Location","e.g. Saint Martinville, Louisiana"]].map(([k,l,ph])=>(
            <div className="form-field" key={k}><label className="form-lbl">{l}</label><input className="form-inp" type="text" placeholder={ph} value={setup[k]} onChange={e=>setSetup(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          {[["mission","Mission Statement","e.g. We provide emergency food assistance to families in rural St. Martin Parish, Louisiana."],["population","Who do you serve?","e.g. Low-income rural families in St. Martin Parish — especially elderly residents and families with young children."],["problem","The problem you're solving","e.g. St. Martin Parish has no food bank. Families drive 45 minutes each way to reach the nearest pantry."],["solution","What you do / will do","e.g. We operate a weekly food distribution every Thursday, serving 60 families. We also deliver to homebound elderly."],["outcomes","What you hope to achieve","e.g. 100 families will have weekly access to fresh food within 10 miles of home."]].map(([k,l,ph])=>(
            <div className="form-field setup-full" key={k}><label className="form-lbl">{l}</label><textarea className="form-ta" placeholder={ph} value={setup[k]} onChange={e=>setSetup(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
        </div>
        <div style={{marginTop:20,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <button className="btn btn-p" onClick={()=>setStep("write")} disabled={!setup.orgName||!setup.mission}>Begin Writing My Proposal →</button>
          {(!setup.orgName||!setup.mission)&&<span style={{fontSize:13,color:muted}}>Add your organization name and mission to continue</span>}
        </div>
      </div>
    </div>
  );
  const activeSec=WSECS.find(s=>s.id===activeSection);
  return(
    <div className="page fu">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        <button className="btn btn-g btn-sm" onClick={()=>setStep("setup")}>← Setup</button>
        <div style={{flex:1,minWidth:0}}>
          <div className="pg-ey" style={{marginBottom:2}}>AI Grant Writer</div>
          <div style={{fontFamily:"'Lora',serif",fontSize:17,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{setup.grantName||"Your Proposal"}</div>
        </div>
        <div style={{fontSize:12.5,color:muted,flexShrink:0}}>{done.length}/{WSECS.length} sections</div>
        {done.length>0&&<button className="btn btn-a btn-sm" onClick={()=>setShowDraft(s=>!s)}>📄 {showDraft?"Hide":"Preview"}</button>}
      </div>
      <div style={{background:border,borderRadius:3,height:4,marginBottom:16,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(done.length/WSECS.length)*100}%`,background:sage,transition:"width .4s"}}/>
      </div>
      {showDraft&&(
        <div className="card fi" style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <strong style={{fontFamily:"'Lora',serif"}}>Full Draft — {done.length} sections</strong>
            <button className="btn btn-g btn-sm" onClick={()=>navigator.clipboard.writeText(fullDraft)}>📋 Copy All</button>
          </div>
          <div className="draft-box">{fullDraft||"No sections written yet."}</div>
        </div>
      )}
      <div className="sec-tabs">
        {WSECS.map(s=>(
          <button key={s.id} className={`sec-tab${activeSection===s.id?" on":""}${(content[s.id]||"").length>50?" done":""}`} onClick={()=>setActiveSection(s.id)}>
            {s.icon} {s.label}{(content[s.id]||"").length>50?" ✓":""}
          </button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11,flexWrap:"wrap",gap:8}}>
        <div style={{fontFamily:"'Lora',serif",fontSize:16,fontWeight:600}}>{activeSec?.icon} {activeSec?.label}</div>
        <button className="btn btn-p btn-sm" onClick={generate} disabled={generating}>
          {generating?<><span className="sp-sm"/> Writing…</>:"✨ Generate with AI"}
        </button>
      </div>
      <div className="writer-area">
        {generating?(
          <div style={{display:"flex",alignItems:"center",gap:10,color:muted,padding:"10px 0",fontSize:14}}>
            <div style={{width:20,height:20,border:`2.5px solid ${border}`,borderTopColor:sage,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
            Writing your {activeSec?.label}…<span className="cursor-b"/>
          </div>
        ):(
          <textarea className="writer-ta"
            placeholder={`Click "Generate with AI" to write this section, or type directly.\n\nTip: Generate first, then edit with details only you know.`}
            value={content[activeSection]||""}
            onChange={e=>setContent(p=>({...p,[activeSection]:e.target.value}))}/>
        )}
      </div>
      <div style={{display:"flex",gap:8,marginTop:9,alignItems:"center",flexWrap:"wrap"}}>
        <button className="btn btn-o btn-sm" onClick={generate} disabled={generating}>↺ Try Again</button>
        {(content[activeSection]||"").length>0&&<button className="btn btn-g btn-sm" onClick={()=>setContent(p=>({...p,[activeSection]:""}))}>Clear</button>}
        {(content[activeSection]||"").length>50&&<span style={{marginLeft:"auto",fontSize:12.5,color:openFg,fontWeight:600}}>✓ Section complete</span>}
      </div>
      <div className="tips-box">
        <div className="tips-title">💡 What Top Grant Writers Know</div>
        {tips.map((tip,i)=>(
          <div className="tip" key={i}>
            <div className={`tip-tag ${tagClass[tip.t]}`}>{tagLabel[tip.t]}</div>
            <div className="tip-title">{tip.title}</div>
            <div className="tip-body">{tip.body}</div>
          </div>
        ))}
        <div style={{marginTop:11,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.08)",fontSize:11.5,color:"rgba(255,255,255,.3)",lineHeight:1.6}}>AI writes a strong first draft. You add the details only you know. Review every word before submitting.</div>
      </div>
    </div>
  );
}

function HomePage({onStart}){
  return(
    <div>
      <section className="hero">
        <div className="hero-in">
          <div className="hero-ey fu"><span className="hero-dot"/>Built for small and rural programs</div>
          <h1 className="hero-h1 fu d1">Your community deserves funding.<br/><em>Let's find it together.</em></h1>
          <p className="hero-sub fu d2">Small, rural, volunteer-run, and faith-based programs are the most underserved in the funding system. <strong>GrantCompass was built specifically for you.</strong> Answer 5 questions. Get real funding options. Write your proposal — all free.</p>
          <div className="hero-btns fu d3">
            <button className="hbp" onClick={onStart}>Find Funding for My Work →</button>
            <button className="hbg" onClick={onStart}>See How It Works</button>
          </div>
        </div>
      </section>
      <div className="page">
        <div className="feat-list fu">
          {[
            {icon:"🔍",title:"Real funding, found for you",body:"Answer 5 questions about your work and location. The AI searches federal grants, state programs, local community foundations, faith-based funders, and hidden sources — all at once, matched to you."},
            {icon:"📍",title:"Local funders most people miss",body:"The most accessible grants are often the most local. GrantCompass specifically looks for funders in your city, county, and region — including obscure sources that consultants charge thousands to know."},
            {icon:"✅",title:"Step-by-step checklists",body:"Every funding source includes exactly what you need to apply — eligibility, required documents, preparation steps, and the most common reasons applications fail."},
            {icon:"📅",title:"Deadlines to your calendar",body:"Save any funding opportunity and add its deadline directly to your phone calendar — with a two-week reminder built in. Never miss a cycle again."},
            {icon:"✍️",title:"AI writes your proposal",body:"Tell me about your project. I'll write every section — Cover Letter, Statement of Need, Budget, Sustainability, and more. Same approach professional grant writers use, available free."},
          ].map((f,i)=>(
            <div className="feat-item fu" key={i} style={{animationDelay:`${i*0.07}s`}}>
              <div className="feat-icon">{f.icon}</div>
              <div><div className="feat-title">{f.title}</div><div className="feat-body">{f.body}</div></div>
            </div>
          ))}
        </div>
        <button className="btn btn-p btn-full" style={{fontSize:15,padding:"13px"}} onClick={onStart}>Start Finding Funding — Free, No Account Needed</button>
        <p style={{textAlign:"center",fontSize:13,color:muted,marginTop:10}}>No login. No signup. No cost. Just answers.</p>
        <div className="eth-box">
          <div className="eth-title">How this works, honestly</div>
          {["Results are AI-generated from knowledge of real funders — always verify details directly with funders before applying. Information changes.","Your location is used only to find local funders. It is never stored or shared.","We never push you toward an application that isn't right for you. If a grant doesn't fit, we say so.","No pay-to-win. No featured placements. Every result is here because it fits you."].map((t,i)=><div className="eth-item" key={i}>{t}</div>)}
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [page,setPage]=useState("home");
  const [tab,setTab]=useState("intake");
  const [answers,setAnswers]=useState({});
  const [checked,setChecked]=useState(new Set());
  const [saved,setSaved]=useState(new Set());
  const [allGrants,setAllGrants]=useState([]);
  const [toast,setToast]=useState(null);

  const toastRef=useRef(null);
  const showToast=useCallback((msg,sub)=>{setToast({msg,sub});clearTimeout(toastRef.current);toastRef.current=setTimeout(()=>setToast(null),3000);},[]);
  const toggleCheck=useCallback(k=>{setChecked(p=>{const n=new Set(p);n.has(k)?n.delete(k):n.add(k);return n;});},[]);
  const toggleSave=useCallback(id=>{setSaved(p=>{const n=new Set(p);if(n.has(id)){n.delete(id);showToast("Removed from Planner","");}else{n.add(id);showToast("Saved ✓","Open the Planner tab to track this grant.");}return n;});},[showToast]);
  const TABS=[{id:"discover",icon:"🔍",label:"Find Funding"},{id:"planner",icon:"📅",label:`Planner${saved.size>0?` (${saved.size})`:""}`},{id:"writer",icon:"✍️",label:"Write Proposal"}];

  return(
    <div className="app">
      <style>{CSS}</style>
      <nav className="nav">
        <div className="logo" onClick={()=>setPage("home")}>Grant<em>Compass</em></div>
        <div className="nav-tabs">
          {page==="app"?TABS.map(t=>(
            <button key={t.id} className={`ntab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>
          )):(
            <button className="ntab" onClick={()=>{setPage("app");setTab("intake");}}>Start Free</button>
          )}
          {page==="app"&&<button className="ntab" style={{color:"rgba(255,255,255,.35)",fontSize:12}} onClick={()=>setPage("home")}>Home</button>}
        </div>
      </nav>
      {page==="home"&&<HomePage onStart={()=>{setPage("app");setTab("intake");}}/>}
      {page==="app"&&(
        <main style={{flex:1,overflow:"auto",background:bg}}>
          {tab==="intake"&&<IntakeView onComplete={a=>{setAnswers(a);setTab("discover");}}/>}
          {tab==="discover"&&<DiscoverView key={JSON.stringify(answers)} answers={answers} onAnswersChange={setAnswers} checked={checked} onToggle={toggleCheck} saved={saved} onSave={toggleSave} onLoaded={setAllGrants}/>}
          {tab==="planner"&&<PlannerView saved={saved} onSave={toggleSave} checked={checked} onToggle={toggleCheck} allGrants={allGrants}/>}
          {tab==="writer"&&<WriterView answers={answers}/>}
        </main>
      )}
      {toast&&<div className="toast"><strong>{toast.msg}</strong>{toast.sub&&<span style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>{toast.sub}</span>}</div>}
    </div>
  );
}
