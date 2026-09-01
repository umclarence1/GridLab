"use client";

import { useState } from "react";
import type { Mission } from "./GameApp";

type View = "diagram" | "equipment";
type EquipmentKind = "grid" | "transformer" | "ct" | "relay" | "breaker" | "load";

function EquipmentIcon({kind}:{kind:EquipmentKind}) {
  if (kind === "grid") return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8 18 70M40 8l22 62M25 31h30M21 45h38M16 70h48M34 19h12"/><path d="M29 31 40 45l11-14M25 45l15 25 15-25"/></svg>;
  if (kind === "transformer") return <svg viewBox="0 0 80 80" aria-hidden="true"><rect x="15" y="17" width="50" height="48" rx="8"/><path d="M24 17V9M40 17V9M56 17V9M24 65v7M40 65v7M56 65v7"/><circle cx="33" cy="40" r="12"/><circle cx="47" cy="40" r="12"/></svg>;
  if (kind === "ct") return <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="24"/><circle cx="40" cy="40" r="12"/><path d="M40 4v24M40 52v24M18 18l12 12M62 18 50 30"/></svg>;
  if (kind === "relay") return <svg viewBox="0 0 80 80" aria-hidden="true"><rect x="13" y="10" width="54" height="60" rx="7"/><rect x="22" y="19" width="36" height="18" rx="3"/><path d="M27 50h26M27 58h16"/><circle cx="54" cy="57" r="4"/></svg>;
  if (kind === "breaker") return <svg viewBox="0 0 80 80" aria-hidden="true"><rect x="14" y="10" width="52" height="60" rx="8"/><path d="M40 4v17M40 59v17M25 26h30v28H25zM32 46l16-12"/></svg>;
  return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M12 39 40 14l28 25v31H12z"/><path d="M31 70V49h18v21M22 38v-12h10v4"/><path d="M20 44h8M52 44h8"/></svg>;
}

