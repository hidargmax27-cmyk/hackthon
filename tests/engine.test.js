const assert = require("node:assert/strict");
const CircuitSage = require("../src/resilience-engine.js");

function runTests() {
  const clean = CircuitSage.createSession();
  const cleanResult = clean.run("stablecoin-depeg");

  assert.equal(cleanResult.decision.mode, "normal");
  assert.equal(cleanResult.decision.requiresHuman, false);
  assert.ok(cleanResult.decision.confidence >= 80);
  assert.ok(cleanResult.events.every((event) => event.type === "success"));

  const llmDown = CircuitSage.createSession();
  const llmResult = llmDown.run("stablecoin-depeg", { plannerDown: true });

  assert.equal(llmResult.decision.mode, "degraded");
  assert.ok(llmResult.decision.evidence.some((line) => line.includes("deterministic rules")));
  assert.ok(llmResult.events.some((event) => event.service === "planner" && event.type === "failure"));
  assert.ok(llmResult.metrics.failovers >= 1);

  const corruptedPolicy = CircuitSage.createSession();
  const policyResult = corruptedPolicy.run("bridge-mint", { policyCorrupt: true });

  assert.equal(policyResult.decision.requiresHuman, true);
  assert.equal(policyResult.decision.autopilotAllowed, false);
  assert.equal(policyResult.decision.action, "Block autonomous execution and require signer review");
  assert.ok(policyResult.decision.evidence.some((line) => line.includes("policy integrity failed")));

  const circuitBreaker = CircuitSage.createSession();
  circuitBreaker.run("stablecoin-depeg", { plannerDown: true });
  const secondFailure = circuitBreaker.run("stablecoin-depeg", { plannerDown: true });
  const thirdRun = circuitBreaker.run("stablecoin-depeg", { plannerDown: true });

  assert.equal(secondFailure.state.planner.circuitOpen, true);
  assert.ok(thirdRun.events.some((event) => event.type === "circuit" && event.service === "planner"));

  const combinedChaos = CircuitSage.createSession();
  const chaosResult = combinedChaos.run("governance-exploit", {
    plannerDown: true,
    oracleTimeout: true,
    marketStale: true,
    vaultSlow: true,
    policyCorrupt: true
  });

  assert.equal(chaosResult.decision.requiresHuman, true);
  assert.ok(chaosResult.decision.confidence < cleanResult.decision.confidence);
  assert.ok(chaosResult.metrics.auditEvents >= 6);
}

runTests();
console.log("CircuitSage engine tests passed");
