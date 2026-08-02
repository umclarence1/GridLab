"use client";

import { useEffect, useMemo, useState } from "react";

type FaultType = "short" | "ground" | "overload" | "bus";
type Protection = "selective" | "fast" | "failure";

const faults: { id: FaultType; code: string; title: string; description: string; current: string }[] = [
  { id: "short", code: "3Φ", title: "Three-phase short", description: "A severe fault between all three phases.", current: "4,820 A" },
  { id: "ground", code: "L-G", title: "Earth fault", description: "One conductor touches grounded equipment.", current: "2,140 A" },
  { id: "overload", code: "I↑", title: "Heavy overload", description: "Demand rises above the feeder rating.", current: "780 A" },
  { id: "bus", code: "BUS", title: "Busbar fault", description: "The common substation bus is faulted.", current: "7,600 A" },
];

export default function AdvancedLab() {
  const [fault, setFault] = useState<FaultType>("short");
  const [protection, setProtection] = useState<Protection>("selective");
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);

  const selected = faults.find(item => item.id === fault)!;
  const overload = fault === "overload";
  const busFault = fault === "bus";
  const bothOut = busFault || protection !== "selective";

  const story = useMemo(() => {
    const step3 = overload ? "Relay starts its overload timer" : "Relay confirms dangerous current";
    const step4 = overload ? "Current returns to a safe level" : protection === "failure" ? "Feeder breaker fails to open" : protection === "fast" ? "Main relay trips too early" : busFault ? "Main breaker receives trip command" : "Feeder breaker receives trip command";
    const step5 = overload ? "Breaker correctly stays closed" : protection === "failure" ? "Backup main breaker opens" : protection === "fast" || busFault ? "Main breaker opens" : "Feeder breaker opens";
    return ["Abnormal condition begins", `Current changes to ${selected.current}`, step3, step4, step5, overload ? "Customers stay safely powered" : bothOut ? "Both feeders are de-energised" : "Only Feeder 1 is isolated"];
  }, [bothOut, busFault, overload, protection, selected.current]);

  useEffect(() => {
    if (!running) return;
    if (stage >= 6) { setRunning(false); return; }
    const timer = window.setTimeout(() => setStage(current => {
      return current + 1;
    }), 1050);
    return () => window.clearTimeout(timer);
  }, [running, stage]);

  function reset(nextFault?: FaultType) {
    if (nextFault) setFault(nextFault);
    setStage(0);
    setRunning(false);
  }

  function run() { setStage(1); setRunning(true); }

  const caption = stage === 0 ? "Choose a fault and protection response, then run the simulation." : story[Math.min(stage - 1, story.length - 1)];
  const cleared = stage >= 5;
  const feederOneOff = cleared && !overload;
  const feederTwoOff = cleared && bothOut && !overload;

  return <section className="advanced-lab-v2">
    <div className="lab-v2-intro"><p className="eyebrow">ADVANCED LAB · MULTI-FAULT SIMULATOR</p><h1>Break the grid.<br/>Watch it respond.</h1><p>First choose what goes wrong. Then choose how the protection behaves. GridLab will animate every decision and explain the consequence in plain language.</p></div>

    <div className="fault-picker"><div className="section-tag"><span>01</span><div><strong>Choose an electrical event</strong><small>These produce different current patterns and require different decisions.</small></div></div><div className="fault-options">{faults.map(item => <button key={item.id} className={fault === item.id ? "selected" : ""} onClick={() => reset(item.id)}><b>{item.code}</b><span>{item.title}</span><small>{item.description}</small></button>)}</div></div>

    <div className="response-picker"><div className="section-tag"><span>02</span><div><strong>Choose protection behaviour</strong><small>Test correct operation or intentionally introduce a mistake.</small></div></div><div className="response-options">{[
      { id: "selective" as Protection, title: "Correctly coordinated", note: "Nearest suitable breaker acts first" },
      { id: "fast" as Protection, title: "Main relay too fast", note: "Upstream breaker acts unnecessarily" },
      { id: "failure" as Protection, title: "Feeder breaker fails", note: "Backup protection must operate" },
    ].map(item => <button key={item.id} className={protection === item.id ? "selected" : ""} onClick={() => { setProtection(item.id); reset(); }}><i/><span><strong>{item.title}</strong><small>{item.note}</small></span></button>)}</div></div>

    <div className={`lab-stage fault-${fault} protection-${protection} stage-${stage} ${running ? "is-running" : ""}`}>
      <div className="lab-stage-head"><div><span>{running ? "● LIVE" : stage === 6 ? "✓ COMPLETE" : "READY"}</span><strong>{caption}</strong></div><div className="live-reading"><span>MEASURED CURRENT</span><b>{stage === 0 ? "120 A" : cleared ? overload ? "410 A" : "0 A" : selected.current}</b></div></div>
      <div className="substation-scene">
        <div className="scene-source"><div>~</div><strong>11 kV source</strong><small>Supplies the substation</small></div>
        <div className={`power-line upstream ${cleared && bothOut && !overload ? "dead" : ""}`}><i/><i/><i/></div>
        <div className={`scene-breaker main-breaker ${cleared && bothOut && !overload ? "tripped" : ""}`}><div><i/></div><strong>Main breaker</strong><small>{cleared && bothOut && !overload ? "OPEN" : "CLOSED"}</small></div>
        <div className={`power-line bus-line ${cleared && bothOut && !overload ? "dead" : ""}`}><i/><i/><i/></div>
        <div className={`scene-relay ${stage >= 3 && !cleared ? "detecting" : ""}`}><div>R</div><strong>Protection relay</strong><small>{stage < 3 ? "Monitoring" : cleared ? "Event recorded" : "Evaluating current"}</small></div>
        <div className={`scene-bus ${busFault && stage > 0 && !cleared ? "faulting" : ""}`}><b>MAIN BUS</b><i/></div>
        <div className={`feeder-path feeder-one ${feederOneOff ? "dead" : ""}`}><div className={`mini-breaker ${cleared && !bothOut && !overload ? "tripped" : ""}`}><i/></div><span>BREAKER 1</span><div className={`fault-point ${stage > 0 && !cleared && !busFault && !overload ? "visible" : ""}`}>FAULT</div><div className="building"><b>A</b><strong>Building A</strong><small>{feederOneOff ? "No power" : "Powered"}</small></div></div>
        <div className={`feeder-path feeder-two ${feederTwoOff ? "dead" : ""}`}><div className="mini-breaker"><i/></div><span>BREAKER 2</span><div className="building"><b>B</b><strong>Building B</strong><small>{feederTwoOff ? "No power" : "Powered"}</small></div></div>
        {overload && stage > 0 && !cleared && <div className="overload-wave"><i/><i/><i/><span>LOAD INCREASING</span></div>}
      </div>
      <div className="event-sequence">{story.map((event,index) => <div key={event} className={stage > index ? "complete" : stage === index + 1 ? "current" : ""}><span>{String(index + 1).padStart(2,"0")}</span><i/><p>{event}</p></div>)}</div>
      <div className="lab-controls"><button className="secondary" onClick={() => reset()}>Reset</button><button className="primary" onClick={running ? () => setRunning(false) : stage > 0 && stage < 6 ? () => setRunning(true) : run}>{running ? "Pause simulation" : stage > 0 && stage < 6 ? "Continue simulation" : "Run fault simulation"} <span>→</span></button></div>
    </div>

    {stage === 6 && <div className="learning-verdict"><span>WHAT THIS TEACHES</span><div><h2>{overload ? "Not every high current is a short circuit." : bothOut ? "Safety worked, but selectivity was lost." : "Protection isolated the smallest possible area."}</h2><p>{overload ? "The overload timer prevented an unnecessary trip when current returned to normal. Protection must consider both magnitude and duration." : bothOut ? "The main breaker removed the danger, but Building B also lost power. Correct coordination aims to protect healthy customers." : "Breaker 1 removed the fault while Building B stayed powered. This is selective protection—the preferred result."}</p></div><button onClick={() => reset()}>Try another setup →</button></div>}
  </section>;
}
