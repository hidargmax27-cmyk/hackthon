const fs = require("node:fs");
const path = require("node:path");
const CircuitSage = require("../src/resilience-engine.js");

const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });

const cases = [
  ["stablecoin-depeg", {}],
  ["stablecoin-depeg", { plannerDown: true }],
  ["bridge-mint", { plannerDown: true, oracleTimeout: true, policyCorrupt: true }],
  ["liquidation-cascade", { marketStale: true, vaultSlow: true }],
  ["governance-exploit", { policyCorrupt: true }]
];

const session = CircuitSage.createSession();
const traces = [];
const scores = [];

for (const [scenarioId, chaos] of cases) {
  const startedAt = new Date().toISOString();
  const result = session.run(scenarioId, chaos);

  traces.push({
    trace_id: `${scenarioId}-${traces.length + 1}`,
    span_name: "CircuitSage.run_risk_scenario",
    started_at: startedAt,
    attributes: {
      "openinference.span.kind": "AGENT",
      "input.scenario_id": scenarioId,
      "input.chaos": JSON.stringify(chaos),
      "output.action": result.decision.action,
      "output.status": result.decision.status,
      "output.risk_score": result.decision.riskScore,
      "output.confidence": result.decision.confidence,
      "eval.name": result.evaluation.name,
      "eval.score": result.evaluation.score,
      "eval.grade": result.evaluation.grade,
      "eval.labels": result.evaluation.labels.join(",")
    },
    events: result.events.map((event, index) => ({
      name: `dependency.${index + 1}`,
      attributes: event
    }))
  });

  scores.push({
    scenarioId,
    action: result.decision.action,
    requiresHuman: result.decision.requiresHuman,
    confidence: result.decision.confidence,
    evalScore: result.evaluation.score,
    grade: result.evaluation.grade,
    labels: result.evaluation.labels,
    promptPatch: result.evaluation.promptPatch
  });
}

fs.writeFileSync(
  path.join(outDir, "phoenix-openinference-traces.ndjson"),
  traces.map((trace) => JSON.stringify(trace)).join("\n") + "\n"
);

fs.writeFileSync(path.join(outDir, "eval-summary.json"), JSON.stringify(scores, null, 2));

const average = Math.round(scores.reduce((sum, score) => sum + score.evalScore, 0) / scores.length);
console.log(`Wrote ${traces.length} traces to observability/out`);
console.log(`Average Phoenix-style eval score: ${average}/100`);
