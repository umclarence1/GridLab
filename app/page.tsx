"use client";

import { useEffect, useState } from "react";
import AdvancedLab from "./AdvancedLab";
import LearnScenarios from "./LearnScenarios";

type ComponentKey = "source" | "relay" | "breaker" | "feeder";

const components: Record<ComponentKey, { name: string; short: string; description: string }> = {
  source: { name: "Power source", short: "Supplies electricity", description: "The grid supplies electricity to the substation. In this lesson, it delivers power at 11,000 volts." },
  relay: { name: "Protection relay", short: "Detects danger", description: "The relay watches the current. If it becomes dangerously high, the relay tells the breaker to open." },
  breaker: { name: "Circuit breaker", short: "Disconnects the fault", description: "The breaker is a powerful safety switch. It opens the circuit when the relay sends a trip command." },
  feeder: { name: "Feeder", short: "Carries power to customers", description: "A feeder carries electricity from the substation to a group of homes, buildings or machines." },
};

const phases = [
  { title: "Normal operation", text: "Electricity is flowing safely to both buildings.", action: "Everything is working normally.", current: "120 A" },
  { title: "A short circuit occurs", text: "Two conductors make an unintended connection on Feeder 1.", action: "Current rises very quickly.", current: "4,820 A" },
  { title: "The relay detects danger", text: "The relay sees that the current is above its safe limit.", action: "It starts its protection timer.", current: "4,820 A" },
  { title: "The relay sends a trip command", text: "The dangerous current has lasted long enough to confirm a real fault.", action: "The relay tells Breaker 1 to open.", current: "4,820 A" },
  { title: "The breaker opens", text: "Breaker 1 disconnects the damaged feeder from the power source.", action: "Fault current stops flowing.", current: "0 A" },
  { title: "The fault is safely isolated", text: "Building A loses power, but the healthy feeder continues supplying Building B.", action: "Only the smallest necessary area was disconnected.", current: "0 A" },
];

