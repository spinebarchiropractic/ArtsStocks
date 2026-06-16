// v3 - fixed totals
import { useState, useEffect, useRef } from "react";

const PORTFOLIO = [
  { symbol:"MMATQ", name:"Meta Materials",           qty:1,       costBasis:396.28, phase:1, dead:true  },
  { symbol:"VEVMQ", name:"Vicinity Motor",            qty:33,      costBasis:6.99,   phase:1, dead:true  },
  { symbol:"CARM",  name:"Carisma Therapeutics",      qty:2,       costBasis:54.77,  phase:1, dead:true  },
  { symbol:"SESEN", name:"Sesen Bio",                 qty:50,      costBasis:0.00,   phase:1, dead:true  },
  { symbol:"BAIYU", name:"Baiyu Holdings",            qty:1,       costBasis:80.55,  phase:1, dead:true  },
  { symbol:"WAGP",  name:"WAG Group",                 qty:100,     costBasis:0.29,   phase:1, dead:true  },
  { symbol:"BTCWF", name:"Bluesky Digital",           qty:250,     costBasis:0.21,   phase:2, dead:false },
  { symbol:"SEEK",  name:"TheDirectory.com",          qty:500000,  costBasis:0.00,   phase:2, dead:false },
  { symbol:"SSTY",  name:"Sure Trace Security",       qty:200000,  costBasis:0.00,   phase:2, dead:false },
  { symbol:"MBIO",  name:"Mustang Bio",               qty:5,       costBasis:11.04,  phase:2, dead:false },
  { symbol:"LCID",  name:"Lucid Group",               qty:1,       costBasis:68.00,  phase:3, dead:false },
  { symbol:"UP",    name:"Wheels Up Experience",      qty:1,       costBasis:29.34,  phase:3, dead:false },
  { symbol:"ACHR",  name:"Archer Aviation",           qty:20,      costBasis:5.96,   phase:3, dead:false },
  { symbol:"STI",   name:"Solidion Technology",       qty:2,       costBasis:20.68,  phase:3, dead:false },
  { symbol:"S",     name:"SentinelOne",               qty:15,      costBasis:15.26,  phase:3, dead:false },
  { symbol:"BDRBF", name:"Bombardier B",              qty:14,      costBasis:14.83,  phase:4, dead:false },
  { symbol:"OSS",   name:"One Stop Systems",          qty:50,      costBasis:2.34,   phase:4, dead:false },
  { symbol:"RGTI",  name:"Rigetti Computing",         qty:25,      costBasis:1.88,   phase:4, dead:false },
  { symbol:"DRUG",  name:"Bright Minds Biosciences",  qty:5,       costBasis:4.68,   phase:4, dead:false },
  { symbol:"USO",   name:"US Oil Fund",               qty:7,       costBasis:24.60,  phase:4, dead:false },
  { symbol:"AAPL",  name:"Apple Inc",                 qty:5.1539,  costBasis:120.38, phase:5, dead:false },
  { symbol:"MSFT",  name:"Microsoft Corp",            qty:3.1653,  costBasis:159.20, phase:5, dead:false },
  { symbol:"NVDA",  name:"Nvidia Corp",               qty:2.0001,  costBasis:184.91, phase:5, dead:false },
  { symbol:"B",     name:"Barrick Gold",              qty:10,      costBasis:29.80,  phase:5, dead:false },
  { symbol:"NEM",   name:"Newmont Corp",              qty:3.541,   costBasis:65.57,  phase:5, dead:false },
  { symbol:"CCL",   name:"Carnival Corp",             qty:10.0523, costBasis:20.69,  phase:5, dead:false },
  { symbol:"CRON",  name:"Cronos Group",              qty:50,      costBasis:2.15,   phase:5, dead:false },
  { symbol:"SOFI",  name:"SoFi Technologies",         qty:25,      costBasis:16.50,  phase:5, dead:false },
  { symbol:"KORE",  name:"Kore Group Holdings",       qty:15,      costBasis:3.74,   phase:5, dead:false },
  { symbol:"SPCB",  name:"SuperCom Ltd",              qty:10,      costBasis:6.47,   phase:5, dead:false },
  { symbol:"VICI",  name:"VICI Properties REIT",      qty:20.0518, costBasis:24.69,  phase:5, dead:false },
  { symbol:"VZ",    name:"Verizon Communications",    qty:26.7941, costBasis:42.89,  phase:5, dead:false },
  { symbol:"JETS",  name:"US Global JETS ETF",        qty:10.1534, costBasis:16.57,  phase:5, dead:false },
  { symbol:"SCHD",  name:"Schwab US Dividend Equity", qty:26.0538, costBasis:26.73,  phase:5, dead:false },
  { symbol:"CYCU",  name:"Cycurion Inc",              qty:34,      costBasis:0.88,   phase:0, dead:false },
];

