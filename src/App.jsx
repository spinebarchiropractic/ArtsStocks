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

// Default verdicts based on phase — overridden by AI analysis if run
const DEFAULT_VERDICT = { 0:"SPECULATIVE", 1:"WRITE OFF", 2:"SELL", 3:"SELL", 4:"TRIM", 5:"HOLD" };
const VERDICT_COLOR   = { "HOLD":"#22c55e", "TRIM":"#f59e0b", "SELL":"#ef4444", "WRITE OFF":"#6b7280", "SPECULATIVE":"#a855f7", "WRITE-OFF":"#6b7280" };
const PHASE_LABELS    = { 0:"Speculative", 1:"Write Off", 2:"Sell Now", 3:"Harvest Loss", 4:"Trim", 5:"Hold" };

const MANUAL_ONLY = new Set(["SEEK","SSTY","BTCWF","WAGP","SESEN","BAIYU","MMATQ","VEVMQ","CARM","CYCU","MBIO","BDRBF","OSS","DRUG","STI","KORE","SPCB","UP"]);

const usd  = (n, dec=2) => n == null ? "—" : "$" + Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec});
const pct  = (n) => n == null ? "—" : (n>=0?"+":"-") + Math.abs(n).toFixed(1) + "%";
const sgn  = (n) => n >= 0 ? "+" : "-";

