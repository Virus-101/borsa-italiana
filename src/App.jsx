import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, Star, Search, X, Bell, Activity, BarChart2, Layers, Clock, RefreshCw, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ── Initial stock data ───────────────────────────────────────────────────────
const INITIAL_STOCKS = [
  { symbol: "UCG.MI", name: "UniCredit", price: 74.66, change: 1.50, changePercent: 2.05, volume: 4985323, marketCap: 111732441088, high: 74.76, low: 73.18, open: 73.71, previousClose: 73.16, sector: "Bancario" },
  { symbol: "ISP.MI", name: "Intesa Sanpaolo", price: 5.838, change: 0.114, changePercent: 1.99, volume: 40967632, marketCap: 101500993536, high: 5.838, low: 5.749, open: 5.76, previousClose: 5.724, sector: "Bancario" },
  { symbol: "ENEL.MI", name: "Enel", price: 9.291, change: 0.065, changePercent: 0.70, volume: 22833115, marketCap: 93201612800, high: 9.448, low: 9.226, open: 9.226, previousClose: 9.226, sector: "Energia" },
  { symbol: "RACE.MI", name: "Ferrari", price: 310.1, change: -8.20, changePercent: -2.58, volume: 703522, marketCap: 54914277376, high: 316.4, low: 308.4, open: 316.2, previousClose: 318.3, sector: "Auto" },
  { symbol: "ENI.MI", name: "Eni", price: 15.90, change: 0.18, changePercent: 1.14, volume: 12450000, marketCap: 48200000000, high: 16.10, low: 15.75, open: 15.72, previousClose: 15.72, sector: "Energia" },
  { symbol: "STM.MI", name: "STMicroelectronics", price: 24.15, change: -0.45, changePercent: -1.83, volume: 8234000, marketCap: 21500000000, high: 24.80, low: 23.90, open: 24.60, previousClose: 24.60, sector: "Tech" },
  { symbol: "TIT.MI", name: "Telecom Italia", price: 0.2534, change: 0.0034, changePercent: 1.36, volume: 98340000, marketCap: 3800000000, high: 0.2561, low: 0.2490, open: 0.2500, previousClose: 0.2500, sector: "Telecom" },
  { symbol: "BAMI.MI", name: "Banco BPM", price: 8.42, change: 0.22, changePercent: 2.68, volume: 16780000, marketCap: 9800000000, high: 8.50, low: 8.21, open: 8.23, previousClose: 8.20, sector: "Bancario" },
  { symbol: "G.MI", name: "Assicurazioni Generali", price: 27.80, change: 0.34, changePercent: 1.24, volume: 5430000, marketCap: 44700000000, high: 27.95, low: 27.50, open: 27.46, previousClose: 27.46, sector: "Assicurazioni" },
  { symbol: "MB.MI", name: "Mediobanca", price: 18.90, change: 0.28, changePercent: 1.50, volume: 4120000, marketCap: 15600000000, high: 19.10, low: 18.75, open: 18.64, previousClose: 18.62, sector: "Bancario" },
  { symbol: "MONC.MI", name: "Moncler", price: 52.30, change: -1.10, changePercent: -2.06, volume: 1240000, marketCap: 14200000000, high: 53.50, low: 52.10, open: 53.40, previousClose: 53.40, sector: "Lusso" },
  { symbol: "LDO.MI", name: "Leonardo", price: 29.15, change: 0.85, changePercent: 3.00, volume: 3980000, marketCap: 16500000000, high: 29.30, low: 28.35, open: 28.30, previousClose: 28.30, sector: "Difesa" },
  { symbol: "PRY.MI", name: "Prysmian", price: 55.20, change: -0.80, changePercent: -1.43, volume: 2100000, marketCap: 14800000000, high: 56.20, low: 55.00, open: 56.00, previousClose: 56.00, sector: "Industria" },
  { symbol: "AZM.MI", name: "Azimut Holding", price: 22.40, change: 0.40, changePercent: 1.82, volume: 980000, marketCap: 3500000000, high: 22.60, low: 22.10, open: 22.00, previousClose: 22.00, sector: "Finanziario" },
  { symbol: "STLAM.MI", name: "Stellantis", price: 13.88, change: -0.32, changePercent: -2.25, volume: 18900000, marketCap: 43200000000, high: 14.25, low: 13.80, open: 14.20, previousClose: 14.20, sector: "Auto" },
];

