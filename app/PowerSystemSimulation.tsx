"use client";

import { useState } from "react";
import type { Lesson } from "./GameApp";

export default function PowerSystemSimulation({lesson,tick,playing,setTick,setPlaying,explain}:{lesson:Lesson;tick:number;playing:boolean;setTick:(n:number)=>void;setPlaying:(p:boolean)=>void;explain:()=>void}){
  const [view,setView]=useState<"beginner"|"engineering">("beginner");
  const normal=lesson.id===1, overload=lesson.id===6, earth=lesson.id===3||lesson.id===5, selective=lesson.id===5;
  const event=normal?["Source energized","Transformer supplies 11 kV bus","Main breaker is closed","Feeder current is normal","Hospital receives power","System remains healthy"]:overload?["Factory motors start","Load current increases","CT measures 780 A","Relay timer begins","Current falls below pickup","Breaker remains closed"]:earth?["System healthy", "Phase A touches earth", "Residual current appears", "Earth relay picks up", "Feeder breaker opens", "Faulted feeder isolated"]:["System healthy","Three phases short together","Fault current surges","Overcurrent relay picks up","Feeder breaker opens","Fault current becomes zero"];
  const currents=normal?[0,35,78,120,120,120]:overload?[120,430,780,780,510,410]:earth?[120,2140,2140,2140,0,0]:[120,4820,4820,4820,0,0];
  const current=currents[tick]; const voltage=normal?11000:overload?[11000,10850,10680,10750,10940,11000][tick]:tick===0?11000:tick>=4?11000:earth?7200:900;
  const feederOpen=!normal&&!overload&&tick>=4; const relayActive=tick>=3&&!normal&&tick<5; const faultActive=tick>=1&&!normal&&!overload&&tick<5;
  return <div className={`ps-sim ps-lesson-${lesson.id} ps-tick-${tick} ${view}`}>
    <header><div><span>{playing?"● RUNNING":tick===5?"COMPLETE":"PAUSED"}</span><strong>{event[tick]}</strong></div><div className="view-toggle"><button className={view==="beginner"?"active":""} onClick={()=>setView("beginner")}>Beginner</button><button className={view==="engineering"?"active":""} onClick={()=>setView("engineering")}>Engineering</button></div><div className="ps-clock"><span>TIME</span><b>{["—","0 ms","12 ms","112 ms","142 ms","144 ms"][tick]}</b></div></header>
    <div className="ps-workspace">
      <div className="ps-explainer">{view==="beginner"?event[tick]:`Vbus ${voltage.toLocaleString()} V · If ${current.toLocaleString()} A · ${feederOpen?"52-F1 OPEN":"52-F1 CLOSED"}`}</div>
      <div className="ps-source component"><b>~</b><span>{view==="beginner"?"Grid supply":"Infinite bus"}<small>33 kV</small></span></div>
      <div className="ps-line source-line"><i/><i/><i/></div>
      <div className="ps-transformer component"><b><i/><i/></b><span>{view==="beginner"?"Transformer":"T1 33/11 kV"}<small>Changes voltage</small></span></div>
      <div className="ps-line transformer-line"><i/><i/><i/></div>
      <div className="ps-main-breaker breaker component"><b><i/></b><span>{view==="beginner"?"Main safety switch":"52-M MAIN CB"}<small>CLOSED</small></span></div>
      <div className={`ps-bus ${lesson.id===5&&faultActive?"bus-fault":""}`}><span>{view==="beginner"?"Main connection":"11 kV BUS A"}</span></div>
      <div className="ps-ct component"><b>CT</b><span>{view==="beginner"?"Current sensor":"CT 600/5 A"}<small>Measures {current.toLocaleString()} A</small></span></div>
      <div className={`ps-relay component ${relayActive?"picked-up":""}`}><b>{earth?"51N":"51"}</b><span>{view==="beginner"?"Protection relay":earth?"Earth OC relay":"Phase OC relay"}<small>{relayActive?"PICKUP":"MONITORING"}</small></span></div>
      <div className={`trip-signal ${tick>=3&&!normal&&!overload?"sent":""}`}><i/><span>TRIP SIGNAL</span></div>
      <div className={`ps-feeder-breaker breaker component ${feederOpen?"open":""}`}><b><i/></b><span>{view==="beginner"?"Feeder safety switch":"52-F1 FEEDER CB"}<small>{feederOpen?"OPEN":"CLOSED"}</small></span></div>
      <div className={`ps-feeder-wire ${feederOpen?"dead":""}`}><i/><i/><i/></div>
      <div className={`ps-fault ${faultActive?"visible":""} ${earth?"earth":"phase"}`}><b>{earth?"A-G":"3Φ"}</b><span>{earth?"Phase A to earth":"Three-phase fault"}</span>{earth&&<i className="ground-symbol"/>}</div>
      <div className={`ps-load primary-load ${feederOpen?"off":""}`}><b>{lesson.id===6?"F":"R"}</b><span>{lesson.id===6?"Factory":"Residential area"}<small>{feederOpen?"NO POWER":overload?"MOTORS STARTING":"POWERED"}</small></span></div>
      <div className="ps-healthy-feeder"><i/><div><b>H</b><span>Hospital<small>POWERED</small></span></div></div>
      {view==="engineering"&&<div className="phase-monitor"><div><span>IA</span><b>{current.toLocaleString()} A</b></div><div><span>IB</span><b>{earth&&faultActive?"118 A":current.toLocaleString()+" A"}</b></div><div><span>IC</span><b>{earth&&faultActive?"121 A":current.toLocaleString()+" A"}</b></div><div><span>V BUS</span><b>{voltage.toLocaleString()} V</b></div></div>}
    </div>
    <div className="ps-readings"><div><span>FEEDER CURRENT</span><strong>{current.toLocaleString()} A</strong><i><b style={{width:`${Math.min(100,current/50)}%`}}/></i></div><div><span>BUS VOLTAGE</span><strong>{voltage.toLocaleString()} V</strong><i><b style={{width:`${voltage/110}%`}}/></i></div><div><span>RELAY</span><strong>{relayActive?"PICKED UP":tick>=5?"RESET":"MONITORING"}</strong></div><div><span>FEEDER BREAKER</span><strong>{feederOpen?"OPEN":"CLOSED"}</strong></div></div>
    <div className="ps-events">{event.map((label,index)=><button key={label} className={tick===index?"current":tick>index?"passed":""} onClick={()=>{setTick(index);setPlaying(false)}}><span>{index+1}</span><p>{label}</p></button>)}</div>
    <div className="sim-controls"><button className="secondary" disabled={tick===0} onClick={()=>{setTick(Math.max(0,tick-1));setPlaying(false)}}>← Previous</button><button className="secondary" onClick={()=>setPlaying(!playing)}>{playing?"Pause":"Auto play"}</button>{tick<5?<button className="primary" onClick={()=>{setTick(Math.min(5,tick+1));setPlaying(false)}}>Next event <span>→</span></button>:<button className="primary" onClick={explain}>Explain the result <span>→</span></button>}</div>
  </div>
}
