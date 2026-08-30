"use client";

import { useEffect, useMemo, useState } from "react";
import { awardProgress } from "./ProgressHUD";

type FaultType = "short" | "ground" | "overload" | "bus";
type Protection = "selective" | "fast" | "failure";

const faults: { id: FaultType; code: string; title: string; description: string; current: string }[] = [
  { id: "short", code: "3Φ", title: "Severe short circuit", description: "All three power lines touch together.", current: "4,820 A" },
  { id: "ground", code: "L-G", title: "Line touches earth", description: "One power line touches grounded equipment.", current: "2,140 A" },
  { id: "overload", code: "I↑", title: "Heavy demand", description: "The load draws more current than normal.", current: "780 A" },
  { id: "bus", code: "BUS", title: "Main bus fault", description: "The shared connection inside the substation faults.", current: "7,600 A" },
];

export default function AdvancedLab() {
  const [fault, setFault] = useState<FaultType>("short");
  const [protection, setProtection] = useState<Protection>("selective");
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);

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
  useEffect(() => { if (stage === 6) awardProgress(`lab-${fault}-${protection}`, 35, protection === "failure" ? "Backup Protection Master" : undefined); }, [fault, protection, stage]);

  function reset(nextFault?: FaultType) {
    if (nextFault) setFault(nextFault);
    setStage(0);
    setRunning(false);
    setConfigured(false);
    setReflection(null);
  }

  function run() { setStage(1); setRunning(true); }

  const caption = stage === 0 ? "Choose a fault and protection response, then run the simulation." : story[Math.min(stage - 1, story.length - 1)];
  const cleared = stage >= 5;
  const feederOneOff = cleared && !overload;
  const feederTwoOff = cleared && bothOut && !overload;

  return <section className="advanced-lab-v2">
    <div className="lab-v2-intro"><div><p className="eyebrow">EXPERIMENT LAB</p><h1>Test the protection.<br/>See the impact.</h1></div><p>Choose one problem and one protection response. GridLab will then reveal the circuit, run the sequence and explain who keeps power.</p></div>

    <div className="fault-picker"><div className="section-tag"><span>1</span><div><strong>What goes wrong?</strong><small>Choose one event to test.</small></div></div><div className="fault-options">{faults.map(item => <button key={item.id} className={fault === item.id ? "selected" : ""} onClick={() => reset(item.id)}><b>{item.code}</b><span>{item.title}</span><small>{item.description}</small></button>)}</div></div>

    <div className="response-picker"><div className="section-tag"><span>2</span><div><strong>How does protection respond?</strong><small>Try the correct response or introduce a mistake.</small></div></div><div className="response-options">{[
      { id: "selective" as Protection, title: "Nearest breaker opens", note: "Correct: only the faulted area loses power" },
      { id: "fast" as Protection, title: "Main breaker opens too early", note: "Mistake: healthy areas also lose power" },
      { id: "failure" as Protection, title: "Local breaker does not open", note: "Failure: backup protection must act" },
    ].map(item => <button key={item.id} className={protection === item.id ? "selected" : ""} onClick={() => { setProtection(item.id); reset(); }}><i/><span><strong>{item.title}</strong><small>{item.note}</small></span></button>)}</div></div>

    {!configured&&<div className="lab-ready"><div><span>YOUR TEST</span><strong>{selected.title} + {protection === "selective" ? "nearest breaker opens" : protection === "fast" ? "main breaker opens early" : "local breaker fails"}</strong></div><button className="primary" onClick={()=>setConfigured(true)}>Open simulator <span>→</span></button></div>}

    {configured&&<div className={`lab-stage fault-${fault} protection-${protection} stage-${stage} ${running ? "is-running" : ""}`}>
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
    </div>}

    {stage === 6 && <><div className="learning-verdict impact-version"><span>SYSTEM IMPACT REPORT</span><div><h2>{overload ? "Healthy loads remained powered." : bothOut ? "The hospital and school lost power." : "Only the faulted area lost power."}</h2><p>{overload ? "The overload timer prevented an unnecessary trip when current returned to normal." : bothOut ? "The fault was removed, but selectivity was lost because the main breaker disconnected every feeder." : "Breaker 1 removed the fault while the hospital, school, and factory remained powered."}</p><div className="compact-impact"><b>Clearing time <span>{overload ? "No trip" : protection === "selective" ? "144 ms" : "850 ms"}</span></b><b>People affected <span>{overload ? "0" : bothOut ? "995+" : "145"}</span></b><b>Protection quality <span>{overload || !bothOut ? "Excellent" : "Needs improvement"}</span></b></div></div><button onClick={() => reset()}>Try another setup →</button></div><div className="advanced-reflection"><span>ENGINEERING REFLECTION</span><h2>{overload ? "Why was delaying the trip the correct decision?" : bothOut ? "What single change would best preserve power to healthy feeders?" : "Why should the upstream relay still remain active after a selective trip?"}</h2>{[overload ? "To distinguish temporary demand from sustained danger" : bothOut ? "Coordinate the main relay to wait for primary protection" : "To provide backup if the feeder breaker fails", "To make every breaker open together", "To remove all relay delays"].map((option,index) => <button key={option} className={reflection === option ? index === 0 ? "correct" : "wrong" : ""} onClick={() => setReflection(option)}><i>{String.fromCharCode(65 + index)}</i>{option}</button>)}{reflection && <p><strong>{reflection === (overload ? "To distinguish temporary demand from sustained danger" : bothOut ? "Coordinate the main relay to wait for primary protection" : "To provide backup if the feeder breaker fails") ? "Correct." : "Think again."}</strong> Protection must balance speed with selectivity and dependable backup.</p>}</div></>}
  </section>;
}