export default function Home() {
  const [mode, setMode] = useState<"learn" | "lab">("learn");
  const [lesson, setLesson] = useState(0);
  const [selected, setSelected] = useState<ComponentKey>("relay");
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [labScenario, setLabScenario] = useState("correct");
  const [labResult, setLabResult] = useState(false);
  const [labPhase, setLabPhase] = useState(0);
  const [moreLesson, setMoreLesson] = useState<"overload" | "coordination" | "restoration" | null>(null);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setPhase(current => {
        if (current >= phases.length - 1) { setPlaying(false); return current; }
        return current + 1;
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!labResult || labPhase >= 4) return;
    const timer = window.setTimeout(() => setLabPhase(value => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [labResult, labPhase]);

  function startSimulation() { setPhase(1); setPlaying(true); }
  function resetSimulation() { setPhase(0); setPlaying(false); }
  function goTo(next: number) { setLesson(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  const fault = phase >= 1 && phase < 5;
  const relayActive = phase >= 2 && phase < 5;
  const breakerOpen = phase >= 4;

  return (
    <main>
      <header className="header">
        <button className="logo" onClick={() => { setMode("learn"); goTo(0); }}><span>G</span><strong>GridLab</strong></button>
        <div className="mode-switch" aria-label="Experience mode"><button className={mode === "learn" ? "active" : ""} onClick={() => setMode("learn")}>Learn</button><button className={mode === "lab" ? "active" : ""} onClick={() => setMode("lab")}>Advanced lab</button></div>
        <p>Educational simulator</p>
      </header>

      {mode === "learn" ? <>
        <div className="progress" aria-label={`Lesson ${lesson + 1} of 4`}><div>{["Welcome", "Meet the system", "Watch a fault", "Check your learning"].map((label, index) => <button key={label} className={lesson === index ? "current" : lesson > index ? "done" : ""} onClick={() => index <= lesson && goTo(index)}><span>{lesson > index ? "✓" : index + 1}</span><small>{label}</small></button>)}</div><i style={{ width: `${(lesson / 3) * 100}%` }} /></div>

        {lesson === 0 && <section className="welcome lesson-page">
          <p className="eyebrow">DEMO WEDNESDAY · EPISODE 01</p>
          <h1>What happens when<br />electricity goes wrong?</h1>
          <p className="intro">Follow one short circuit from the moment it begins until the power system makes itself safe. No previous protection knowledge needed.</p>
          <button className="primary" onClick={() => goTo(1)}>Start the guided lesson <span>→</span></button>
          <div className="promise"><span>About 3 minutes</span><span>Plain-language explanations</span><span>Learn at your own pace</span></div>
          <div className="mini-flow" aria-label="Lesson overview"><div><b>1</b><strong>A fault occurs</strong></div><i /><div><b>2</b><strong>Danger is detected</strong></div><i /><div><b>3</b><strong>The fault is disconnected</strong></div></div>
        </section>}

        {lesson === 1 && <section className="lesson-page learn-components">
          <div className="lesson-heading"><p className="eyebrow">STEP 1 OF 3</p><h1>Meet the protection system</h1><p>Click each component to learn its job. We will use all four during the simulation.</p></div>
          <div className="component-layout">
            <div className="simple-system">{(["source", "relay", "breaker", "feeder"] as ComponentKey[]).map((key, index) => <div key={key} className="system-part-wrap">{index > 0 && <i className="connector" />}<button className={`system-part ${selected === key ? "selected" : ""}`} onClick={() => setSelected(key)}><span>{key === "source" ? "~" : key === "relay" ? "!" : key === "breaker" ? "—/" : "→"}</span><strong>{components[key].name}</strong><small>{components[key].short}</small></button></div>)}</div>
            <aside className="definition"><p>SELECTED COMPONENT</p><span className="definition-icon">{selected === "source" ? "~" : selected === "relay" ? "!" : selected === "breaker" ? "—/" : "→"}</span><h2>{components[selected].name}</h2><p>{components[selected].description}</p><div className="analogy"><strong>Think of it like:</strong> {selected === "source" ? "the water supply entering a building." : selected === "relay" ? "a smoke detector that notices danger." : selected === "breaker" ? "an automatic safety door that shuts off the danger." : "a road carrying electricity to its destination."}</div></aside>
          </div>
          <div className="lesson-actions"><button className="secondary" onClick={() => goTo(0)}>Back</button><button className="primary" onClick={() => goTo(2)}>I understand — show me a fault <span>→</span></button></div>
        </section>}

        {lesson === 2 && <section className="lesson-page simulation-lesson">
          <div className="lesson-heading"><p className="eyebrow">STEP 2 OF 3</p><h1>Watch the system protect itself</h1><p>One event will be highlighted at a time. Follow the explanation below the diagram.</p></div>
          <div className={`guided-simulator phase-${phase} ${fault ? "has-fault" : ""}`}>
            <div className="simulation-status"><span className={playing ? "live" : ""}>{playing ? "LIVE SIMULATION" : phase === 5 ? "FAULT CLEARED" : "INTERACTIVE MODEL"}</span><p>{phase === 0 ? "Black pulses show electricity moving to both buildings." : phase < 4 ? "Watch the fault, relay, and breaker—the active part turns black." : "The broken line shows where the dangerous current was stopped."}</p></div>
            <div className="large-system">
              <div className="diagram-source"><span>~</span><strong>Power source</strong><small>Supplying electricity</small></div><i className={breakerOpen ? "line off" : "line"} />
              <div className={`diagram-relay ${relayActive ? "active" : ""}`}><span>!</span><strong>Protection relay</strong><small>{relayActive ? phase >= 3 ? "Trip command sent" : "Danger detected" : "Watching the current"}</small></div>
              <div className={`diagram-breaker ${breakerOpen ? "open" : ""}`}><span><i /></span><strong>Breaker 1</strong><small>{breakerOpen ? "OPEN" : "CLOSED"}</small></div><i className={breakerOpen ? "line off" : "line"} />
              <div className="split"><div className={breakerOpen ? "branch off" : "branch"}><span>Building A</span>{fault && <b className="fault">SHORT<br />CIRCUIT</b>}</div><div className="branch"><span>Building B</span><small>Still powered</small></div></div>
            </div>
            <div className="reading-strip"><span>CURRENT ON FEEDER 1</span><strong>{phases[phase].current}</strong><small>{fault ? "Dangerously high" : breakerOpen ? "Disconnected" : "Normal"}</small></div>
            <div className="diagram-legend"><span><i className="flowing"/>Electricity flowing</span><span><i className="danger"/>Danger detected</span><span><i className="stopped"/>Circuit disconnected</span></div>
          </div>
          <article className="step-explanation"><span className="step-number">{phase + 1}</span><div><p>{playing ? "SIMULATION RUNNING" : phase === 0 ? "READY TO BEGIN" : phase === 5 ? "SIMULATION COMPLETE" : "SIMULATION PAUSED"}</p><h2>{phases[phase].title}</h2><p>{phases[phase].text}</p><strong>{phases[phase].action}</strong></div></article>
          <div className="phase-dots">{phases.map((item, index) => <button key={item.title} aria-label={item.title} className={phase === index ? "active" : phase > index ? "passed" : ""} onClick={() => { setPlaying(false); setPhase(index); }}>{index + 1}</button>)}</div>
          <div className="lesson-actions"><button className="secondary" onClick={resetSimulation}>Reset</button>{phase === 0 ? <button className="primary" onClick={startSimulation}>Start short-circuit simulation <span>→</span></button> : playing ? <button className="primary" onClick={() => setPlaying(false)}>Pause simulation</button> : phase < 5 ? <button className="primary" onClick={() => setPlaying(true)}>Continue <span>→</span></button> : <button className="primary" onClick={() => goTo(3)}>What did I learn? <span>→</span></button>}</div>
        </section>}

        {lesson === 3 && <section className="lesson-page review">
          <div className="lesson-heading"><p className="eyebrow">STEP 3 OF 3</p><h1>You just cleared a power-system fault</h1><p>Here is the complete protection sequence in plain language.</p></div>
          <div className="sequence-summary">{["Short circuit", "Current rises", "Relay detects danger", "Breaker opens", "Fault is isolated"].map((item, index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong>{index < 4 && <i>→</i>}</div>)}</div>
          <div className="quiz"><p>QUICK CHECK</p><h2>Why did only Building A lose power?</h2>{["The power source stopped working", "The breaker isolated only the faulty feeder", "Building B has its own power station"].map((option, index) => <button key={option} className={answer === option ? index === 1 ? "correct" : "wrong" : ""} onClick={() => setAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{answer && <div className={`feedback ${answer.includes("isolated") ? "correct" : ""}`}><strong>{answer.includes("isolated") ? "Correct." : "Not quite."}</strong> {answer.includes("isolated") ? "Good protection disconnects the smallest possible part of the system, keeping healthy areas powered." : "The source was still working. Try thinking about what the breaker disconnected."}</div>}</div>
          <div className="key-lesson"><span>THE BIG IDEA</span><h2>Protection is about detecting danger and disconnecting only what is necessary.</h2><p>The relay detects the fault. The breaker removes it. The healthy part of the system keeps working.</p></div>
          <section className="next-lessons"><p className="eyebrow">CONTINUE LEARNING</p><h2>One fault is only the beginning.</h2><div>{[
            { id: "overload" as const, n: "02", title: "Fault or overload?", text: "Why high current should not always cause an instant trip." },
            { id: "coordination" as const, n: "03", title: "Protection coordination", text: "Why the breaker nearest the fault should operate first." },
            { id: "restoration" as const, n: "04", title: "Restore the system", text: "How healthy equipment returns safely to service." }
          ].map(item => <button key={item.id} className={moreLesson === item.id ? "active" : ""} onClick={() => setMoreLesson(moreLesson === item.id ? null : item.id)}><span>{item.n}</span><strong>{item.title}</strong><p>{item.text}</p></button>)}</div>{moreLesson && <article><span>MICRO-LESSON</span><h3>{moreLesson === "overload" ? "Current and time must be judged together." : moreLesson === "coordination" ? "Primary protection acts first; backup protection waits." : "Isolation must be confirmed before power returns."}</h3><p>{moreLesson === "overload" ? "Equipment can briefly draw high current normally. A relay uses current and time together, allowing short starting surges while disconnecting sustained danger." : moreLesson === "coordination" ? "If every breaker opened for one feeder fault, the whole substation would go dark. Selectivity disconnects the smallest possible section while upstream protection waits as backup." : "Operators identify the cause, isolate damage, test the healthy section, and restore loads gradually. Reclosing without checking can energise the same fault again."}</p><button className="primary" onClick={() => setMode("lab")}>Test this in Advanced Lab <span>→</span></button></article>}</section>
          <div className="lesson-actions"><button className="secondary" onClick={() => { setAnswer(null); goTo(2); }}>Watch again</button><button className="primary" onClick={() => setMode("lab")}>Try the advanced lab <span>→</span></button></div>
        </section>}
        {lesson === 3 && <LearnScenarios />}
      </> : <><AdvancedLab /><section className="legacy-lab" hidden>
        <div className="lab-intro"><p className="eyebrow">ADVANCED LAB</p><h1>Change the protection. See the consequence.</h1><p>This area assumes you completed the guided lesson. Choose a scenario and compare which parts of the system lose power.</p><button className="text-button" onClick={() => setMode("learn")}>← Return to guided lesson</button></div>
        <div className="scenario-grid">{[{ id: "correct", n: "01", title: "Correct coordination", text: "The nearest breaker clears the fault." },{ id: "too-fast", n: "02", title: "Main relay too fast", text: "The upstream breaker trips unnecessarily." },{ id: "failure", n: "03", title: "Feeder breaker fails", text: "Backup protection must operate." }].map(item => <button key={item.id} className={labScenario === item.id ? "selected" : ""} onClick={() => { setLabScenario(item.id); setLabResult(false); setLabPhase(0); }}><span>{item.n}</span><strong>{item.title}</strong><p>{item.text}</p></button>)}</div>
        <div className="lab-console"><div><span>FAULT LOCATION</span><strong>Feeder 1</strong></div><div><span>EXPECTED PRIMARY DEVICE</span><strong>Breaker 1</strong></div><button className="primary" onClick={() => { setLabPhase(1); setLabResult(true); }}>Run animated scenario <span>→</span></button></div>
        <div className={`lab-simulation ${labResult ? "running" : ""}`}><div className="lab-grid"><div className="lab-source"><b>~</b><span>Source</span></div><i className={labPhase >= 4 && labScenario !== "correct" ? "off" : ""}/><div className={`lab-device ${labPhase >= 4 && labScenario !== "correct" ? "open" : ""}`}><b>MB</b><span>Main breaker</span></div><i className={labPhase >= 4 && labScenario !== "correct" ? "off" : ""}/><div className="lab-bus"><strong>BUS</strong><div className={`lab-feeder ${labPhase >= 1 ? "faulted" : ""} ${labPhase >= 4 && labScenario === "correct" ? "isolated" : ""}`}><b>B1</b><span>Building A</span><em>{labPhase >= 1 && labPhase < 4 ? "FAULT" : labPhase >= 4 ? "OFF" : "ON"}</em></div><div className={labPhase >= 4 && labScenario !== "correct" ? "lab-feeder isolated" : "lab-feeder"}><b>B2</b><span>Building B</span><em>{labPhase >= 4 && labScenario !== "correct" ? "OFF" : "ON"}</em></div></div></div><div className="lab-timeline">{["Fault occurs", "Relay detects 4,820 A", labScenario === "too-fast" ? "Main relay races feeder relay" : "Trip command sent", labScenario === "failure" ? "Breaker 1 fails — backup trips" : labScenario === "too-fast" ? "Main breaker opens first" : "Breaker 1 opens"].map((event,index) => <div key={event} className={labPhase > index ? "active" : ""}><span>{index + 1}</span><p>{event}</p></div>)}</div></div>
        {labResult && labPhase >= 4 && <div className="lab-result"><span>{labScenario === "correct" ? "✓" : "!"}</span><div><p>SCENARIO RESULT</p><h2>{labScenario === "correct" ? "Protection remained selective" : labScenario === "too-fast" ? "Healthy customers lost power" : "Backup protection cleared the fault"}</h2><p>{labScenario === "correct" ? "Breaker 1 disconnected only the faulted feeder. Building B remained powered." : labScenario === "too-fast" ? "The main breaker opened before the feeder breaker. Both buildings lost power." : "Breaker 1 failed to open, so the main breaker disconnected both feeders to stop the fault."}</p></div></div>}
      </section></>}
      <footer><strong>GRIDLAB</strong><span>Interactive Protection Learning Laboratory</span><span>Educational approximation · Not for system design</span></footer>
    </main>
  );
}