const MANUAL_ONLY = new Set(["SEEK","SSTY","BTCWF","WAGP","SESEN","BAIYU","MMATQ","VEVMQ","CARM","CYCU","MBIO","BDRBF","OSS","DRUG","STI","KORE","SPCB","UP"]);

const PHASE = {
  0:{ action:"SPECULATIVE", color:"#a855f7", border:"#3b1a5a", why:"Small bet. Hard stop at -20%. Take profits at target." },
  1:{ action:"WRITE OFF",   color:"#6b7280", border:"#1f2937", why:"Bankrupt. Contact Schwab to declare worthless — full tax loss." },
  2:{ action:"SELL NOW",    color:"#ef4444", border:"#450a0a", why:"Near-zero value. Sell immediately to capture any remaining tax loss." },
  3:{ action:"HARVEST",     color:"#f97316", border:"#431407", why:"Sell to harvest the loss. Directly offsets gains from your winners." },
  4:{ action:"TRIM",        color:"#f59e0b", border:"#422006", why:"Lock in gains gradually. Use harvested losses to cover the tax bill." },
  5:{ action:"HOLD",        color:"#22c55e", border:"#052e16", why:"Core position. Let it run. Revisit sizing after cleanup is done." },
};

const fmt  = (n,d=2) => "$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const sgn  = n => n>=0?"+":"-";
const pct  = n => (n>=0?"+":"")+n.toFixed(1)+"%";

