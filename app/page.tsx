"use client";

import { useMemo, useState } from "react";

type Mode = "learn" | "lab";
type Topic = "fault" | "overload" | "selectivity" | "restore";

const topics: { id: Topic; number: string; title: string; question: string; idea: string; facts: string[] }[] = [
  { id: "fault", number: "01", title: "Fault fundamentals", question: "What happens during a short circuit?", idea: "A fault creates an unintended low-resistance path, so current rises almost instantly.", facts: ["Normal current: 120 A", "Fault current: 4,820 A", "The relay detects; the breaker disconnects"] },
  { id: "overload", number: "02", title: "Fault or overload?", question: "Why should protection wait sometimes?", idea: "An overload is high demand, not necessarily damage. Protection uses current and time together to avoid unnecessary trips.", facts: ["Overload: gradual rise", "Short circuit: sudden extreme rise", "Delay prevents nuisance trips"] },
  { id: "selectivity", number: "03", title: "Protection coordination", question: "Which breaker should open first?", idea: "The breaker closest to the fault should operate first. Upstream protection waits as backup.", facts: ["Feeder relay: primary", "Main relay: backup", "Healthy feeder stays online"] },
  { id: "restore", number: "04", title: "Restore the grid", question: "What happens after the fault is cleared?", idea: "Operators verify the fault, isolate damaged equipment, and restore healthy sections without re-energising danger.", facts: ["Confirm isolation", "Inspect before reclose", "Restore healthy loads in steps"] },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("learn");
  const [topic, setTopic] = useState<Topic>("fault");
  const [faultType, setFaultType] = useState("short");
  const [location, setLocation] = useState("feeder1");
  const [pickup, setPickup] = useState(600);
  const [delay, setDelay] = useState(300);
  const [breakerHealthy, setBreakerHealthy] = useState(true);
  const [ran, setRan] = useState(false);

  const active = topics.find(item => item.id === topic)!;
  const result = useMemo(() => {
    const current = faultType === "short" ? 4820 : faultType === "ground" ? 2100 : 780;
    const detected = current >= pickup;
    const primaryTime = detected ? delay + 80 : null;
    const backupTime = 850;
    if (!detected) return { current, verdict: "Unsafe setting", tone: "bad", title: "The relay missed the abnormal current", detail: `The ${pickup} A pickup is above the measured ${current} A. The feeder remains energised.`, outage: "Fault continues", trip: "No trip", events: ["Abnormal current begins", "Relay does not pick up", "Operator intervention required"] };
    if (!breakerHealthy) return { current, verdict: "Backup operated", tone: "warn", title: "The feeder breaker failed", detail: "The main breaker cleared the fault as backup. Safety was preserved, but both feeders lost supply.", outage: "Both feeders", trip: `${backupTime} ms`, events: ["Fault detected by Feeder Relay 1", `Trip command sent at ${delay} ms`, "Breaker 1 fails to open", `Main breaker opens at ${backupTime} ms`] };
    if (location === "bus") return { current, verdict: "Correct operation", tone: "good", title: "The main breaker isolated the bus fault", detail: "A bus fault affects the common connection, so the main breaker must disconnect every feeder.", outage: "Both feeders", trip: `${Math.max(180, delay)} ms`, events: ["Bus fault begins", "Main relay detects high current", "Main breaker opens", "Entire bus safely isolated"] };
    if (primaryTime! >= backupTime) return { current, verdict: "Poor coordination", tone: "bad", title: "The backup breaker was faster", detail: "The main breaker opened before the feeder breaker, disconnecting healthy customers unnecessarily.", outage: "Both feeders", trip: `${backupTime} ms`, events: ["Feeder fault begins", "Both relays detect it", `Feeder trip scheduled for ${primaryTime} ms`, `Main breaker opens first at ${backupTime} ms`] };
    return { current, verdict: "Selective protection", tone: "good", title: "Only the faulty feeder was isolated", detail: "The nearest relay detected the fault and its breaker opened before backup protection was needed.", outage: location === "feeder1" ? "Feeder 1 only" : "Feeder 2 only", trip: `${primaryTime} ms`, events: ["Fault begins", `Relay picks up above ${pickup} A`, `Trip command after ${delay} ms`, `Feeder breaker opens at ${primaryTime} ms`] };
  }, [faultType, location, pickup, delay, breakerHealthy]);

  function run() { setRan(false); window.setTimeout(() => setRan(true), 180); }

  return <main>
    <header className="header">
      <button className="logo" onClick={() => setMode("learn")}><span>G</span><strong>GridLab</strong></button>
      <nav className="mode-switch" aria-label="Choose workspace">
        <button className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Learning path</button>
        <button className={mode === "lab" ? "active" : ""} onClick={() => setMode("lab")}>Protection lab</button>
      </nav>
      <p>POWER SYSTEMS, MADE VISIBLE</p>
    </header>

    {mode === "learn" ? <section className="academy">
      <div className="academy-hero"><div><p className="eyebrow">GRIDLAB ACADEMY · 4 MICRO-LESSONS</p><h1>See why the grid<br/>makes every decision.</h1></div><p>Learn protection by changing the system and watching cause become consequence. Start with faults, then learn coordination and restoration.</p></div>
      <div className="academy-layout">
        <aside className="topic-list">{topics.map(item => <button key={item.id} className={topic === item.id ? "active" : ""} onClick={() => setTopic(item.id)}><span>{item.number}</span><div><strong>{item.title}</strong><small>{item.question}</small></div><b>→</b></button>)}</aside>
        <article className="lesson-card">
          <div className="lesson-label"><span>MICRO-LESSON {active.number}</span><span>≈ 3 MIN</span></div>
          <h2>{active.question}</h2><p className="big-idea">{active.idea}</p>
          <div className={`concept-visual ${topic}`}>
            <div className="grid-source"><b>~</b><span>GRID</span></div><i/><div className="grid-relay"><b>R</b><span>RELAY</span></div><i/><div className="grid-breaker"><b>/</b><span>BREAKER</span></div><i/><div className="grid-load"><b>{topic === "fault" ? "⚡" : topic === "overload" ? "↑" : topic === "selectivity" ? "A/B" : "✓"}</b><span>{topic === "restore" ? "RESTORED" : "LOAD"}</span></div>
          </div>
          <div className="fact-row">{active.facts.map((fact, i) => <div key={fact}><span>0{i + 1}</span><p>{fact}</p></div>)}</div>
          <div className="lesson-footer"><p><strong>TRY IT:</strong> Open the Protection Lab to prove this idea with your own settings.</p><button className="primary" onClick={() => { setMode("lab"); setRan(false); }}>Open the lab <span>→</span></button></div>
        </article>
      </div>
    </section> : <section className="lab-page">
      <div className="lab-heading"><div><p className="eyebrow">INTERACTIVE PROTECTION LAB</p><h1>Set it. Fault it.<br/>Explain it.</h1></div><p>This is a working protection sandbox. Change one variable, run the fault, and GridLab explains both the electrical result and the protection decision.</p></div>
      <div className="lab-workspace">
        <aside className="controls-panel">
          <div className="panel-title"><span>INPUTS</span><b>01</b></div>
          <label>Fault type<select value={faultType} onChange={e => { setFaultType(e.target.value); setRan(false); }}><option value="short">Three-phase short circuit</option><option value="ground">Line-to-ground fault</option><option value="overload">Heavy overload</option></select></label>
          <label>Fault location<select value={location} onChange={e => { setLocation(e.target.value); setRan(false); }}><option value="feeder1">Feeder 1</option><option value="feeder2">Feeder 2</option><option value="bus">Main bus</option></select></label>
          <label className="range-label"><span>Relay pickup <b>{pickup} A</b></span><input type="range" min="200" max="1500" step="50" value={pickup} onChange={e => { setPickup(+e.target.value); setRan(false); }}/><small>Minimum current that the relay treats as abnormal.</small></label>
          <label className="range-label"><span>Trip delay <b>{delay} ms</b></span><input type="range" min="0" max="1200" step="50" value={delay} onChange={e => { setDelay(+e.target.value); setRan(false); }}/><small>How long primary protection waits before tripping.</small></label>
          <label className="toggle"><span><strong>Feeder breaker healthy</strong><small>Turn off to test backup protection.</small></span><input type="checkbox" checked={breakerHealthy} onChange={e => { setBreakerHealthy(e.target.checked); setRan(false); }}/></label>
          <button className="primary run-button" onClick={run}>Run fault simulation <span>→</span></button>
        </aside>
        <div className="simulation-panel">
          <div className="panel-title"><span>LIVE SINGLE-LINE DIAGRAM</span><b>02</b></div>
          <div className={`single-line ${ran ? `running ${result.tone}` : ""}`}>
            <div className="node source"><b>~</b><span>11 kV source</span></div><i/><div className="node main"><b>MB</b><span>Main breaker</span></div><i/><div className="busbar"><strong>BUS</strong><div className={`feeder ${location === "feeder1" && ran ? "faulted" : ""}`}><b>B1</b><span>Feeder 1</span></div><div className={`feeder ${location === "feeder2" && ran ? "faulted" : ""}`}><b>B2</b><span>Feeder 2</span></div>{location === "bus" && ran && <em>FAULT</em>}</div>
          </div>
          <div className="meters"><div><span>MEASURED CURRENT</span><strong>{ran ? `${result.current.toLocaleString()} A` : "120 A"}</strong></div><div><span>CLEARING TIME</span><strong>{ran ? result.trip : "—"}</strong></div><div><span>POWER LOST</span><strong>{ran ? result.outage : "None"}</strong></div></div>
          {!ran ? <div className="empty-result"><span>READY</span><h2>Configure the protection, then run a fault.</h2><p>Your result and relay event record will appear here.</p></div> : <div className={`analysis-result ${result.tone}`}><div className="verdict"><span>{result.verdict}</span><h2>{result.title}</h2><p>{result.detail}</p></div><div className="event-log"><p>EVENT TIMELINE</p>{result.events.map((event, i) => <div key={event}><b>{String(i + 1).padStart(2,"0")}</b><span>{event}</span></div>)}</div></div>}
        </div>
      </div>
      <div className="challenge-strip"><div><p className="eyebrow">CHALLENGE MODE</p><h2>Can you isolate one feeder in under 700 ms?</h2><p>Keep the breaker healthy, choose a feeder fault, and coordinate pickup and delay without disconnecting the healthy feeder.</p></div><button onClick={() => { setFaultType("short"); setLocation("feeder1"); setPickup(600); setDelay(500); setBreakerHealthy(true); setRan(false); }}>Load challenge settings →</button></div>
    </section>}
    <footer><strong>GRIDLAB</strong><span>Learn · Experiment · Explain</span><span>Educational model · Not for protection design</span></footer>
  </main>;
}