const INITIAL_INDEX = { price: 46361.09, change: 597.02, changePercent: 1.30 };

const INITIAL_HISTORY = [
  44713, 44488, 45091, 44832, 44950, 45440, 45139, 45076, 45527,
  46005, 46421, 46636, 45820, 45877, 46823, 46803, 46511, 46223,
  45431, 45419, 45764, 46361,
].map((v, i) => ({ t: i, v }));

// ── Utility helpers ───────────────────────────────────────────────────────────
const fmt = (n, dec = 2) => n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtPrice = (p) => p < 1 ? fmt(p, 4) : fmt(p, 2);
const fmtVol = (v) => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v;
const fmtCap = (v) => !v ? "—" : v >= 1e12 ? `€${(v/1e12).toFixed(2)}T` : v >= 1e9 ? `€${(v/1e9).toFixed(1)}B` : `€${(v/1e6).toFixed(0)}M`;

function randomWalk(price, volatility = 0.0015) {
  const delta = price * volatility * (Math.random() * 2 - 1);
  return Math.max(price * 0.85, price + delta);
}

// ── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, positive }) {
  const color = positive ? "#00ff94" : "#ff4d6d";
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Ticker tape ───────────────────────────────────────────────────────────────
function TickerTape({ stocks }) {
  const items = [...stocks, ...stocks];
  return (
    <div style={{ overflow: "hidden", background: "#0a0a0f", borderBottom: "1px solid #1a1a2e", height: 32, display: "flex", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 0, animation: "ticker 60s linear infinite", whiteSpace: "nowrap" }}>
        {items.map((s, i) => {
          const pos = s.changePercent >= 0;
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 18px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", borderRight: "1px solid #1a1a2e" }}>
              <span style={{ color: "#8b8fa8" }}>{s.symbol.replace(".MI", "")}</span>
              <span style={{ color: "#e2e8f0" }}>€{fmtPrice(s.price)}</span>
              <span style={{ color: pos ? "#00ff94" : "#ff4d6d" }}>{pos ? "▲" : "▼"} {Math.abs(s.changePercent).toFixed(2)}%</span>
            </span>
          );
        })}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ── Alert flash overlay ───────────────────────────────────────────────────────
function FlashAlert({ alerts }) {
  if (!alerts.length) return null;
  return (
    <div style={{ position: "fixed", top: 48, right: 20, zIndex: 999, display: "flex", flexDirection: "column", gap: 8 }}>
      {alerts.map((a, i) => (
        <div key={i} style={{ background: a.positive ? "rgba(0,255,148,0.12)" : "rgba(255,77,109,0.12)", border: `1px solid ${a.positive ? "#00ff94" : "#ff4d6d"}`, borderRadius: 6, padding: "8px 14px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: a.positive ? "#00ff94" : "#ff4d6d", backdropFilter: "blur(8px)", boxShadow: `0 0 12px ${a.positive ? "rgba(0,255,148,0.2)" : "rgba(255,77,109,0.2)"}` }}>
          <span style={{ opacity: 0.7, marginRight: 8 }}>⚡</span>{a.text}
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [stocks, setStocks] = useState(() => INITIAL_STOCKS.map(s => ({ ...s, history: Array.from({ length: 20 }, (_, i) => ({ v: s.price * (0.97 + 0.03 * i / 19) })) })));
  const [indexData, setIndexData] = useState(INITIAL_INDEX);
  const [indexHistory, setIndexHistory] = useState(INITIAL_HISTORY);
  const [watchlist, setWatchlist] = useState(["UCG.MI", "RACE.MI", "LDO.MI"]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("changePercent");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeTab, setActiveTab] = useState("market");
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [flashSymbols, setFlashSymbols] = useState({});
  const alertTimers = useRef({});

  // ── Live simulation ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastUpdate(now);
      const newFlash = {};
      setStocks(prev => prev.map(s => {
        const newPrice = randomWalk(s.price, 0.0008);
        const delta = newPrice - s.previousClose;
        const deltaP = (delta / s.previousClose) * 100;
        const newHistory = [...s.history.slice(-19), { v: newPrice }];
        // big move alert
        if (Math.abs(newPrice - s.price) / s.price > 0.003) {
          const positive = newPrice > s.price;
          newFlash[s.symbol] = positive ? "up" : "down";
          const alertText = `${s.symbol.replace(".MI","")} ${positive ? "▲" : "▼"} ${Math.abs(((newPrice-s.price)/s.price)*100).toFixed(2)}%`;
          setAlerts(a => [...a.slice(-2), { text: alertText, positive }]);
          if (alertTimers.current[s.symbol]) clearTimeout(alertTimers.current[s.symbol]);
          alertTimers.current[s.symbol] = setTimeout(() => setAlerts(a => a.slice(1)), 3500);
        }
        return { ...s, price: newPrice, change: delta, changePercent: deltaP, history: newHistory };
      }));
      setFlashSymbols(newFlash);
      setTimeout(() => setFlashSymbols({}), 400);
      // update index
      setIndexData(prev => {
        const newPrice = randomWalk(prev.price, 0.0005);
        const delta = newPrice - INITIAL_INDEX.price;
        return { price: newPrice, change: delta, changePercent: (delta / INITIAL_INDEX.price) * 100 };
      });
      setIndexHistory(prev => [...prev.slice(-21), { t: prev.length, v: indexData.price }]);
    }, 1200);
    return () => clearInterval(interval);
  }, [indexData.price]);

  // ── Sorting / filtering ─────────────────────────────────────────────────────
  const filtered = stocks
    .filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });

  const watchlistStocks = stocks.filter(s => watchlist.includes(s.symbol));

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const toggleWatch = (sym) => setWatchlist(w => w.includes(sym) ? w.filter(x => x !== sym) : [...w, sym]);

  const indexPos = indexData.changePercent >= 0;
  const advancers = stocks.filter(s => s.changePercent >= 0).length;
  const decliners = stocks.filter(s => s.changePercent < 0).length;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080810; --surface: #0e0e1a; --surface2: #13131f; --border: #1e1e30;
      --text: #e2e8f0; --muted: #4a4d6a; --accent: #00ff94; --red: #ff4d6d;
      --gold: #ffd166;
    }
    body { background: var(--bg); color: var(--text); font-family: 'IBM Plex Mono', monospace; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    .flash-up { animation: flashUp 0.4s ease; }
    .flash-down { animation: flashDown 0.4s ease; }
    @keyframes flashUp { 0%,100%{background:transparent} 50%{background:rgba(0,255,148,0.1)} }
    @keyframes flashDown { 0%,100%{background:transparent} 50%{background:rgba(255,77,109,0.1)} }
    .row-hover:hover { background: rgba(255,255,255,0.03) !important; cursor: pointer; }
    .tab-btn { border:none; background:none; cursor:pointer; font-family:inherit; }
    .sort-btn { border:none; background:none; cursor:pointer; font-family:inherit; color:var(--muted); font-size:11px; display:flex; align-items:center; gap:3px; }
    .sort-btn:hover { color:var(--text); }
    .sort-active { color:var(--accent) !important; }
    input { font-family:inherit; }
  `;

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <span style={{ opacity: 0.3, fontSize: 9 }}>⇅</span>;
    return sortDir === "asc" ? <ChevronUp size={10} color="var(--accent)" /> : <ChevronDown size={10} color="var(--accent)" />;
  };

  const Col = ({ label, k, align = "right", style = {} }) => (
    <th style={{ textAlign: align, padding: "8px 12px", fontWeight: 500, ...style }}>
      <button className={`sort-btn ${sortKey === k ? "sort-active" : ""}`} onClick={() => handleSort(k)} style={{ fontFamily: "inherit", justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        {label}<SortIcon k={k} />
      </button>
    </th>
  );

  return (
    <>
      <style>{css}</style>
      <FlashAlert alerts={alerts} />

      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0a0a14 0%, #0e0e1a 100%)", borderBottom: "1px solid var(--border)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #00ff94, #00b4d8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(0,255,148,0.3)" }}>
              <Activity size={18} color="#080810" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "0.05em", color: "#e2e8f0" }}>BORSA <span style={{ color: "var(--accent)" }}>ITALIANA</span></div>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>LIVE MARKET TERMINAL</div>
            </div>
          </div>

          {/* FTSE MIB pill */}
          <div style={{ marginLeft: 24, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>FTSE MIB</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{indexData.price.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: 12, color: indexPos ? "var(--accent)" : "var(--red)", fontWeight: 600 }}>
                {indexPos ? "▲" : "▼"} {Math.abs(indexData.changePercent).toFixed(2)}%
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>{indexPos ? "+" : ""}{fmt(indexData.change)}</div>
            </div>
          </div>

          {/* Market breadth */}
          <div style={{ display: "flex", gap: 12, marginLeft: 8 }}>
            <div style={{ fontSize: 11, color: "var(--accent)" }}>▲ {advancers}</div>
            <div style={{ fontSize: 11, color: "var(--red)" }}>▼ {decliners}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--muted)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)", animation: "pulse 2s infinite" }} />
            <span style={{ color: "var(--accent)", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>
            <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
            {lastUpdate.toLocaleTimeString("it-IT")}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </header>

      {/* Ticker tape */}
      <TickerTape stocks={stocks} />

      {/* Main layout */}
      <div style={{ display: "flex", height: "calc(100vh - 96px)", overflow: "hidden" }}>

        {/* LEFT sidebar - watchlist */}
        <aside style={{ width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Star size={12} color="var(--gold)" fill="var(--gold)" />
            <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)" }}>WATCHLIST</span>
            <span style={{ marginLeft: "auto", fontSize: 10, background: "var(--border)", borderRadius: 4, padding: "1px 6px", color: "var(--text)" }}>{watchlist.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {watchlistStocks.length === 0 && (
              <div style={{ padding: 24, fontSize: 11, color: "var(--muted)", textAlign: "center" }}>Aggiungi azioni con ★</div>
            )}
            {watchlistStocks.map(s => {
              const pos = s.changePercent >= 0;
              return (
                <div key={s.symbol} onClick={() => setSelectedStock(s)} className="row-hover" style={{ padding: "10px 16px", borderBottom: "1px solid rgba(30,30,48,0.5)", cursor: "pointer", background: selectedStock?.symbol === s.symbol ? "rgba(0,255,148,0.05)" : undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{s.symbol.replace(".MI", "")}</span>
                    <span style={{ fontSize: 11, color: pos ? "var(--accent)" : "var(--red)" }}>{pos ? "+" : ""}{s.changePercent.toFixed(2)}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>€{fmtPrice(s.price)}</span>
                    <Sparkline data={s.history} positive={pos} />
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tabs + search */}
          <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 20px", display: "flex", alignItems: "center", gap: 0, justifyContent: "space-between" }}>
            <div style={{ display: "flex" }}>
              {[["market", <BarChart2 size={12} />, "MERCATO"], ["index", <Activity size={12} />, "INDICE"], ["sectors", <Layers size={12} />, "SETTORI"]].map(([t, icon, label]) => (
                <button key={t} className="tab-btn" onClick={() => setActiveTab(t)} style={{ padding: "12px 20px", fontSize: 10, letterSpacing: "0.12em", color: activeTab === t ? "var(--accent)" : "var(--muted)", borderBottom: `2px solid ${activeTab === t ? "var(--accent)" : "transparent"}`, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
                  {icon}{label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", width: 240 }}>
              <Search size={12} color="var(--muted)" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca simbolo o azienda..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 11 }} />
              {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><X size={12} /></button>}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", padding: 0 }}>
            {activeTab === "market" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "var(--surface)", position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <Col label="SIMBOLO" k="symbol" align="left" />
                    <Col label="NOME" k="name" align="left" />
                    <Col label="PREZZO" k="price" />
                    <Col label="VAR %" k="changePercent" />
                    <Col label="VAR €" k="change" />
                    <Col label="VOLUME" k="volume" />
                    <Col label="CAP." k="marketCap" />
                    <th style={{ width: 80, textAlign: "center", padding: "8px 12px", fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>TREND</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const pos = s.changePercent >= 0;
                    const flash = flashSymbols[s.symbol];
                    return (
                      <tr key={s.symbol} onClick={() => setSelectedStock(s)} className={`row-hover ${flash ? `flash-${flash}` : ""}`} style={{ borderBottom: "1px solid rgba(30,30,48,0.6)", transition: "background 0.15s", background: selectedStock?.symbol === s.symbol ? "rgba(0,255,148,0.04)" : undefined }}>
                        <td style={{ padding: "9px 12px" }}>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{s.symbol.replace(".MI","")}</span>
                          <span style={{ marginLeft: 6, fontSize: 9, color: "var(--muted)", background: "var(--border)", borderRadius: 3, padding: "1px 5px" }}>MIL</span>
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--muted)", fontSize: 11 }}>{s.name}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>€{fmtPrice(s.price)}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right" }}>
                          <span style={{ color: pos ? "var(--accent)" : "var(--red)", fontWeight: 600 }}>
                            {pos ? "▲ +" : "▼ "}{Math.abs(s.changePercent).toFixed(2)}%
                          </span>
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", color: pos ? "var(--accent)" : "var(--red)", fontSize: 11 }}>
                          {pos ? "+" : ""}{fmtPrice(s.change)}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--muted)", fontSize: 11 }}>{fmtVol(s.volume)}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", color: "var(--muted)", fontSize: 11 }}>{fmtCap(s.marketCap)}</td>
                        <td style={{ padding: "4px 12px", textAlign: "center" }}>
                          <Sparkline data={s.history} positive={pos} />
                        </td>
                        <td style={{ padding: "9px 8px", textAlign: "center" }}>
                          <button onClick={e => { e.stopPropagation(); toggleWatch(s.symbol); }} style={{ background: "none", border: "none", cursor: "pointer", color: watchlist.includes(s.symbol) ? "var(--gold)" : "var(--muted)", fontSize: 14, lineHeight: 1 }}>
                            {watchlist.includes(s.symbol) ? "★" : "☆"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === "index" && (
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>FTSE MIB <span style={{ color: "var(--muted)", fontSize: 14, fontFamily: "inherit" }}>– Indice Principale</span></div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "var(--text)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    {indexData.price.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 16, color: indexPos ? "var(--accent)" : "var(--red)", fontWeight: 600 }}>
                    {indexPos ? "▲ +" : "▼ "}{fmt(Math.abs(indexData.change))} ({indexPos ? "+" : ""}{fmt(indexData.changePercent)}%)
                  </div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={indexHistory}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={indexPos ? "#00ff94" : "#ff4d6d"} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={indexPos ? "#00ff94" : "#ff4d6d"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1a1a2e" strokeDasharray="4 4" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={["auto", "auto"]} stroke="#4a4d6a" fontSize={10} width={60} tickFormatter={v => v.toLocaleString("it-IT", { maximumFractionDigits: 0 })} />
                      <Tooltip contentStyle={{ background: "#13131f", border: "1px solid #1e1e30", borderRadius: 8, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }} formatter={v => [v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "FTSE MIB"]} labelFormatter={() => ""} />
                      <Area type="monotone" dataKey="v" stroke={indexPos ? "#00ff94" : "#ff4d6d"} strokeWidth={2} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "sectors" && (
              <div style={{ padding: 24 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Performance per Settore</div>
                {Object.entries(
                  stocks.reduce((acc, s) => {
                    if (!acc[s.sector]) acc[s.sector] = [];
                    acc[s.sector].push(s);
                    return acc;
                  }, {})
                ).sort((a, b) => {
                  const avgA = a[1].reduce((s, x) => s + x.changePercent, 0) / a[1].length;
                  const avgB = b[1].reduce((s, x) => s + x.changePercent, 0) / b[1].length;
                  return avgB - avgA;
                }).map(([sector, sectorStocks]) => {
                  const avg = sectorStocks.reduce((s, x) => s + x.changePercent, 0) / sectorStocks.length;
                  const pos = avg >= 0;
                  const barWidth = Math.min(100, Math.abs(avg) * 20);
                  return (
                    <div key={sector} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{sector}</span>
                          <span style={{ marginLeft: 10, fontSize: 10, color: "var(--muted)" }}>{sectorStocks.length} titoli</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: pos ? "var(--accent)" : "var(--red)" }}>
                          {pos ? "+" : ""}{avg.toFixed(2)}%
                        </span>
                      </div>
                      <div style={{ background: "var(--bg)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${barWidth}%`, height: "100%", background: pos ? "var(--accent)" : "var(--red)", borderRadius: 4, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                        {sectorStocks.map(s => (
                          <span key={s.symbol} onClick={() => { setSelectedStock(s); setActiveTab("market"); }} style={{ fontSize: 10, color: s.changePercent >= 0 ? "var(--accent)" : "var(--red)", cursor: "pointer", background: "var(--surface2)", borderRadius: 4, padding: "2px 8px" }}>
                            {s.symbol.replace(".MI", "")} {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT panel - stock detail */}
        <aside style={{ width: 280, background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {!selectedStock ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
              <Zap size={32} color="var(--border)" />
              <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>Clicca su un titolo per visualizzare i dettagli in tempo reale</div>
            </div>
          ) : (() => {
            const s = stocks.find(x => x.symbol === selectedStock.symbol) || selectedStock;
            const pos = s.changePercent >= 0;
            return (
              <div style={{ flex: 1, overflow: "auto" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{s.symbol.replace(".MI", "")}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.name}</div>
                    <div style={{ fontSize: 9, color: "var(--muted)", background: "var(--border)", borderRadius: 3, padding: "1px 6px", display: "inline-block", marginTop: 4 }}>{s.sector}</div>
                  </div>
                  <button onClick={() => setSelectedStock(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={14} /></button>
                </div>

                {/* Price */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>€{fmtPrice(s.price)}</div>
                  <div style={{ fontSize: 14, color: pos ? "var(--accent)" : "var(--red)", fontWeight: 600, marginTop: 4 }}>
                    {pos ? "▲ +" : "▼ "}{fmtPrice(Math.abs(s.change))} ({pos ? "+" : ""}{fmt(s.changePercent)}%)
                  </div>
                </div>

                {/* Mini chart */}
                <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ height: 80 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={s.history}>
                        <defs>
                          <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pos ? "#00ff94" : "#ff4d6d"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={pos ? "#00ff94" : "#ff4d6d"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke={pos ? "#00ff94" : "#ff4d6d"} strokeWidth={1.5} fill="url(#detailGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ padding: "16px 20px" }}>
                  {[
                    ["Apertura", `€${fmtPrice(s.open)}`],
                    ["Chiusura prec.", `€${fmtPrice(s.previousClose)}`],
                    ["Max giorno", `€${fmtPrice(s.high)}`],
                    ["Min giorno", `€${fmtPrice(s.low)}`],
                    ["Volume", fmtVol(s.volume)],
                    ["Cap. mercato", fmtCap(s.marketCap)],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(30,30,48,0.8)" }}>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{label}</span>
                      <span style={{ fontSize: 12, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Watchlist toggle */}
                <div style={{ padding: "12px 20px" }}>
                  <button onClick={() => toggleWatch(s.symbol)} style={{ width: "100%", padding: "10px", border: `1px solid ${watchlist.includes(s.symbol) ? "var(--gold)" : "var(--border)"}`, borderRadius: 8, background: watchlist.includes(s.symbol) ? "rgba(255,209,102,0.08)" : "none", color: watchlist.includes(s.symbol) ? "var(--gold)" : "var(--muted)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.08em", transition: "all 0.15s" }}>
                    <Star size={12} fill={watchlist.includes(s.symbol) ? "var(--gold)" : "none"} />
                    {watchlist.includes(s.symbol) ? "NELLA WATCHLIST" : "AGGIUNGI WATCHLIST"}
                  </button>
                </div>
              </div>
            );
          })()}
        </aside>
      </div>
    </>
  );
}
