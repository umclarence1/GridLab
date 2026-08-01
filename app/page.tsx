"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Scenario = "selective" | "miscoordinated" | "breakerFailure";
type Stage = "ready" | "fault" | "pickup" | "trip" | "opening" | "isolated" | "backup";
type SimEvent = { time: number; level: "info" | "warn" | "trip" | "safe"; source: string; message: string };

const scenarios: Record<Scenario, { title: string; subtitle: string; target: string; events: SimEvent[] }> = {
  selective: {
    title: "Selective protection",
    subtitle: "R21 should isolate Feeder 1 while healthy loads remain online.",
    target: "CB-21",
    events: [
      { time: 0, level: "warn", source: "F1", message: "3-phase fault applied on Feeder 1" },
      { time: 18, level: "warn", source: "CT-21", message: "Current rises to 4.82 kA" },
      { time: 42, level: "warn", source: "R21", message: "Pickup threshold exceeded" },
      { time: 126, level: "trip", source: "R21", message: "Trip command asserted to CB-21" },
      { time: 188, level: "trip", source: "CB-21", message: "Breaker contacts separated" },
      { time: 214, level: "safe", source: "SYSTEM", message: "Fault isolated · Feeder 2 remains live" },
    ],
  },
  miscoordinated: {
    title: "Miscoordinated relays",
    subtitle: "R1 is set too fast and may disconnect the entire bus.",
    target: "CB-01",
    events: [
      { time: 0, level: "warn", source: "F1", message: "3-phase fault applied on Feeder 1" },
      { time: 18, level: "warn", source: "CT-21", message: "Current rises to 4.82 kA" },
      { time: 40, level: "warn", source: "R1 + R21", message: "Both relays pick up" },
      { time: 86, level: "trip", source: "R1", message: "Upstream trip issued too early" },
      { time: 151, level: "trip", source: "CB-01", message: "Main breaker opened" },
      { time: 180, level: "warn", source: "SYSTEM", message: "Fault cleared · both feeders lost supply" },
    ],
  },
  breakerFailure: {
    title: "Breaker failure backup",
    subtitle: "CB-21 receives a trip but fails; R1 must clear the fault.",
    target: "CB-01",
    events: [
      { time: 0, level: "warn", source: "F1", message: "3-phase fault applied on Feeder 1" },
      { time: 42, level: "warn", source: "R21", message: "Pickup threshold exceeded" },
      { time: 126, level: "trip", source: "R21", message: "Trip command asserted to CB-21" },
      { time: 205, level: "warn", source: "CB-21", message: "Breaker failed to interrupt current" },
      { time: 286, level: "trip", source: "R1", message: "Backup protection trip asserted" },
      { time: 348, level: "safe", source: "CB-01", message: "Main breaker opened · fault cleared" },
    ],
  },
};

function stageAt(time: number, scenario: Scenario): Stage {
  if (time <= 0) return "ready";
  if (scenario === "breakerFailure") {
    if (time < 42) return "fault";
    if (time < 126) return "pickup";
    if (time < 205) return "trip";
    if (time < 286) return "opening";
    if (time < 348) return "backup";
    return "isolated";
  }
  const tripAt = scenario === "miscoordinated" ? 86 : 126;
  const openAt = scenario === "miscoordinated" ? 151 : 188;
  const clearAt = scenario === "miscoordinated" ? 180 : 214;
  if (time < 42) return "fault";
  if (time < tripAt) return "pickup";
  if (time < openAt) return "trip";
  if (time < clearAt) return "opening";
  return "isolated";
}

