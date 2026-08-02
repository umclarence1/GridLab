"use client";

import { useEffect, useState } from "react";

type Progress = { xp: number; completed: string[]; badges: string[] };
const empty: Progress = { xp: 0, completed: [], badges: [] };

export function awardProgress(id: string, xp: number, badge?: string) {
  const stored = window.localStorage.getItem("gridlab-progress");
  const data: Progress = stored ? JSON.parse(stored) : { ...empty };
  if (data.completed.includes(id)) return;
  data.completed.push(id); data.xp += xp;
  if (badge && !data.badges.includes(badge)) data.badges.push(badge);
  window.localStorage.setItem("gridlab-progress", JSON.stringify(data));
  window.dispatchEvent(new Event("gridlab-progress"));
}

export default function ProgressHUD() {
  const [progress, setProgress] = useState<Progress>(empty);
  useEffect(() => {
    const read = () => { const stored = window.localStorage.getItem("gridlab-progress"); setProgress(stored ? JSON.parse(stored) : empty); };
    read(); window.addEventListener("gridlab-progress", read); return () => window.removeEventListener("gridlab-progress", read);
  }, []);
  const level = Math.floor(progress.xp / 100) + 1;
  const withinLevel = progress.xp % 100;
  return <div className="progress-hud"><div className="learner-rank"><b>{level}</b><span><small>CURRENT RANK</small><strong>{level < 2 ? "Grid Apprentice" : level < 4 ? "Relay Technician" : "Protection Engineer"}</strong></span></div><div className="xp-meter"><span><small>LEVEL {level}</small><b>{withinLevel} / 100 XP</b></span><i><b style={{width:`${withinLevel}%`}}/></i></div><div className="hud-stat"><small>MISSIONS</small><strong>{progress.completed.length}<span>/6</span></strong></div><div className="hud-stat"><small>BADGES</small><strong>{progress.badges.length}</strong></div></div>;
}
