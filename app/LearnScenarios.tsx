"use client";

import { useEffect, useState } from "react";
import { awardProgress } from "./ProgressHUD";

type Scenario = "short" | "ground" | "overload" | "bus";

const lessons: Record<Scenario, { code: string; name: string; question: string; current: string; analogy: string; steps: string[]; outcome: string }> = {
  short: { code: "3Φ", name: "Three-phase short", question: "What if all three phases connect?", current: "4,820 A", analogy: "Like opening a huge shortcut that electricity rushes through.", steps: ["Conductors connect", "Current rises instantly", "Relay detects extreme current", "Feeder breaker opens", "Only the faulty feeder turns off"], outcome: "Fast isolation prevents equipment damage." },
  ground: { code: "L-G", name: "Earth fault", question: "What if a live wire touches metal?", current: "2,140 A", analogy: "Like water escaping through a crack and finding a path to the ground.", steps: ["Live conductor touches earth", "Fault current flows to ground", "Earth-fault relay detects imbalance", "Feeder breaker opens", "Touch danger is removed"], outcome: "Earth protection detects current normal phase relays may miss." },
  overload: { code: "I↑", name: "Heavy overload", question: "What if customers demand too much?", current: "780 A", analogy: "Like too many cars using one road: crowded and hot, but not a crash.", steps: ["Demand gradually increases", "Current exceeds normal rating", "Relay starts a timer", "Demand falls before timeout", "Breaker remains closed"], outcome: "A time delay avoids an unnecessary outage." },
  bus: { code: "BUS", name: "Busbar fault", question: "What if the common connection fails?", current: "7,600 A", analogy: "Like damage in a building's main hallway—it affects every room connected to it.", steps: ["Fault begins on the main bus", "Every feeder sees high current", "Bus protection confirms the zone", "Main breaker opens", "The complete bus is isolated"], outcome: "A bus fault requires a wider outage to keep everyone safe." },
};

export default function LearnScenarios() {
  const [scenario, setScenario] = useState<Scenario>("ground");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const item = lessons[scenario];

  useEffect(() => {
    if (!playing) return;
    if (step >= item.steps.length) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep(value => value + 1), 1150);
    return () => window.clearTimeout(timer);
  }, [item.steps.length, playing, step]);
  useEffect(() => { if (step >= item.steps.length) awardProgress(`fault-${scenario}`, 25, scenario === "overload" ? "Overload Detective" : undefined); }, [item.steps.length, scenario, step]);

  function choose(next: Scenario) { setScenario(next); setStep(0); setPlaying(false); }
  function run() { setStep(1); setPlaying(true); }
  const complete = step >= item.steps.length;
  const tripped = complete && scenario !== "overload";

  return <section className="scenario-classroom">
    <div className="classroom-heading"><div><p className="eyebrow">FAULT LIBRARY · BEGINNER MODE</p><h2>Now explore what else can go wrong.</h2></div><p>The first lesson taught one short circuit. These guided mini-simulations show how different events create different currents—and why protection should not respond to all of them in the same way.</p></div>
    <div className="lesson-tabs">{(Object.keys(lessons) as Scenario[]).map(key => <button key={key} className={scenario === key ? "active" : ""} onClick={() => choose(key)}><b>{lessons[key].code}</b><span>{lessons[key].name}</span></button>)}</div>
    <div className={`lesson-simulator learn-${scenario} learn-step-${step} ${playing ? "playing" : ""}`}>
      <aside className="lesson-context"><span>GUIDED SCENARIO</span><h3>{item.question}</h3><p>{item.analogy}</p><div><span>EXPECTED CURRENT</span><strong>{item.current}</strong></div></aside>
      <div className="mini-substation">
        <div className="mini-source"><b>~</b><span>Source</span></div><i className={tripped ? "wire dead" : "wire"}/><div className={`mini-relay ${step >= 3 && !complete ? "awake" : ""}`}><b>R</b><span>Relay</span></div><i className={tripped ? "wire dead" : "wire"}/><div className={`mini-trip ${tripped ? "open" : ""}`}><b><i/></b><span>Breaker</span></div><i className={tripped ? "wire dead" : "wire"}/><div className={`mini-event ${step > 0 && !complete ? "active" : ""}`}><b>{scenario === "short" ? "⚡" : scenario === "ground" ? "↓" : scenario === "overload" ? "↑" : "×"}</b><span>{scenario === "overload" ? "Heavy load" : scenario === "bus" ? "Bus fault" : "Fault"}</span></div>
        <div className="current-bubble"><span>LIVE CURRENT</span><strong>{step === 0 ? "120 A" : complete ? scenario === "overload" ? "410 A" : "0 A" : item.current}</strong></div>
      </div>
      <div className="guided-story"><div className="story-head"><span>{playing ? "WATCHING THE SYSTEM" : complete ? "LESSON COMPLETE" : "READY"}</span><strong>{step === 0 ? "Press play and follow each decision." : complete ? item.outcome : item.steps[step - 1]}</strong></div><div className="story-steps">{item.steps.map((text,index) => <div key={text} className={step > index ? "seen" : step === index + 1 ? "now" : ""}><span>{index + 1}</span><p>{text}</p></div>)}</div><div className="story-actions"><button className="secondary" onClick={() => { setStep(0); setPlaying(false); }}>Reset</button><button className="primary" onClick={playing ? () => setPlaying(false) : step > 0 && !complete ? () => setPlaying(true) : run}>{playing ? "Pause" : step > 0 && !complete ? "Continue" : complete ? "Run again" : "Play this scenario"} <span>→</span></button></div></div>
    </div>
  </section>;
}