function Waveform({ time, max }: { time: number; max: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth; const h = parent.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const c = canvas.getContext("2d"); if (!c) return; c.scale(dpr, dpr); c.clearRect(0, 0, w, h);
      c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 1;
      [0.25, .5, .75].forEach(y => { c.beginPath(); c.moveTo(0, h * y); c.lineTo(w, h * y); c.stroke(); });
      const progress = Math.min(time / max, 1);
      const drawLine = (color: string, amp: (x: number) => number, offset: number) => {
        c.beginPath();
        for (let x = 0; x <= w * progress; x += 2) {
          const n = x / w; const y = offset + amp(n) * Math.sin(n * 42);
          x ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.strokeStyle = color; c.lineWidth = 2; c.stroke();
      };
      drawLine("#ff5d55", n => n < .58 ? 18 + n * 24 : 3, h * .31);
      drawLine("#6ce5b1", n => n < .12 ? 9 : n < .58 ? 3 : 9, h * .72);
    };
    draw(); const ro = new ResizeObserver(draw); ro.observe(parent); return () => ro.disconnect();
  }, [time, max]);
  return <canvas ref={ref} role="img" aria-label="Synchronized current and voltage waveform" />;
}

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>("selective");
  const [prediction, setPrediction] = useState("CB-21");
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [speed, setSpeed] = useState(1);
  const active = scenarios[scenario];
  const maxTime = active.events.at(-1)?.time ?? 220;
  const stage = stageAt(time, scenario);
  const visibleEvents = active.events.filter(event => event.time <= time);
  const faultActive = time > 0 && stage !== "isolated";
  const mainOpen = stage === "isolated" && scenario !== "selective";
  const feeder1Open = stage === "isolated" && scenario === "selective";
  const feeder2Live = !mainOpen;
  const current = time === 0 ? 118 : faultActive ? 4820 : 0;
  const voltage = time === 0 ? 11 : faultActive ? 2.1 : mainOpen ? 0 : 10.9;
  const resultCorrect = prediction === active.target;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTime(currentTime => {
        const next = currentTime + 4 * speed;
        if (next >= maxTime) { setRunning(false); setHasRun(true); return maxTime; }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [running, speed, maxTime]);

  function run() { setTime(1); setHasRun(false); setRunning(true); }
  function reset() { setRunning(false); setTime(0); setHasRun(false); }
  function changeScenario(next: Scenario) { setScenario(next); setPrediction(next === "selective" ? "CB-21" : "CB-01"); reset(); }

  const relayReason = useMemo(() => ({
    measured: faultActive ? "4.82 kA" : time === 0 ? "118 A" : "0 A",
    pickup: "1.20 kA",
    condition: time >= 42 && faultActive ? "TRUE" : "FALSE",
    timer: time < 42 ? "0 ms" : `${Math.min(Math.round(time - 42), 84)} / 84 ms`,
    output: time >= 126 ? "TRIP" : "STANDBY",
  }), [time, faultActive]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">G</span><span>GRIDLAB<small>PROTECTION LABORATORY</small></span></a>
        <div className="system-status"><span className={faultActive ? "dot alarm" : "dot"} />{faultActive ? "FAULT IN PROGRESS" : running ? "SIMULATION ACTIVE" : "LAB READY"}</div>
        <div className="header-actions"><button className="quiet" onClick={reset}>Reset</button><button className="run-button" onClick={run} disabled={running}><span>⚡</span>{hasRun ? "Run again" : "Inject fault"}</button></div>
      </header>

      <div className="app-shell" id="top">
        <aside className="sidebar">
          <section><p className="section-label">01 · SCENARIO</p>{(Object.keys(scenarios) as Scenario[]).map((key, i) => <button key={key} className={`scenario ${scenario === key ? "selected" : ""}`} onClick={() => changeScenario(key)}><span>0{i + 1}</span><div><strong>{scenarios[key].title}</strong><small>{i === 0 ? "Primary protection" : i === 1 ? "Wrong relay settings" : "Backup operation"}</small></div></button>)}</section>
          <section className="prediction"><p className="section-label">02 · MAKE A PREDICTION</p><h3>Which breaker should clear this fault?</h3><div className="breaker-choices">{["CB-01", "CB-21", "CB-22"].map(id => <button key={id} onClick={() => setPrediction(id)} className={prediction === id ? "chosen" : ""}><span className="radio" />{id}<small>{id === "CB-01" ? "Main" : id === "CB-21" ? "Feeder 1" : "Feeder 2"}</small></button>)}</div></section>
          <section className="learning-goal"><p className="section-label">LEARNING GOAL</p><p>Protection should remove the <strong>smallest possible section</strong> while keeping healthy loads energized.</p></section>
          <p className="disclaimer">Educational approximation · Not for relay setting or system design</p>
        </aside>

        <section className="workspace">
          <div className="workspace-head"><div><p className="section-label">LIVE SINGLE-LINE</p><h1>11 kV Radial Substation</h1></div><div className="sim-clock"><span>SIMULATION CLOCK</span><strong>+{Math.round(time).toString().padStart(3, "0")}<small> ms</small></strong></div></div>

          <div className={`substation ${faultActive ? "faulting" : ""}`}>
            <div className="source component"><span className="component-icon">~</span><strong>GRID</strong><small>33 kV · 50 Hz</small></div><div className={`wire horizontal ${mainOpen ? "dead" : "live"}`} />
            <div className="transformer component"><span className="coil">◯◯</span><strong>T1</strong><small>10 MVA · 8%</small></div><div className={`wire horizontal ${mainOpen ? "dead" : "live"}`} />
            <div className={`breaker component ${mainOpen ? "open" : "closed"}`}><span className="breaker-symbol"><i /></span><strong>CB-01</strong><small>{mainOpen ? "OPEN" : "CLOSED"}</small><b className="relay-tag">R1</b></div><div className={`wire horizontal bus-link ${mainOpen ? "dead" : "live"}`} />
            <div className={`busbar ${mainOpen ? "dead" : "live"}`}><strong>BUS A</strong><small>{mainOpen ? "0.0" : voltage.toFixed(1)} kV</small><div className="branch branch-one"><i className={mainOpen || feeder1Open ? "dead" : "live"} /><div className={`breaker mini ${feeder1Open ? "open" : "closed"}`}><span className="breaker-symbol"><i /></span><strong>CB-21</strong><b className="relay-tag">R21</b></div><i className={mainOpen || feeder1Open ? "dead" : "live"} /><div className="load"><span>▥</span><strong>LOAD A</strong><small>{feeder1Open || mainOpen ? "OFFLINE" : "2.4 MW"}</small></div>{faultActive && <div className="fault-marker"><span>ϟ</span><strong>F1</strong><small>3Φ SHORT</small></div>}</div><div className="branch branch-two"><i className={feeder2Live ? "live" : "dead"} /><div className="breaker mini closed"><span className="breaker-symbol"><i /></span><strong>CB-22</strong><b className="relay-tag">R22</b></div><i className={feeder2Live ? "live" : "dead"} /><div className="load"><span>▥</span><strong>LOAD B</strong><small>{feeder2Live ? "1.8 MW" : "OFFLINE"}</small></div></div></div>
          </div>

          <div className="readings">
            <article><span>BUS VOLTAGE</span><strong className={faultActive ? "danger" : ""}>{voltage.toFixed(1)}<small> kV</small></strong><i style={{ width: `${Math.min((voltage / 11) * 100, 100)}%` }} /></article>
            <article><span>FEEDER CURRENT</span><strong className={faultActive ? "danger" : ""}>{current >= 1000 ? (current / 1000).toFixed(2) : current}<small>{current >= 1000 ? " kA" : " A"}</small></strong><i className="red" style={{ width: `${Math.min((current / 5000) * 100, 100)}%` }} /></article>
            <article><span>R21 STATE</span><strong className={stage === "pickup" ? "amber" : stage === "trip" || feeder1Open ? "danger" : ""}>{stage === "pickup" ? "PICKUP" : stage === "trip" || feeder1Open ? "TRIP" : "STANDBY"}</strong><small>{stage === "pickup" ? "Timer active" : feeder1Open ? "Output asserted" : "Ready"}</small></article>
            <article><span>SELECTIVITY</span><strong className={hasRun ? scenario === "selective" ? "safe" : "danger" : ""}>{hasRun ? scenario === "selective" ? "MAINTAINED" : "LOST" : "—"}</strong><small>{hasRun ? scenario === "selective" ? "Healthy feeder live" : "Healthy feeder interrupted" : "Awaiting test"}</small></article>
          </div>

          <div className="lower-panels">
            <article className="panel waveform"><div className="panel-head"><div><p className="section-label">SYNCHRONIZED SIGNALS</p><h2>Fault response</h2></div><div className="legend"><span className="current-key">CURRENT</span><span className="voltage-key">VOLTAGE</span></div></div><div className="canvas-wrap"><Waveform time={time} max={maxTime} /></div><div className="replay"><button onClick={() => setRunning(!running)} disabled={!time}>{running ? "Ⅱ" : "▶"}</button><input aria-label="Replay timeline" type="range" min="0" max={maxTime} value={time} onChange={e => { setRunning(false); setTime(Number(e.target.value)); setHasRun(Number(e.target.value) === maxTime); }} /><select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value=".5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></div></article>
            <article className="panel relay-inspector"><div className="panel-head"><div><p className="section-label">DECISION INSPECTOR</p><h2>Why did R21 operate?</h2></div><span className={`relay-state ${relayReason.output === "TRIP" ? "tripped" : ""}`}>{relayReason.output}</span></div><dl><div><dt>Measured current</dt><dd>{relayReason.measured}</dd></div><div><dt>Pickup setting</dt><dd>{relayReason.pickup}</dd></div><div><dt>Above pickup</dt><dd className={relayReason.condition === "TRUE" ? "yes" : ""}>{relayReason.condition}</dd></div><div><dt>Definite-time delay</dt><dd>{relayReason.timer}</dd></div></dl><p className="explanation">{time < 42 ? "R21 is monitoring the feeder current." : time < 126 ? "Current remains above pickup, so the definite-time element is counting toward a trip." : "The pickup condition persisted for the full delay. R21 asserted its trip output to CB-21."}</p></article>
          </div>
        </section>

        <aside className="event-rail">
          <div className="rail-head"><div><p className="section-label">EVENT RECORDER</p><h2>Sequence of events</h2></div><span>{visibleEvents.length}/{active.events.length}</span></div>
          <div className="scenario-summary"><span className="number">{scenario === "selective" ? "01" : scenario === "miscoordinated" ? "02" : "03"}</span><div><strong>{active.title}</strong><p>{active.subtitle}</p></div></div>
          <div className="event-list">{visibleEvents.length ? visibleEvents.map((event, index) => <div className={`event ${event.level}`} key={`${event.time}-${event.source}`}><span className="event-node" /><time>+{event.time.toString().padStart(3, "0")} ms</time><strong>{event.source}</strong><p>{event.message}</p>{index === visibleEvents.length - 1 && running && <i className="active-event" />}</div>) : <div className="empty-log"><span>⌁</span><strong>No events recorded</strong><p>Make a prediction, then inject the fault.</p></div>}</div>
          {hasRun && <div className={`result-card ${resultCorrect ? "correct" : "incorrect"}`}><span>{resultCorrect ? "✓" : "×"}</span><div><small>YOUR PREDICTION</small><strong>{resultCorrect ? "Correct" : `Expected ${active.target}`}</strong><p>{scenario === "selective" ? "Only the faulted feeder was isolated." : scenario === "miscoordinated" ? "The upstream relay operated before R21." : "Backup protection cleared the uncleared fault."}</p></div></div>}
          <div className="concept"><span>KEY CONCEPT</span><strong>Protection is a race—with rules.</strong><p>The nearest device should clear the fault first. Upstream protection waits as backup.</p></div>
        </aside>
      </div>
      <footer><span>GRIDLAB · DEMO WEDNESDAY · EPISODE 01</span><p>Interactive Protection Sequence Laboratory</p><span>Built for learning, not system design.</span></footer>
    </main>
  );
}
