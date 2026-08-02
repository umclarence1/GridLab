"use client";

import { useEffect, useState } from "react";

const predictions = ["Residential feeder breaker", "Main substation breaker", "Every feeder breaker", "No breaker should open"];
const reflections = ["Increase the main relay delay", "Trip every feeder faster", "Disable backup protection", "Increase the feeder relay delay"];

export default function ProtectionChallenge() {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const correct = prediction === predictions[0];
  const complete = stage >= 5;

  useEffect(() => {
    const prior = window.localStorage.getItem("gridlab-first-challenge");
    setSaved(prior === "complete");
  }, []);
  useEffect(() => {
    if (!running) return;
    if (stage >= 5) { setRunning(false); window.localStorage.setItem("gridlab-first-challenge", "complete"); setSaved(true); return; }
    const timer = window.setTimeout(() => setStage(value => value + 1), 950);
    return () => window.clearTimeout(timer);
  }, [running, stage]);

  function start() { if (!prediction) return; setStage(1); setReflection(null); setRunning(true); }
  function reset() { setStage(0); setRunning(false); setPrediction(null); setReflection(null); }

  return <section className="challenge-page">
    <div className="challenge-hero"><div><p className="eyebrow">PROTECTION CHALLENGE · LEVEL 01</p><h1>Keep the hospital<br/>lights on.</h1></div><p>A fault has occurred in the community. Predict the correct protection response before watching the millisecond sequence.</p></div>
    <div className="community-map">
      <div className="map-head"><span>RIVERSIDE COMMUNITY SUBSTATION</span><strong>4 FEEDERS · 995 PEOPLE · 1 CRITICAL FACILITY</strong></div>
      <div className="community-grid">{[
        ["F1", "Residential area", "145 homes", "FAULTED"], ["F2", "School", "620 students", "HEALTHY"], ["F3", "Factory", "230 workers", "HEALTHY"], ["F4", "Hospital", "280 patients", "CRITICAL"]
      ].map(item => <div key={item[0]} className={item[3].toLowerCase()}><b>{item[0]}</b><span><strong>{item[1]}</strong><small>{item[2]}</small></span><em>{item[3]}</em></div>)}</div>
    </div>

    <div className="prediction-card"><div className="coach-badge"><b>G</b><span><strong>Protection Coach</strong><small>Predict before you simulate</small></span></div><h2>A line-to-ground fault occurs on the residential feeder. Which breaker should operate first?</h2><div className="prediction-options">{predictions.map((item,index) => <button key={item} className={prediction === item ? "selected" : ""} onClick={() => { if (!stage) setPrediction(item); }}><span>{String.fromCharCode(65 + index)}</span>{item}</button>)}</div><button className="primary" disabled={!prediction} onClick={start}>Lock prediction and simulate <span>→</span></button></div>

    {stage > 0 && <div className="challenge-run"><div className="challenge-live"><span>{running ? "● SEQUENCE RUNNING" : complete ? "✓ FAULT ISOLATED" : "PAUSED"}</span><strong>{stage === 1 ? "Fault current begins flowing to earth." : stage === 2 ? "The earth-fault relay detects an imbalance." : stage === 3 ? "The relay confirms the fault and sends a trip command." : stage === 4 ? "The residential feeder breaker opens." : "Fault current reaches zero. Healthy feeders remain powered."}</strong></div><div className="ms-timeline">{[["0 ms","Fault begins"],["12 ms","Relay detects"],["112 ms","Relay trips"],["142 ms","Breaker opens"],["144 ms","Fault isolated"]].map((item,index) => <div key={item[0]} className={stage > index ? "active" : ""}><b>{item[0]}</b><i/><span>{item[1]}</span></div>)}</div></div>}

    {complete && <><div className="impact-report"><div className="impact-title"><span>SYSTEM IMPACT REPORT</span><h2>{correct ? "Excellent protection" : "The fault was cleared—but your prediction would cause a wider outage."}</h2><p>{correct ? "The nearest breaker isolated the residential fault. Critical and healthy facilities remained powered." : "Correct protection disconnects the smallest possible area. Opening the main breaker would unnecessarily disconnect every facility."}</p></div><div className="impact-metrics">{[
      ["Power lost","Residential area"],["Hospital","✓ Powered"],["School","✓ Powered"],["Factory","✓ Powered"],["Customers affected","145 homes"],["Clearing time","144 ms"],["Selectivity","Preserved"],["Protection quality",correct ? "Excellent" : "Prediction needs review"]
    ].map(item => <div key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></div>)}</div></div>
    <div className="reflection-card"><div><span>ENGINEERING REFLECTION</span><h2>What single setting would best prevent the main breaker from tripping before the feeder breaker?</h2><p>Think about how primary and backup protection should be coordinated.</p></div><div className="reflection-options">{reflections.map((item,index) => <button key={item} className={reflection === item ? index === 0 ? "correct" : "wrong" : ""} onClick={() => setReflection(item)}><span>{String.fromCharCode(65 + index)}</span>{item}</button>)}</div>{reflection && <div className="coach-answer"><b>{reflection === reflections[0] ? "Correct." : "Try again."}</b><p>{reflection === reflections[0] ? "Increasing the main relay delay gives the feeder relay time to clear the local fault first while keeping the main relay available as backup." : "The main relay should wait longer—not remove backup protection or make the feeder slower."}</p></div>}</div>
    <div className="achievement-row"><div><span>ACHIEVEMENT</span><b>✓</b><strong>{correct ? "Selective Protector" : "First Protection Challenge"}</strong><small>{saved ? "Progress saved on this device" : "Challenge completed"}</small></div><div className="score"><span>PROTECTION SCORE</span><strong>{correct ? reflection === reflections[0] ? "100" : "85" : reflection === reflections[0] ? "75" : "60"}<small>/100</small></strong></div><button className="secondary" onClick={reset}>Try again</button></div></>}
  </section>;
}
