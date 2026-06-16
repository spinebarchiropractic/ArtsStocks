import { useState, useEffect, useRef } from "react";

const REFRESH_INTERVAL = 60;

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
const PHASE_LABELS = { 0:"Speculative",1:"Worthless",2:"Near-Dead",3:"Loss Harvest",4:"Trim Winner",5:"Core Keep" };
const PHASE_COLORS = { 0:"#f59e0b",1:"#6b7280",2:"#ef4444",3:"#fb7185",4:"#34d399",5:"#60a5fa" };
const VERDICT_COLOR = { SELL:"#ef4444",TRIM:"#f97316",HOLD:"#34d399","WRITE-OFF":"#6b7280" };

const f2  = n => n == null ? "—" : Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const f0  = n => n == null ? "—" : Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0});
const sgn = n => n >= 0 ? "+" : "-";

export default function App() {
  const [prices, setPrices]             = useState({});
  const [prevPrices, setPrevPrices]     = useState({});
  const [manualPrices, setManualPrices] = useState({});
  const [loadedCount, setLoadedCount]   = useState(0);
  const [failedSyms, setFailedSyms]     = useState(new Set());
  const [analysis, setAnalysis]         = useState({});
  const [aLoading, setALoading]         = useState({});
  const [portAnalysis, setPortAnalysis] = useState(null);
  const [portLoading, setPortLoading]   = useState(false);
  const [fetching, setFetching]         = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [countdown, setCountdown]       = useState(REFRESH_INTERVAL);
  const [filter, setFilter]             = useState("all");
  const [sortBy, setSortBy]             = useState("phase");
  const [expanded, setExpanded]         = useState(null);
  const [editing, setEditing]           = useState(null);
  const [editVal, setEditVal]           = useState("");
  const pricesRef = useRef({});

  const getPrice = sym => manualPrices[sym] ?? pricesRef.current[sym] ?? null;
  const getGL = pos => {
    if (pos.dead) return null;
    const p = getPrice(pos.symbol);
    if (p == null) return null;
    const cv = p * pos.qty, cb = pos.costBasis * pos.qty;
    return { gl:cv-cb, pct:((p-pos.costBasis)/pos.costBasis)*100, currentValue:cv };
  };

  const doFetch = async () => {
    setFetching(true);
    const targets = PORTFOLIO.filter(p => !p.dead && !MANUAL_ONLY.has(p.symbol)).map(p => p.symbol);
    const newPrices = {};
    const failed = new Set();

    await Promise.allSettled(targets.map(async sym => {
      try {
        // Calls our own /api/quote serverless function — no CORS issues
        const r = await fetch(`/api/quote?symbol=${sym}`);
        const d = await r.json();
        if (d.price && d.price > 0) newPrices[sym] = d.price;
        else failed.add(sym);
      } catch { failed.add(sym); }
    }));

    setPrevPrices({...pricesRef.current});
    pricesRef.current = {...pricesRef.current, ...newPrices};
    setPrices({...pricesRef.current});
    setLoadedCount(Object.keys(newPrices).length);
    setFailedSyms(failed);
    setLastUpdated(new Date().toLocaleTimeString());
    setCountdown(REFRESH_INTERVAL);
    setFetching(false);
  };

  useEffect(() => {
    doFetch();
    const iv = setInterval(doFetch, REFRESH_INTERVAL * 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c-1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const analyzePosition = async pos => {
    setALoading(p=>({...p,[pos.symbol]:true}));
    const price = getPrice(pos.symbol);
    const glData = getGL(pos);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:
            `Ruthless analyst. TAXABLE Schwab account, cleanup 35→15 positions. Analyze ${pos.symbol} (${pos.name}).
Cost: $${pos.costBasis}/sh | Qty: ${pos.qty} | Price: $${price??"unknown"} | G/L: ${glData?`$${glData.gl.toFixed(2)} (${glData.pct.toFixed(1)}%)`:"N/A"} | Phase: ${PHASE_LABELS[pos.phase]}
Search news + analyst targets. Return ONLY raw JSON (no markdown):
{"verdict":"SELL","confidence":75,"priceTarget":null,"catalyst":"one line","taxNote":"one line","reasoning":"2-3 sentences"}`
          }]
        })
      });
      const data = await res.json();
      const txt = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const m = txt.match(/\{[\s\S]*?"reasoning"[\s\S]*?\}/);
      if (m) { try { setAnalysis(p=>({...p,[pos.symbol]:JSON.parse(m[0])})); } catch(_){} }
    } catch(e){ console.error(e); }
    setALoading(p=>({...p,[pos.symbol]:false}));
  };

  const runPortfolioAnalysis = async () => {
    setPortLoading(true);
    const summary = PORTFOLIO.map(p => {
      const g = getGL(p);
      return `${p.symbol} phase=${p.phase} qty=${p.qty} cost=$${p.costBasis} gl=${g?`${sgn(g.gl)}$${f0(g.gl)}`:"dead/unknown"}`;
    }).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:
            `Ruthless portfolio strategist. Taxable Schwab, cleanup 35→15 positions, June 2026. Search current market conditions. 3-4 sentence strategic brief on priorities THIS WEEK. No hedging. End with single most important action.\n\n${summary}`
          }]
        })
      });
      const data = await res.json();
      setPortAnalysis(data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"");
    } catch(e){ console.error(e); }
    setPortLoading(false);
  };

  const SNAP = {BDRBF:3028.20,AAPL:1540.86,MSFT:1240.20,VZ:1252.85,VICI:562.81,SCHD:851.57,USO:799.27,RGTI:530.38,SOFI:441.00,NEM:385.14,NVDA:418.77,OSS:993.00,DRUG:291.25,JETS:313.21,CCL:306.75,CRON:129.75,KORE:137.78,SPCB:121.90,B:429.75,S:225.70,ACHR:108.70,STI:40.95,LCID:5.05,UP:8.00,CYCU:23.97,MBIO:3.49,BTCWF:12.51};
  const totalValue = PORTFOLIO.reduce((a,p)=>{const g=getGL(p);return a+(g?g.currentValue:(SNAP[p.symbol]||0));},0);
  const totalGL    = PORTFOLIO.reduce((a,p)=>{const g=getGL(p);return a+(g?g.gl:0);},0);

  const filtered = PORTFOLIO.filter(p=>{
    if(filter==="all")      return true;
    if(filter==="losers")   {const g=getGL(p);return g&&g.gl<0;}
    if(filter==="winners")  {const g=getGL(p);return g&&g.gl>0;}
    if(filter==="dead")     return p.dead||p.phase<=2;
    if(filter==="analyzed") return !!analysis[p.symbol];
    return true;
  });
  const sorted = [...filtered].sort((a,b)=>{
    if(sortBy==="phase")  return a.phase-b.phase;
    if(sortBy==="gl$")    {const ga=getGL(a),gb=getGL(b);return (ga?.gl||0)-(gb?.gl||0);}
    if(sortBy==="gl%")    {const ga=getGL(a),gb=getGL(b);return (ga?.pct||0)-(gb?.pct||0);}
    if(sortBy==="value")  {const ga=getGL(a),gb=getGL(b);return (gb?.currentValue||0)-(ga?.currentValue||0);}
    return 0;
  });

  const flash = sym=>{const c=prices[sym],p=prevPrices[sym];if(!c||!p||c===p)return{};return{color:c>p?"#34d399":"#ef4444"};};
  const Btn=({active,onClick,children,ac="#1d4ed8"})=>(
    <button onClick={onClick} style={{background:active?ac:"#1e293b",color:active?"#fff":"#64748b",border:"none",borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
      {children}
    </button>
  );

  return (
    <div style={{background:"#060a14",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:500,margin:"0 auto"}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(160deg,#0f172a,#1a1040)",padding:"18px 16px 14px",borderBottom:"1px solid #1e293b",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:"#475569",letterSpacing:2,textTransform:"uppercase"}}>Schwab · Taxable · Individual</div>
            <div style={{fontSize:20,fontWeight:900,color:"#f8fafc",letterSpacing:-0.5}}>Portfolio Command</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:fetching?"#f59e0b":"#34d399",marginBottom:3}}>
              {fetching?"● Fetching...":`● Live · ${countdown}s`}
            </div>
            <button onClick={doFetch} disabled={fetching}
              style={{background:"#1e293b",color:fetching?"#374151":"#94a3b8",border:"1px solid #334155",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:fetching?"default":"pointer"}}>
              ↻ Refresh Now
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[
            {label:"Portfolio Value",val:`$${f0(totalValue)}`,color:"#f8fafc"},
            {label:"Unrealized G/L", val:`${sgn(totalGL)}$${f0(Math.abs(totalGL))}`,color:totalGL>=0?"#34d399":"#ef4444"},
            {label:"Positions",      val:`${PORTFOLIO.length} → 15`,color:"#94a3b8"},
          ].map(s=>(
            <div key={s.label} style={{background:"#0f172a",borderRadius:7,padding:"8px 10px",border:"1px solid #1e293b"}}>
              <div style={{fontSize:9,color:"#475569",marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
              <div style={{fontSize:14,fontWeight:800,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>
        {lastUpdated&&<div style={{fontSize:9,color:"#334155",marginTop:6}}>Updated: {lastUpdated} · Auto-refreshes every 60s · {loadedCount} live · {failedSyms.size} manual</div>}
      </div>

      {/* STRATEGY */}
      <div style={{padding:"12px 16px 0"}}>
        <button onClick={runPortfolioAnalysis} disabled={portLoading}
          style={{width:"100%",background:portLoading?"#1e293b":"linear-gradient(90deg,#6d28d9,#4338ca)",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontSize:13,fontWeight:800,cursor:portLoading?"default":"pointer"}}>
          {portLoading?"⟳ Analyzing portfolio...":"⚡ Run Portfolio Strategy Brief"}
        </button>
        {portAnalysis&&(
          <div style={{background:"#160f2e",border:"1px solid #4c1d95",borderRadius:8,padding:14,marginTop:8,fontSize:12,lineHeight:1.75,color:"#c4b5fd"}}>
            <div style={{fontSize:9,color:"#7c3aed",fontWeight:800,letterSpacing:1,marginBottom:6}}>STRATEGY BRIEF</div>
            {portAnalysis}
          </div>
        )}
      </div>

      {/* FILTERS */}
      <div style={{padding:"12px 16px 0"}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
          <Btn active={filter==="all"}      onClick={()=>setFilter("all")}>All</Btn>
          <Btn active={filter==="losers"}   onClick={()=>setFilter("losers")}>🔴 Losers</Btn>
          <Btn active={filter==="winners"}  onClick={()=>setFilter("winners")}>🟢 Winners</Btn>
          <Btn active={filter==="dead"}     onClick={()=>setFilter("dead")}>💀 Dead</Btn>
          <Btn active={filter==="analyzed"} onClick={()=>setFilter("analyzed")}>✓ Analyzed</Btn>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <span style={{fontSize:9,color:"#475569",marginRight:2}}>SORT</span>
          <Btn active={sortBy==="phase"} onClick={()=>setSortBy("phase")} ac="#0f766e">Phase</Btn>
          <Btn active={sortBy==="gl$"}   onClick={()=>setSortBy("gl$")}   ac="#0f766e">G/L $</Btn>
          <Btn active={sortBy==="gl%"}   onClick={()=>setSortBy("gl%")}   ac="#0f766e">G/L %</Btn>
          <Btn active={sortBy==="value"} onClick={()=>setSortBy("value")} ac="#0f766e">Value</Btn>
        </div>
      </div>

      {/* CARDS */}
      <div style={{padding:"12px 16px 0"}}>
        {sorted.map(pos=>{
          const price=getPrice(pos.symbol),glData=getGL(pos),a=analysis[pos.symbol];
          const open=expanded===pos.symbol,sym=pos.symbol,hasMan=manualPrices[sym]!=null;
          const isManOnly=MANUAL_ONLY.has(sym)||pos.dead;

          return(
            <div key={sym} style={{background:"#0d1424",border:`1px solid ${open?"#3b82f6":"#1a2540"}`,borderRadius:10,marginBottom:7,overflow:"hidden"}}>
              <div onClick={()=>setExpanded(open?null:sym)} style={{padding:"11px 13px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:15,fontWeight:900,color:"#f8fafc"}}>{sym}</span>
                    <span style={{background:PHASE_COLORS[pos.phase]+"22",color:PHASE_COLORS[pos.phase],border:`1px solid ${PHASE_COLORS[pos.phase]}44`,borderRadius:4,fontSize:9,fontWeight:700,padding:"1px 6px"}}>{PHASE_LABELS[pos.phase]}</span>
                    {a&&<span style={{background:(VERDICT_COLOR[a.verdict]||"#94a3b8")+"22",color:VERDICT_COLOR[a.verdict]||"#94a3b8",border:`1px solid ${VERDICT_COLOR[a.verdict]||"#94a3b8"}44`,borderRadius:4,fontSize:9,fontWeight:800,padding:"1px 6px"}}>{a.verdict}</span>}
                  </div>
                  <div style={{fontSize:10,color:"#475569",marginBottom:3}}>{pos.name}</div>
                  <div style={{fontSize:10,color:"#334155"}}>Qty {pos.qty} · Cost ${pos.costBasis}</div>
                </div>
                <div style={{textAlign:"right",minWidth:100,flexShrink:0}}>
                  {pos.dead?(
                    <div style={{fontSize:11,color:"#374151",fontWeight:700}}>WORTHLESS</div>
                  ):price!=null?(
                    <>
                      <div style={{fontSize:15,fontWeight:800,...(hasMan?{color:"#f59e0b"}:{color:"#f8fafc",...flash(sym)})}}>${f2(price)}</div>
                      {glData&&<div style={{fontSize:11,fontWeight:700,color:glData.gl>=0?"#34d399":"#ef4444"}}>{sgn(glData.gl)}${f0(glData.gl)} ({sgn(glData.pct)}{f2(Math.abs(glData.pct))}%)</div>}
                      {hasMan&&<div style={{fontSize:8,color:"#78716c"}}>manual</div>}
                    </>
                  ):(
                    <div style={{fontSize:10,color:isManOnly?"#4b5563":"#374151"}}>{fetching?"loading…":"tap to set price"}</div>
                  )}
                </div>
              </div>

              {open&&(
                <div style={{borderTop:"1px solid #1a2540",padding:"12px 13px",background:"#080c18"}}>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:9,color:"#475569",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>
                      {isManOnly?"Enter Current Price":"Manual Price Override"}
                    </div>
                    {editing===sym?(
                      <div style={{display:"flex",gap:6}}>
                        <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter"){setManualPrices(p=>({...p,[sym]:parseFloat(editVal)}));setEditing(null);}}}
                          placeholder="e.g. 1.23" autoFocus
                          style={{flex:1,background:"#1e293b",border:"1px solid #334155",borderRadius:6,padding:"7px 10px",color:"#f8fafc",fontSize:13}}/>
                        <button onClick={()=>{setManualPrices(p=>({...p,[sym]:parseFloat(editVal)}));setEditing(null);}}
                          style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:6,padding:"7px 13px",fontSize:12,cursor:"pointer"}}>Set</button>
                        <button onClick={()=>{const n={...manualPrices};delete n[sym];setManualPrices(n);setEditing(null);}}
                          style={{background:"#1e293b",color:"#6b7280",border:"none",borderRadius:6,padding:"7px 10px",fontSize:12,cursor:"pointer"}}>Clear</button>
                      </div>
                    ):(
                      <button onClick={()=>{setEditing(sym);setEditVal(price?.toString()||"");}}
                        style={{background:"#1e293b",color:"#64748b",border:"1px solid #334155",borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>
                        {hasMan?`$${manualPrices[sym]} · Edit`:"Set price manually"}
                      </button>
                    )}
                  </div>
                  {a?(
                    <div style={{background:"#0f172a",borderRadius:8,padding:12,border:`1px solid ${VERDICT_COLOR[a.verdict]||"#334155"}44`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:17,fontWeight:900,color:VERDICT_COLOR[a.verdict]||"#94a3b8"}}>→ {a.verdict}</span>
                        <div style={{fontSize:11,color:"#64748b",textAlign:"right"}}>
                          {a.priceTarget&&<div>Target: ${a.priceTarget}</div>}
                          <div>Confidence: {a.confidence}%</div>
                        </div>
                      </div>
                      <div style={{fontSize:12,color:"#cbd5e1",lineHeight:1.65,marginBottom:10}}>{a.reasoning}</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
                        {[["CATALYST / RISK",a.catalyst],["TAX NOTE",a.taxNote]].map(([lbl,val])=>(
                          <div key={lbl} style={{background:"#1e293b",borderRadius:6,padding:"7px 9px"}}>
                            <div style={{fontSize:8,color:"#475569",marginBottom:3,letterSpacing:0.5}}>{lbl}</div>
                            <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>{val}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={()=>analyzePosition(pos)} disabled={aLoading[sym]}
                        style={{width:"100%",background:"#1e293b",color:"#475569",border:"none",borderRadius:6,padding:"7px",fontSize:11,cursor:"pointer"}}>
                        {aLoading[sym]?"Re-analyzing…":"↻ Refresh Analysis"}
                      </button>
                    </div>
                  ):(
                    <button onClick={()=>analyzePosition(pos)} disabled={aLoading[sym]}
                      style={{width:"100%",background:aLoading[sym]?"#1e293b":"linear-gradient(90deg,#0f766e,#0369a1)",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontSize:13,fontWeight:800,cursor:aLoading[sym]?"default":"pointer"}}>
                      {aLoading[sym]?`Analyzing ${sym}…`:`⚡ Analyze ${sym} — Keep or Sell?`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LEGEND */}
      <div style={{padding:"16px 16px 48px"}}>
        <div style={{background:"#0d1424",border:"1px solid #1a2540",borderRadius:8,padding:12}}>
          <div style={{fontSize:9,color:"#334155",marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Cleanup Phases</div>
          {Object.entries(PHASE_LABELS).map(([p,l])=>(
            <div key={p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:PHASE_COLORS[p],flexShrink:0}}/>
              <span style={{fontSize:10,color:"#475569"}}>Phase {p}: {l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
