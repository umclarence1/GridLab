import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the production GridLab experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>GridLab — Learn to Think Like a Protection Engineer<\/title>/i);
  assert.match(html, /Think fast\./);
  assert.match(html, /Protect the grid\./);
  assert.match(html, /Start learning/);
  assert.match(html, /LIVE TRAINING SCENARIO/);
  assert.match(html, /Hospital feeder protected/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("keeps the production navigation and learning flow in source", async () => {
  const [app, mission, simulation, lab, css] = await Promise.all([
    readFile(new URL("../app/GameApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/LearnExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PowerSystemSimulation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/AdvancedLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(app, /Start learning/);
  assert.match(app, /Browse missions/);
  assert.match(app, /mission-grid/);
  assert.doesNotMatch(app, /disabled=\{!unlocked\}/);
  assert.match(mission, /Situation/);
  assert.match(mission, /Run my decision/);
  assert.match(mission, /WHAT HAPPENED/);
  assert.match(simulation, /Circuit diagram/);
  assert.match(simulation, /Real equipment/);
  assert.match(simulation, /Current transformer/);
  assert.match(simulation, /Feeder breaker/);
  assert.match(simulation, /FAULT DETECTED/);
  assert.match(lab, /Open simulator/);
  assert.match(lab, /Nearest breaker opens/);
  assert.match(css, /Production usability pass/);
  assert.match(css, /font-size:14px/);
});