export default function PowerSystemSimulation({lesson,prediction,tick,playing,setTick,setPlaying,explain}:{lesson:Mission;prediction:string;tick:number;playing:boolean;setTick:(n:number)=>void;setPlaying:(p:boolean)=>void;explain:()=>void}){
  const [view,setView]=useState<View>("diagram");
  const normal=lesson.id===1, overload=lesson.id===6, earth=lesson.id===3||lesson.id===5, selective=lesson.id===5;
  const events=normal?["Source energised","Transformer supplies 11 kV bus","Main breaker is closed","Feeder current is normal","Hospital receives power","System remains healthy"]:overload?["Factory motors start","Load current increases","CT measures 780 A","Relay timer begins","Current falls below pickup","Breaker remains closed"]:earth?["System healthy","Phase A touches earth","Residual current appears","Earth relay picks up","Feeder breaker opens","Faulted feeder isolated"]:["System healthy","Three phases short together","Fault current surges","Overcurrent relay picks up","Feeder breaker opens","Fault current becomes zero"];
  const currents=normal?[0,35,78,120,120,120]:overload?[120,430,780,780,510,410]:earth?[120,2140,2140,2140,0,0]:[120,4820,4820,4820,0,0];
  const predictionCorrect=prediction===lesson.answer, hospitalWrong=selective&&prediction.includes("Hospital"), mainWrong=selective&&prediction.includes("Main");
  const feederOpen=!normal&&!overload&&tick>=4&&(!selective||predictionCorrect), mainOpen=mainWrong&&tick>=4, hospitalOpen=hospitalWrong&&tick>=4;
  const relayActive=tick>=3&&!normal&&tick<5, faultActive=tick>=1&&!normal&&!overload&&!(feederOpen||mainOpen), faultPersists=hospitalWrong&&tick>=4;
  const current=faultPersists?2140:currents[tick], voltage=normal?11000:overload?[11000,10850,10680,10750,10940,11000][tick]:faultPersists?7200:tick===0?11000:tick>=4?11000:earth?7200:900;
  const displayEvent=hospitalWrong&&tick===4?"Hospital breaker opens—the fault remains":hospitalWrong&&tick===5?"Hospital is off; residential fault still energised":mainWrong&&tick===4?"Main breaker opens":mainWrong&&tick===5?"Fault clears, but the whole substation is off":events[tick];
  const lineDead=feederOpen||mainOpen, loadOff=feederOpen||mainOpen, time=["—","0 ms","12 ms","112 ms","142 ms","144 ms"][tick];
  const equipment=[
    {kind:"grid" as EquipmentKind,name:"Grid supply",tag:"33 kV source",state:"ENERGISED",active:true},
    {kind:"transformer" as EquipmentKind,name:"Power transformer",tag:"T1 · 33/11 kV",state:"IN SERVICE",active:!mainOpen},
    {kind:"ct" as EquipmentKind,name:"Current transformer",tag:"CT · 600/5 A",state:`${current.toLocaleString()} A`,active:!lineDead},
    {kind:"relay" as EquipmentKind,name:earth?"Earth-fault relay":"Overcurrent relay",tag:earth?"51N protection":"51 protection",state:relayActive?"PICKED UP":"MONITORING",active:relayActive,warning:relayActive},
    {kind:"breaker" as EquipmentKind,name:"Feeder breaker",tag:"52-F1 · vacuum CB",state:feederOpen?"OPEN":"CLOSED",active:!feederOpen,danger:feederOpen},
    {kind:"load" as EquipmentKind,name:lesson.id===6?"Factory load":"Community load",tag:lesson.id===6?"Motor feeder":"Residential feeder",state:loadOff?"NO POWER":"POWERED",active:!loadOff},
  ];

  return <div className={`ps-sim ps-lesson-${lesson.id} ps-tick-${tick} ${view}`}>
    <header className="sim-command-bar"><div className="sim-live-state"><span className={playing?"running":tick===5?"complete":"paused"}>{playing?"● LIVE":tick===5?"✓ COMPLETE":"PAUSED"}</span><strong>{displayEvent}</strong></div><div className="view-toggle" aria-label="Simulation view"><button className={view==="diagram"?"active":""} onClick={()=>setView("diagram")}><i>⌁</i> Circuit diagram</button><button className={view==="equipment"?"active":""} onClick={()=>setView("equipment")}><i>▦</i> Real equipment</button></div><div className="ps-clock"><span>EVENT TIME</span><b>{time}</b></div></header>
    <div className="sim-story-strip"><span>NOW</span><p>{displayEvent}</p><div><b>{current.toLocaleString()} A</b><small>{current>1000?"dangerous fault current":current>600?"high current":"within normal range"}</small></div></div>
    {view==="diagram"?<div className="ps-workspace">
      <div className="ps-explainer"><b>SINGLE-LINE VIEW</b><span>Follow power from the source to the customer. Blue means energised; a dashed line means disconnected.</span></div>
      <div className="ps-source component"><b>~</b><span>Grid supply<small>33 kV</small></span></div><div className="ps-line source-line"><i/><i/><i/></div>
      <div className="ps-transformer component"><b><i/><i/></b><span>Transformer<small>T1 · 33/11 kV</small></span></div><div className="ps-line transformer-line"><i/><i/><i/></div>
      <div className={`ps-main-breaker breaker component ${mainOpen?"open":""}`}><b><i/></b><span>Main breaker<small>{mainOpen?"OPEN":"CLOSED"}</small></span></div>
      <div className={`ps-bus ${lesson.id===5&&faultActive?"bus-fault":""}`}><span>11 kV main bus</span></div>
      <div className="ps-ct component"><b>CT</b><span>Current sensor<small>{current.toLocaleString()} A measured</small></span></div>
      <div className={`ps-relay component ${relayActive?"picked-up":""}`}><b>{earth?"51N":"51"}</b><span>Protection relay<small>{relayActive?"PICKED UP":"MONITORING"}</small></span></div>
      <div className={`trip-signal ${tick>=3&&!normal&&!overload?"sent":""}`}><i/><span>TRIP COMMAND</span></div>
      <div className={`ps-feeder-breaker breaker component ${feederOpen?"open":""}`}><b><i/></b><span>Feeder breaker<small>{feederOpen?"OPEN":"CLOSED"}</small></span></div>
      <div className={`ps-feeder-wire ${lineDead?"dead":""}`}><i/><i/><i/></div>
      <div className={`ps-fault ${faultActive?"visible":""} ${earth?"earth":"phase"}`}><b>{earth?"A–G":"3Φ"}</b><span>{earth?"Phase A to earth":"Three-phase fault"}</span>{earth&&<i className="ground-symbol"/>}</div>
      <div className={`ps-load primary-load ${loadOff?"off":""}`}><b>{lesson.id===6?"F":"R"}</b><span>{lesson.id===6?"Factory":"Residential area"}<small>{loadOff?"NO POWER":overload?"MOTORS STARTING":"POWERED"}</small></span></div>
      <div className={`ps-healthy-feeder ${hospitalOpen||mainOpen?"off":""}`}><i/><div><b>H</b><span>Hospital<small>{hospitalOpen||mainOpen?"NO POWER":"POWERED"}</small></span></div></div>
      <div className="phase-monitor"><div><span>IA</span><b>{current.toLocaleString()} A</b></div><div><span>IB</span><b>{earth&&faultActive?"118 A":current.toLocaleString()+" A"}</b></div><div><span>IC</span><b>{earth&&faultActive?"121 A":current.toLocaleString()+" A"}</b></div><div><span>V BUS</span><b>{voltage.toLocaleString()} V</b></div></div>
    </div>:<div className="equipment-workspace">
      <div className="equipment-intro"><div><span>EQUIPMENT VIEW</span><strong>The same event—shown as the devices you would find in a substation.</strong></div><small>Power path →</small></div>
      <div className="equipment-chain">{equipment.map((item,index)=><div className="equipment-step" key={item.name}><article className={`${item.active?"active":""} ${item.warning?"warning":""} ${item.danger?"danger":""}`}><div className="equipment-visual"><EquipmentIcon kind={item.kind}/><span>{String(index+1).padStart(2,"0")}</span></div><div className="equipment-copy"><small>{item.tag}</small><strong>{item.name}</strong><b>{item.state}</b></div></article>{index<equipment.length-1&&<i className={lineDead&&index>=3?"dead":""}><span/></i>}</div>)}</div>
      {faultActive&&<div className="equipment-alarm"><b>⚠ FAULT DETECTED</b><span>{earth?"Current is escaping to earth on Phase A.":"The phase conductors are shorted together."}</span><strong>{current.toLocaleString()} A</strong></div>}
      <div className="equipment-help"><span>WHAT EACH DEVICE DOES</span><p><b>CT</b> measures current</p><p><b>Relay</b> decides when to trip</p><p><b>Breaker</b> physically interrupts current</p></div>
    </div>}
    <div className="ps-readings"><div><span>FEEDER CURRENT</span><strong>{current.toLocaleString()} A</strong><i><b style={{width:`${Math.min(100,current/50)}%`}}/></i></div><div><span>BUS VOLTAGE</span><strong>{voltage.toLocaleString()} V</strong><i><b style={{width:`${voltage/110}%`}}/></i></div><div><span>RELAY</span><strong>{relayActive?"PICKED UP":tick>=5?"RESET":"MONITORING"}</strong></div><div><span>FEEDER BREAKER</span><strong>{feederOpen?"OPEN":"CLOSED"}</strong></div></div>
    <div className="ps-events">{events.map((label,index)=><button key={label} className={tick===index?"current":tick>index?"passed":""} onClick={()=>{setTick(index);setPlaying(false)}}><span>{String(index+1).padStart(2,"0")}</span><p>{label}</p></button>)}</div>
    <div className="sim-controls"><button className="secondary" disabled={tick===0} onClick={()=>{setTick(Math.max(0,tick-1));setPlaying(false)}}>← Previous</button><button className="secondary" onClick={()=>setPlaying(!playing)}>{playing?"Pause":"▶ Auto play"}</button>{tick<5?<button className="primary" onClick={()=>{setTick(Math.min(5,tick+1));setPlaying(false)}}>Next event <span>→</span></button>:<button className="primary" onClick={explain}>Explain the result <span>→</span></button>}</div>
  </div>;
}