export default function App() {
  const [prices, setPrices]           = useState({});
  const [fetching, setFetching]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown]     = useState(60);
  const [tab, setTab]                 = useState("strategy");
  const [brief, setBrief]             = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [posInsight, setPosInsight]   = useState({});
  const [posLoading, setPosLoading]   = useState({});
  const [open, setOpen]               = useState(null);
  const ref = useRef({});

  const price = sym => ref.current[sym] ?? null;
  const gl = pos => {
    if(pos.dead) return null;
    const p = price(pos.symbol);
    if(!p) return null;
    const cv=p*pos.qty, cb=pos.costBasis*pos.qty;
    return {p, gl:cv-cb, pct:((p-pos.costBasis)/pos.costBasis)*100, cv, cb};
  };

  const doFetch = async () => {
    setFetching(true);
    const syms = PORTFOLIO.filter(p=>!p.dead&&!MANUAL_ONLY.has(p.symbol)).map(p=>p.symbol);
    const fresh={};
    await Promise.allSettled(syms.map(async s=>{
      try{ const r=await fetch(`/api/quote?symbol=${s}`); const d=await r.json(); if(d.price>0) fresh[s]=d.price; }catch{}
    }));
    ref.current={...ref.current,...fresh};
    setPrices({...ref.current});
    setLastUpdated(new Date().toLocaleTimeString());
    setCountdown(60);
    setFetching(false);
  };

  useEffect(()=>{ doFetch(); const iv=setInterval(doFetch,60000); return()=>clearInterval(iv); },[]);
  useEffect(()=>{ const t=setInterval(()=>setCountdown(c=>c>0?c-1:0),1000); return()=>clearInterval(t); },[]);

  // ── TOTALS ──────────────────────────────────────────────────────────────
  const SNAP={BDRBF:3028.20,AAPL:1540.86,MSFT:1240.20,VZ:1252.85,VICI:562.81,SCHD:851.57,USO:799.27,RGTI:530.38,SOFI:441.00,NEM:385.14,NVDA:418.77,OSS:993.00,DRUG:291.25,JETS:313.21,CCL:306.75,CRON:129.75,KORE:137.78,SPCB:121.90,B:429.75,S:225.70,ACHR:108.70,STI:40.95,LCID:5.05,UP:8.00,CYCU:23.97,MBIO:3.49,BTCWF:12.51};
  const totalValue    = PORTFOLIO.reduce((a,p)=>{const g=gl(p);return a+(g?g.cv:(SNAP[p.symbol]||0));},0);
  const totalGL       = PORTFOLIO.reduce((a,p)=>{const g=gl(p);return a+(g?g.gl:0);},0);
  const harvestable   = PORTFOLIO.filter(p=>p.phase<=3).reduce((a,p)=>{
    const g=gl(p);
    if(p.dead) return a+p.costBasis*p.qty;           // full write-off
    if(g&&g.gl<0) return a+Math.abs(g.gl);           // live loss
    if(!g&&p.costBasis>0) return a+p.costBasis*p.qty; // OTC: use cost as est. loss
    return a;
  },0);
  const winners = PORTFOLIO.filter(p=>{const g=gl(p);return g&&g.gl>0;}).sort((a,b)=>(gl(b)?.gl||0)-(gl(a)?.gl||0));
  const bigWin  = winners[0]; const bigWinGL = bigWin?gl(bigWin):null;

  // ── STRATEGY BRIEF ──────────────────────────────────────────────────────
  const runBrief = async () => {
    setBriefLoading(true);
    const lines = PORTFOLIO.map(p=>{
      const g=gl(p);
      const loss = p.dead ? p.costBasis*p.qty : (g&&g.gl<0 ? Math.abs(g.gl) : 0);
      return `${p.symbol} (${PHASE[p.phase].action}) cost=$${p.costBasis} qty=${p.qty}${g?` now=$${g.p.toFixed(2)} gl=${sgn(g.gl)}${fmt(Math.abs(g.gl),0)} ${pct(g.pct)}`:p.dead?` WORTHLESS loss=${fmt(loss,0)}`:` no-price loss-est=${fmt(loss,0)}`}`;
    }).join("\n");
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",max_tokens:1400,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:
`You are a ruthless tax-aware portfolio strategist. Taxable Schwab account, June 2026, consolidating 35→15 positions.

Search current market conditions then produce a strategy brief. Use EXACTLY these section headers (with the dashes):

--- THIS WEEK: TOP 3 ACTIONS ---
Number them. Be specific (use ticker symbols and dollar amounts). Most urgent first.

--- TAX OPPORTUNITY ---
Total harvestable losses, which specific positions to sell first and why, which gains they offset, wash sale warnings.

--- PROTECT YOUR WINNERS ---
RGTI, BDRBF, OSS, DRUG, USO are large winners. How to lock in gains tax-efficiently using losses as offsets.

--- BOTTOM LINE ---
One sentence. The single most important move today.

Portfolio:
${lines}`
          }]
        })
      });
      const data=await res.json();
      setBrief(data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"");
    }catch(e){console.error(e);}
    setBriefLoading(false);
  };

  // ── PER-POSITION INSIGHT ─────────────────────────────────────────────────
  const analyze = async (pos) => {
    setPosLoading(p=>({...p,[pos.symbol]:true}));
    const g=gl(pos);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",max_tokens:500,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:
`Taxable Schwab account. Position: ${pos.symbol} (${pos.name})
${pos.qty} shares @ $${pos.costBasis} cost | ${g?`Now $${g.p.toFixed(2)} | P&L ${sgn(g.gl)}${fmt(Math.abs(g.gl),0)} (${pct(g.pct)})`:pos.dead?"WORTHLESS":"no live price"} | Recommended: ${PHASE[pos.phase].action}

Search latest news + analyst price targets. Return ONLY raw JSON, no markdown:
{"why":"why take this action now — 2 sentences","taxMove":"exact tax strategy for this position","risk":"what happens if you DON'T act","target":null,"confidence":85}`
          }]
        })
      });
      const data=await res.json();
      const txt=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const m=txt.match(/\{[\s\S]*?"confidence"[\s\S]*?\}/);
      if(m){try{setPosInsight(p=>({...p,[pos.symbol]:JSON.parse(m[0])}));}catch(_){}}
    }catch(e){console.error(e);}
    setPosLoading(p=>({...p,[pos.symbol]:false}));
  };

  // ── RENDER HELPERS ───────────────────────────────────────────────────────
  const ph = p => PHASE[p.phase];

  const ActionCard = ({pos}) => {
    const g=gl(pos), info=ph(pos), ins=posInsight[pos.symbol], isOpen=open===pos.symbol;
    const loss = pos.dead ? pos.costBasis*pos.qty : (g&&g.gl<0 ? Math.abs(g.gl):0);
    return (
      <div style={{border:`1px solid ${info.border}`,borderRadius:10,marginBottom:8,overflow:"hidden",background:"#0a0f1e"}}>
        {/* Header row */}
        <div onClick={()=>setOpen(isOpen?null:pos.symbol)}
          style={{padding:"12px 14px",cursor:"pointer",display:"grid",gridTemplateColumns:"80px 1fr auto",gap:10,alignItems:"center"}}>
          {/* Action badge */}
          <div style={{background:info.color+"18",border:`1px solid ${info.color}44`,borderRadius:6,padding:"5px 0",textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:900,color:info.color,letterSpacing:0.5}}>{info.action}</div>
          </div>
          {/* Ticker + name */}
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:6}}>
              <span style={{fontSize:15,fontWeight:900,color:"#f8fafc"}}>{pos.symbol}</span>
              <span style={{fontSize:10,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{pos.name}</span>
            </div>
            <div style={{fontSize:10,color:"#334155",marginTop:2}}>
              {pos.dead
                ? <span style={{color:"#6b7280"}}>Tax loss: {fmt(loss,0)}</span>
                : g
                  ? <span style={{color:g.gl>=0?"#22c55e":"#f97316"}}>{sgn(g.gl)}{fmt(Math.abs(g.gl),0)} ({pct(g.pct)}) · {fmt(g.p)} now</span>
                  : <span style={{color:"#475569"}}>Cost {fmt(pos.costBasis)}/sh · {pos.qty} shares</span>
              }
            </div>
          </div>
          {/* Chevron */}
          <div style={{color:"#334155",fontSize:12}}>{isOpen?"▲":"▼"}</div>
        </div>

        {/* Expanded */}
        {isOpen && (
          <div style={{borderTop:`1px solid ${info.border}`,padding:"12px 14px",background:"#060a14"}}>
            {/* Why this action */}
            <div style={{background:info.color+"0d",border:`1px solid ${info.color}22`,borderRadius:7,padding:"10px 12px",marginBottom:10}}>
              <div style={{fontSize:9,color:info.color,fontWeight:800,letterSpacing:1,marginBottom:4}}>WHY {info.action}</div>
              <div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.6}}>{info.why}</div>
              {g && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:10}}>
                  {[
                    {label:"Paid",    val:fmt(g.cb,0)},
                    {label:"Now Worth",val:fmt(g.cv,0)},
                    {label:"P&L",     val:`${sgn(g.gl)}${fmt(Math.abs(g.gl),0)}`, color:g.gl>=0?"#22c55e":"#f97316"},
                  ].map(s=>(
                    <div key={s.label} style={{background:"#0f172a",borderRadius:6,padding:"7px 9px",textAlign:"center"}}>
                      <div style={{fontSize:8,color:"#475569",marginBottom:2}}>{s.label}</div>
                      <div style={{fontSize:13,fontWeight:800,color:s.color||"#f8fafc"}}>{s.val}</div>
                    </div>
                  ))}
                </div>
              )}
              {pos.dead && (
                <div style={{marginTop:10,background:"#0f172a",borderRadius:6,padding:"8px 10px",fontSize:11,color:"#6b7280"}}>
                  Action: Message Schwab via secure message center requesting worthless security write-off. Estimated loss: <span style={{color:"#f8fafc",fontWeight:700}}>{fmt(loss,0)}</span>
                </div>
              )}
              {!pos.dead && !g && (
                <div style={{marginTop:8,fontSize:11,color:"#475569"}}>Live price unavailable for this OTC/micro-cap security. Check Schwab for current price.</div>
              )}
            </div>

            {/* AI insight */}
            {ins ? (
              <div style={{background:"#0f172a",borderRadius:7,padding:"10px 12px",border:"1px solid #1e293b"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:9,color:"#64748b",fontWeight:800,letterSpacing:1}}>AI ANALYSIS</span>
                  <span style={{fontSize:10,color:info.color,fontWeight:700}}>{ins.confidence}% confidence</span>
                </div>
                <div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.6,marginBottom:8}}>{ins.why}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <div style={{background:"#060a14",borderRadius:6,padding:"7px 9px"}}>
                    <div style={{fontSize:8,color:"#065f46",marginBottom:3,letterSpacing:0.5}}>TAX MOVE</div>
                    <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>{ins.taxMove}</div>
                  </div>
                  <div style={{background:"#060a14",borderRadius:6,padding:"7px 9px"}}>
                    <div style={{fontSize:8,color:"#7f1d1d",marginBottom:3,letterSpacing:0.5}}>RISK OF INACTION</div>
                    <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>{ins.risk}</div>
                  </div>
                </div>
                <button onClick={(e)=>{e.stopPropagation();analyze(pos);}} disabled={posLoading[pos.symbol]}
                  style={{width:"100%",marginTop:8,background:"#1e293b",color:"#475569",border:"none",borderRadius:6,padding:"6px",fontSize:10,cursor:"pointer"}}>
                  {posLoading[pos.symbol]?"Refreshing…":"↻ Refresh AI analysis"}
                </button>
              </div>
            ) : (
              <button onClick={(e)=>{e.stopPropagation();analyze(pos);}} disabled={posLoading[pos.symbol]}
                style={{width:"100%",background:posLoading[pos.symbol]?"#1e293b":`linear-gradient(90deg,${info.color}33,${info.color}11)`,border:`1px solid ${info.color}33`,color:posLoading[pos.symbol]?"#374151":info.color,borderRadius:7,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {posLoading[pos.symbol]?`Analyzing ${pos.symbol}…`:`⚡ Why ${info.action}? Get specific guidance`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const sections = [
    {label:"🚨 Urgent", phases:[1,2],   desc:"Write off or sell immediately"},
    {label:"📉 Harvest", phases:[3],    desc:"Sell to capture tax losses"},
    {label:"✂️ Trim",   phases:[4],     desc:"Lock in gains tax-efficiently"},
    {label:"✅ Hold",   phases:[5],     desc:"Core positions — hold and compound"},
    {label:"⚡ Spec",   phases:[0],     desc:"Speculative — manage risk"},
  ];

  return (
    <div style={{background:"#060a14",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:540,margin:"0 auto",paddingBottom:48}}>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(160deg,#0f172a,#1a1040)",padding:"16px 16px 12px",borderBottom:"1px solid #1e293b",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:9,color:"#475569",letterSpacing:2,textTransform:"uppercase"}}>Schwab · Taxable · Cleanup Mode</div>
            <div style={{fontSize:19,fontWeight:900,color:"#f8fafc",letterSpacing:-0.5}}>Portfolio Strategy</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:fetching?"#f59e0b":"#22c55e",marginBottom:3}}>{fetching?"● Updating prices…":`● Live · ${countdown}s`}</div>
            <button onClick={doFetch} disabled={fetching}
              style={{background:"#1e293b",color:"#64748b",border:"1px solid #334155",borderRadius:6,padding:"3px 10px",fontSize:10,cursor:"pointer"}}>↻</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
          {[
            {label:"Portfolio Value", val:totalValue>0?fmt(totalValue,0):"Loading…", color:"#f8fafc"},
            {label:"Harvestable Losses", val:`~${fmt(harvestable,0)}`, color:"#f97316", tip:"Tax losses available to offset gains"},
            {label:"Positions",  val:`${PORTFOLIO.length} → 15`, color:"#94a3b8"},
          ].map(s=>(
            <div key={s.label} style={{background:"#0f172a",borderRadius:7,padding:"8px 10px",border:"1px solid #1e293b"}}>
              <div style={{fontSize:8,color:"#475569",marginBottom:2,textTransform:"uppercase",letterSpacing:0.4}}>{s.label}</div>
              <div style={{fontSize:13,fontWeight:800,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>
        {lastUpdated&&<div style={{fontSize:9,color:"#1e293b",marginTop:5}}>Prices updated {lastUpdated}</div>}
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",borderBottom:"1px solid #1e293b",background:"#0a0f1e",position:"sticky",top:87,zIndex:9}}>
        {[["strategy","🎯 Strategy"],["positions","📋 Positions"],["tax","💰 Tax Plan"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{flex:1,padding:"10px 4px",background:tab===id?"#1e293b":"transparent",color:tab===id?"#f8fafc":"#475569",border:"none",borderBottom:tab===id?"2px solid #6d28d9":"2px solid transparent",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── STRATEGY TAB ── */}
      {tab==="strategy" && (
        <div style={{padding:"14px 16px 0"}}>
          <button onClick={runBrief} disabled={briefLoading}
            style={{width:"100%",background:briefLoading?"#1e293b":"linear-gradient(90deg,#6d28d9,#4338ca)",color:"#fff",border:"none",borderRadius:9,padding:"13px",fontSize:14,fontWeight:900,cursor:"pointer",marginBottom:12,letterSpacing:0.3}}>
            {briefLoading?"⟳ Building your strategy brief…":"⚡ Generate This Week's Strategy Brief"}
          </button>

          {/* Tax snapshot */}
          <div style={{background:"#0f1a0a",border:"1px solid #14532d",borderRadius:9,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:9,color:"#16a34a",fontWeight:800,letterSpacing:1,marginBottom:8}}>💰 TAX SNAPSHOT</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:10,color:"#475569",marginBottom:2}}>Harvestable losses</div>
                <div style={{fontSize:18,fontWeight:900,color:"#f97316"}}>{fmt(harvestable,0)}</div>
                <div style={{fontSize:9,color:"#475569",marginTop:1}}>across {PORTFOLIO.filter(p=>p.phase<=3).length} positions</div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#475569",marginBottom:2}}>Biggest gain to protect</div>
                {bigWin && bigWinGL ? (
                  <>
                    <div style={{fontSize:16,fontWeight:900,color:"#22c55e"}}>{bigWin.symbol} +{fmt(bigWinGL.gl,0)}</div>
                    <div style={{fontSize:9,color:"#475569",marginTop:1}}>needs loss offsets before trimming</div>
                  </>
                ) : <div style={{fontSize:12,color:"#334155"}}>Loading…</div>}
              </div>
            </div>
            <div style={{marginTop:10,padding:"8px 10px",background:"#052e16",borderRadius:6,fontSize:11,color:"#4ade80",lineHeight:1.5}}>
              Strategy: Sell losers first → use losses to offset gains → then trim winners tax-free. <span style={{color:"#86efac",fontWeight:700}}>Wash sale rule: wait 31 days before rebuying any sold position.</span>
            </div>
          </div>

          {/* Brief output */}
          {brief && (
            <div style={{background:"#0f172a",border:"1px solid #312e81",borderRadius:9,padding:"14px",marginBottom:12,fontSize:12,color:"#c7d2fe",lineHeight:1.8,whiteSpace:"pre-wrap"}}>
              {brief.split("---").filter(s=>s.trim()).map((section,i)=>{
                const lines = section.trim().split("\n");
                const heading = lines[0].trim();
                const body = lines.slice(1).join("\n").trim();
                return (
                  <div key={i} style={{marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:900,color:"#818cf8",letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>{heading}</div>
                    <div style={{color:"#e2e8f0",fontSize:12,lineHeight:1.75}}>{body}</div>
                  </div>
                );
              })}
            </div>
          )}

          {!brief && (
            <div style={{color:"#334155",fontSize:12,textAlign:"center",padding:"20px 0"}}>
              Tap the button above to get your personalized strategy brief with current market data.
            </div>
          )}
        </div>
      )}

      {/* ── POSITIONS TAB ── */}
      {tab==="positions" && (
        <div style={{padding:"12px 16px 0"}}>
          {sections.map(sec=>{
            const positions = PORTFOLIO.filter(p=>sec.phases.includes(p.phase));
            return (
              <div key={sec.label} style={{marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,marginTop:16}}>
                  <span style={{fontSize:12,fontWeight:800,color:"#94a3b8"}}>{sec.label}</span>
                  <span style={{fontSize:10,color:"#334155"}}>— {sec.desc}</span>
                  <div style={{flex:1,height:1,background:"#1e293b"}}/>
                  <span style={{fontSize:9,color:"#334155"}}>{positions.length}</span>
                </div>
                {positions.map(pos=><ActionCard key={pos.symbol} pos={pos}/>)}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAX TAB ── */}
      {tab==="tax" && (
        <div style={{padding:"14px 16px 0"}}>
          <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:9,padding:"14px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#f97316",fontWeight:800,letterSpacing:1,marginBottom:10}}>SEQUENCING GUIDE</div>
            {[
              {step:"1",title:"Write off bankrupt positions",detail:"MMATQ, VEVMQ, CARM, SESEN, BAIYU, WAGP — contact Schwab secure message center. Immediate tax losses with no market risk.",color:"#6b7280"},
              {step:"2",title:"Sell near-dead positions",detail:"BTCWF, SEEK, SSTY, MBIO — sell in app now. Capture remaining losses before they evaporate.",color:"#ef4444"},
              {step:"3",title:"Harvest meaningful losses",detail:"LCID, UP, ACHR, STI, S — sell these to lock in losses. These offset your big winners.",color:"#f97316"},
              {step:"4",title:"Trim winners using offset",detail:"RGTI, BDRBF, OSS, DRUG, USO — now sell partial positions. Your harvested losses absorb the capital gains tax.",color:"#f59e0b"},
              {step:"5",title:"Let core positions compound",detail:"AAPL, MSFT, NVDA, SCHD, VICI, VZ, etc. — hold. These are your long-term wealth builders.",color:"#22c55e"},
            ].map(s=>(
              <div key={s.step} style={{display:"flex",gap:12,marginBottom:14}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:s.color+"22",border:`1px solid ${s.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:10,fontWeight:900,color:s.color}}>{s.step}</span>
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:"#f8fafc",marginBottom:3}}>{s.title}</div>
                  <div style={{fontSize:11,color:"#64748b",lineHeight:1.5}}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:"#1a0f00",border:"1px solid #431407",borderRadius:9,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#f97316",fontWeight:800,letterSpacing:1,marginBottom:8}}>⚠️ WASH SALE RULE</div>
            <div style={{fontSize:12,color:"#fed7aa",lineHeight:1.7}}>
              After selling any position for a tax loss, you <span style={{fontWeight:800,color:"#fb923c"}}>cannot repurchase the same or substantially identical security for 31 days</span> or the loss is disallowed. Plan your redeployment into ETFs or different tickers.
            </div>
          </div>

          <div style={{background:"#0a1628",border:"1px solid #1e3a5f",borderRadius:9,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#60a5fa",fontWeight:800,letterSpacing:1,marginBottom:8}}>📊 TAX LOSS SUMMARY</div>
            {PORTFOLIO.filter(p=>p.phase<=3).map(pos=>{
              const g=gl(pos);
              const loss = pos.dead?pos.costBasis*pos.qty:(g&&g.gl<0?Math.abs(g.gl):null);
              if(!loss&&!pos.dead) return null;
              return(
                <div key={pos.symbol} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #0f172a"}}>
                  <div>
                    <span style={{fontSize:12,fontWeight:700,color:"#f8fafc"}}>{pos.symbol}</span>
                    <span style={{fontSize:10,color:"#475569",marginLeft:6}}>{PHASE[pos.phase].action}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:"#f97316"}}>{loss?`-${fmt(loss,0)}`:"OTC – check Schwab"}</span>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid #1e293b"}}>
              <span style={{fontSize:12,fontWeight:800,color:"#f8fafc"}}>Total harvestable</span>
              <span style={{fontSize:14,fontWeight:900,color:"#f97316"}}>{fmt(harvestable,0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