export default function App() {
  const [prices, setPrices]             = useState({});
  const [manualPrices, setManualPrices] = useState({});
  const [analysis, setAnalysis]         = useState({});
  const [aLoading, setALoading]         = useState({});
  const [portAnalysis, setPortAnalysis] = useState(null);
  const [portLoading, setPortLoading]   = useState(false);
  const [fetching, setFetching]         = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [countdown, setCountdown]       = useState(REFRESH_INTERVAL);
  const [filter, setFilter]             = useState("all");
  const [editingPrice, setEditingPrice] = useState(null);
  const [editVal, setEditVal]           = useState("");
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);
  const pricesRef = useRef({});

  const getPrice = sym => manualPrices[sym] ?? pricesRef.current[sym] ?? null;
  const getGL = pos => {
    if (pos.dead) return null;
    const p = getPrice(pos.symbol);
    if (p == null) return null;
    const cv = p * pos.qty, cb = pos.costBasis * pos.qty;
    return { price:p, gl:cv-cb, pct:((p-pos.costBasis)/pos.costBasis)*100, currentValue:cv, costValue:cb };
  };

  const doFetch = async () => {
    setFetching(true);
    const targets = PORTFOLIO.filter(p => !p.dead && !MANUAL_ONLY.has(p.symbol)).map(p => p.symbol);
    const newPrices = {};
    await Promise.allSettled(targets.map(async sym => {
      try {
        const r = await fetch(`/api/quote?symbol=${sym}`);
        const d = await r.json();
        if (d.price && d.price > 0) newPrices[sym] = d.price;
      } catch {}
    }));
    pricesRef.current = { ...pricesRef.current, ...newPrices };
    setPrices({ ...pricesRef.current });
    setLastUpdated(new Date().toLocaleTimeString());
    setCountdown(REFRESH_INTERVAL);
    setFetching(false);
  };

  useEffect(() => { doFetch(); const iv = setInterval(doFetch, REFRESH_INTERVAL*1000); return ()=>clearInterval(iv); }, []);
  useEffect(() => { const t = setInterval(()=>setCountdown(c=>c>0?c-1:0),1000); return ()=>clearInterval(t); }, []);

  const analyzePosition = async pos => {
    setALoading(p=>({...p,[pos.symbol]:true}));
    const gl = getGL(pos);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:800,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:
            `Analyze ${pos.symbol} (${pos.name}) for a taxable Schwab account doing a 35→15 position cleanup.
Cost: $${pos.costBasis}/sh | Qty: ${pos.qty} | Price: $${gl?.price??"unknown"} | G/L: ${gl?`${sgn(gl.gl)}$${Math.abs(gl.gl).toFixed(0)} (${gl.pct.toFixed(1)}%)`:"N/A"} | Action: ${PHASE_LABELS[pos.phase]}
Search latest news and analyst targets. Return ONLY raw JSON:
{"verdict":"SELL","confidence":80,"priceTarget":null,"reasoning":"2 sentences max","taxNote":"wash sale or tax note"}`
          }]
        })
      });
      const data = await res.json();
      const txt = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const m = txt.match(/\{[\s\S]*?"reasoning"[\s\S]*?\}/);
      if (m) { try { setAnalysis(p=>({...p,[pos.symbol]:JSON.parse(m[0])})); setExpandedAnalysis(pos.symbol); } catch(_){} }
    } catch(e){ console.error(e); }
    setALoading(p=>({...p,[pos.symbol]:false}));
  };

  const runPortfolioAnalysis = async () => {
    setPortLoading(true);
    const summary = PORTFOLIO.map(p => {
      const g = getGL(p);
      return `${p.symbol} action=${PHASE_LABELS[p.phase]} cost=$${p.costBasis} gl=${g?`${sgn(g.gl)}$${Math.abs(g.gl).toFixed(0)}`:"dead"}`;
    }).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:800,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:
            `Taxable Schwab account, cleanup 35→15 positions, June 2026. Search market conditions. Give 3 sentence brief on what to do THIS WEEK. Be direct. End with the single most important action.\n\n${summary}`
          }]
        })
      });
      const data = await res.json();
      setPortAnalysis(data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"");
    } catch(e){ console.error(e); }
    setPortLoading(false);
  };

  const SNAP = {BDRBF:216.00,AAPL:1540.86,MSFT:1240.20,VZ:1252.85,VICI:562.81,SCHD:851.57,USO:799.27,RGTI:530.38,SOFI:441.00,NEM:385.14,NVDA:418.77,OSS:993.00,DRUG:291.25,JETS:313.21,CCL:306.75,CRON:129.75,KORE:137.78,SPCB:121.90,B:429.75,S:225.70,ACHR:108.70,STI:40.95,LCID:5.05,UP:8.00,CYCU:23.97,MBIO:3.49,BTCWF:12.51};
  const totalValue = PORTFOLIO.reduce((a,p)=>{const g=getGL(p);return a+(g?g.currentValue:(SNAP[p.symbol]||0));},0);
  const totalGL    = PORTFOLIO.reduce((a,p)=>{const g=getGL(p);return a+(g?g.gl:0);},0);
  const liveCount  = Object.keys(pricesRef.current).length;

  const groups = [
    { label:"🔴 Sell / Write Off", phases:[1,2,3], color:"#ef4444" },
    { label:"🟡 Trim", phases:[4], color:"#f59e0b" },
    { label:"🟢 Hold", phases:[5], color:"#22c55e" },
    { label:"⚡ Speculative", phases:[0], color:"#a855f7" },
  ];

  const visiblePositions = filter === "all"
    ? PORTFOLIO
    : filter === "losers"  ? PORTFOLIO.filter(p=>{const g=getGL(p);return g&&g.gl<0;})
    : filter === "winners" ? PORTFOLIO.filter(p=>{const g=getGL(p);return g&&g.gl>0;})
    : PORTFOLIO;

  const verdict = pos => {
    const a = analysis[pos.symbol];
    return a?.verdict || DEFAULT_VERDICT[pos.phase] || "HOLD";
  };

  return (
    <div style={{background:"#0a0f1e",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",maxWidth:540,margin:"0 auto",paddingBottom:40}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(160deg,#0f172a,#1a1040)",padding:"16px 16px 14px",borderBottom:"1px solid #1e293b",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:9,color:"#475569",letterSpacing:2,textTransform:"uppercase"}}>Schwab · Taxable · Individual</div>
            <div style={{fontSize:19,fontWeight:900,color:"#f8fafc",letterSpacing:-0.5}}>Portfolio Command</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:fetching?"#f59e0b":"#34d399",marginBottom:3}}>{fetching?"● Updating...": `● Live · ${countdown}s`}</div>
            <button onClick={doFetch} disabled={fetching}
              style={{background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
          {[
            {label:"Total Value",    val:usd(totalValue,0),                                      color:"#f8fafc"},
            {label:"Total P&L",      val:`${sgn(totalGL)}${usd(Math.abs(totalGL),0)}`,           color:totalGL>=0?"#22c55e":"#ef4444"},
            {label:"Positions",      val:`${PORTFOLIO.length} → 15`,                             color:"#94a3b8"},
          ].map(s=>(
            <div key={s.label} style={{background:"#0f172a",borderRadius:7,padding:"8px 10px",border:"1px solid #1e293b"}}>
              <div style={{fontSize:9,color:"#475569",marginBottom:2,textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</div>
              <div style={{fontSize:13,fontWeight:800,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>
        {lastUpdated&&<div style={{fontSize:9,color:"#334155"}}>Updated {lastUpdated} · {liveCount} live prices · manual entry available per position</div>}
      </div>

      {/* STRATEGY BRIEF */}
      <div style={{padding:"12px 16px 0"}}>
        <button onClick={runPortfolioAnalysis} disabled={portLoading}
          style={{width:"100%",background:portLoading?"#1e293b":"linear-gradient(90deg,#6d28d9,#4338ca)",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
          {portLoading?"⟳ Analyzing...":"⚡ This Week's Strategy Brief"}
        </button>
        {portAnalysis&&(
          <div style={{background:"#160f2e",border:"1px solid #4c1d95",borderRadius:8,padding:14,marginTop:8,fontSize:12,lineHeight:1.75,color:"#c4b5fd"}}>
            <div style={{fontSize:9,color:"#7c3aed",fontWeight:800,letterSpacing:1,marginBottom:6}}>STRATEGY</div>
            {portAnalysis}
          </div>
        )}
      </div>

      {/* FILTER */}
      <div style={{padding:"10px 16px 0",display:"flex",gap:6}}>
        {[["all","All"],["winners","🟢 Winners"],["losers","🔴 Losers"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{background:filter===v?"#1d4ed8":"#1e293b",color:filter===v?"#fff":"#64748b",border:"none",borderRadius:5,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {/* POSITION GROUPS */}
      {groups.map(group => {
        const positions = visiblePositions.filter(p => group.phases.includes(p.phase));
        if (positions.length === 0) return null;
        return (
          <div key={group.label} style={{padding:"14px 16px 0"}}>
            <div style={{fontSize:11,fontWeight:800,color:group.color,letterSpacing:1,textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              {group.label}
              <div style={{flex:1,height:1,background:group.color+"33"}}/>
            </div>

            {positions.map(pos => {
              const gl      = getGL(pos);
              const v       = verdict(pos);
              const vColor  = VERDICT_COLOR[v] || "#94a3b8";
              const a       = analysis[pos.symbol];
              const showAI  = expandedAnalysis === pos.symbol;
              const price   = getPrice(pos.symbol);
              const hasMan  = manualPrices[pos.symbol] != null;
              const noPrice = !pos.dead && price == null;

              return (
                <div key={pos.symbol} style={{background:"#0d1424",border:`1px solid #1a2540`,borderRadius:10,marginBottom:6,overflow:"hidden"}}>

                  {/* MAIN ROW */}
                  <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center"}}>

                    {/* VERDICT badge */}
                    <div style={{background:vColor+"22",border:`1px solid ${vColor}55`,borderRadius:6,padding:"4px 8px",textAlign:"center",minWidth:62}}>
                      <div style={{fontSize:9,fontWeight:900,color:vColor,letterSpacing:0.5}}>{v}</div>
                    </div>

                    {/* Ticker + name + cost */}
                    <div>
                      <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                        <span style={{fontSize:15,fontWeight:900,color:"#f8fafc"}}>{pos.symbol}</span>
                        <span style={{fontSize:10,color:"#475569"}}>{pos.name}</span>
                      </div>
                      <div style={{fontSize:10,color:"#475569",marginTop:1}}>
                        {pos.dead ? (
                          <span style={{color:"#6b7280"}}>Cost: {usd(pos.costBasis)} × {pos.qty} · Worthless</span>
                        ) : (
                          <span>Cost {usd(pos.costBasis)}/sh · {pos.qty} shares · Paid {usd(pos.costBasis * pos.qty, 0)}</span>
                        )}
                      </div>
                    </div>

                    {/* Price + P&L */}
                    <div style={{textAlign:"right",minWidth:90}}>
                      {pos.dead ? (
                        <div style={{fontSize:11,color:"#4b5563",fontWeight:700}}>—</div>
                      ) : gl ? (
                        <>
                          <div style={{fontSize:15,fontWeight:800,color:hasMan?"#f59e0b":"#f8fafc"}}>{usd(gl.price)}</div>
                          <div style={{fontSize:11,fontWeight:700,color:gl.gl>=0?"#22c55e":"#ef4444"}}>
                            {sgn(gl.gl)}{usd(Math.abs(gl.gl),0)} ({pct(gl.pct)})
                          </div>
                        </>
                      ) : noPrice ? (
                        <div>
                          {editingPrice===pos.symbol ? (
                            <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                              <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Enter"){setManualPrices(p=>({...p,[pos.symbol]:parseFloat(editVal)}));setEditingPrice(null);}}}
                                placeholder="price" autoFocus
                                style={{width:64,background:"#1e293b",border:"1px solid #334155",borderRadius:5,padding:"4px 6px",color:"#f8fafc",fontSize:12,textAlign:"right"}}/>
                              <button onClick={()=>{setManualPrices(p=>({...p,[pos.symbol]:parseFloat(editVal)}));setEditingPrice(null);}}
                                style={{background:"#1d4ed8",color:"#fff",border:"none",borderRadius:5,padding:"4px 7px",fontSize:11,cursor:"pointer"}}>✓</button>
                            </div>
                          ) : (
                            <button onClick={()=>{setEditingPrice(pos.symbol);setEditVal("");}}
                              style={{background:"#1e293b",color:"#475569",border:"1px dashed #334155",borderRadius:5,padding:"3px 8px",fontSize:10,cursor:"pointer"}}>
                              + price
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* AI ANALYSIS ROW (collapsed by default, expands after analysis) */}
                  {!pos.dead && (
                    <div style={{borderTop:"1px solid #1a2540",padding:"8px 14px",background:"#080c18",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                      {showAI && a ? (
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.6,marginBottom:4}}>{a.reasoning}</div>
                          <div style={{fontSize:10,color:"#64748b"}}>{a.taxNote}</div>
                          {a.priceTarget && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Target: ${a.priceTarget}</div>}
                          <button onClick={()=>setExpandedAnalysis(null)} style={{marginTop:6,background:"none",border:"none",color:"#475569",fontSize:10,cursor:"pointer"}}>▲ collapse</button>
                        </div>
                      ) : a ? (
                        <button onClick={()=>setExpandedAnalysis(pos.symbol)} style={{background:"none",border:"none",color:"#475569",fontSize:10,cursor:"pointer",textAlign:"left"}}>
                          ▼ AI: {a.verdict} · {a.confidence}% confidence · tap to expand
                        </button>
                      ) : (
                        <button onClick={()=>analyzePosition(pos)} disabled={aLoading[pos.symbol]}
                          style={{background:"none",border:"none",color:aLoading[pos.symbol]?"#374151":"#3b82f6",fontSize:11,cursor:"pointer",padding:0}}>
                          {aLoading[pos.symbol]?`Analyzing ${pos.symbol}…`:"⚡ Get AI verdict"}
                        </button>
                      )}
                      {a && <span style={{fontSize:9,color:VERDICT_COLOR[a.verdict]||"#94a3b8",fontWeight:800}}>{a.verdict} {a.confidence}%</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
