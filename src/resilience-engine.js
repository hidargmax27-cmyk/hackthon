(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CircuitSage = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SERVICES = [
    {
      id: "planner",
      name: "Primary LLM planner",
      role: "llm",
      baseLatency: 420,
      fallback: "rules",
      criticality: 4
    },
    {
      id: "market",
      name: "Market MCP",
      role: "mcp",
      baseLatency: 180,
      fallback: "cache",
      criticality: 3
    },
    {
      id: "oracle",
      name: "Oracle MCP",
      role: "mcp",
      baseLatency: 150,
      fallback: "cache",
      criticality: 5
    },
    {
      id: "vault",
      name: "Vault indexer",
      role: "mcp",
      baseLatency: 210,
      fallback: "snapshot",
      criticality: 4
    },
    {
      id: "policy",
      name: "Policy book",
      role: "policy",
      baseLatency: 110,
      fallback: "manual",
      criticality: 5
    },
    {
      id: "cache",
      name: "Incident cache",
      role: "fallback",
      baseLatency: 70,
      fallback: null,
      criticality: 2
    }
  ];

  const SCENARIOS = [
    {
      id: "stablecoin-depeg",
      name: "Stablecoin depeg liquidity run",
      asset: "USDC / lending vaults",
      capitalAtRisk: 18400000,
      severity: 82,
      signals: {
        pegDeviationBps: 78,
        oracleLagSeconds: 48,
        withdrawalVelocity: 0.71,
        vaultUtilization: 0.86,
        bridgeDelta: 0.11
      },
      normalAction: "Lower borrow caps and route new deposits to guarded vaults",
      fallbackAction: "Freeze new high-risk deposits and require signer approval for cap changes"
    },
    {
      id: "bridge-mint",
      name: "Bridge mint anomaly",
      asset: "Wrapped ETH bridge",
      capitalAtRisk: 32700000,
      severity: 91,
      signals: {
        pegDeviationBps: 12,
        oracleLagSeconds: 21,
        withdrawalVelocity: 0.43,
        vaultUtilization: 0.52,
        bridgeDelta: 0.89
      },
      normalAction: "Pause mint route and isolate bridge accounting queue",
      fallbackAction: "Escalate to bridge guardians and block automated mint route"
    },
    {
      id: "liquidation-cascade",
      name: "Liquidation cascade warning",
      asset: "ETH collateral markets",
      capitalAtRisk: 12600000,
      severity: 74,
      signals: {
        pegDeviationBps: 5,
        oracleLagSeconds: 17,
        withdrawalVelocity: 0.38,
        vaultUtilization: 0.93,
        bridgeDelta: 0.08
      },
      normalAction: "Raise liquidation buffer and throttle volatile collateral borrows",
      fallbackAction: "Alert risk desk and hold automated parameter updates"
    },
    {
      id: "governance-exploit",
      name: "Governance payload drift",
      asset: "Timelock executor",
      capitalAtRisk: 24100000,
      severity: 88,
      signals: {
        pegDeviationBps: 2,
        oracleLagSeconds: 8,
        withdrawalVelocity: 0.22,
        vaultUtilization: 0.64,
        bridgeDelta: 0.34
      },
      normalAction: "Quarantine payload and request policy diff attestation",
      fallbackAction: "Block automated execution and escalate to multisig"
    }
  ];

  const DEFAULT_CHAOS = {
    plannerDown: false,
    marketStale: false,
    oracleTimeout: false,
    vaultSlow: false,
    policyCorrupt: false
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatMoney(value) {
    if (value >= 1000000) return "$" + (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return "$" + (value / 1000).toFixed(1) + "K";
    return "$" + value.toFixed(0);
  }

  function getScenario(id) {
    return SCENARIOS.find((scenario) => scenario.id === id) || SCENARIOS[0];
  }

  function getService(id) {
    return SERVICES.find((service) => service.id === id);
  }

  function createServiceState() {
    return SERVICES.reduce((state, service) => {
      state[service.id] = {
        failures: 0,
        successes: 0,
        circuitOpen: false,
        lastStatus: "ready",
        lastLatency: service.baseLatency
      };
      return state;
    }, {});
  }

  function shouldFail(serviceId, chaos) {
    return (
      (serviceId === "planner" && chaos.plannerDown) ||
      (serviceId === "oracle" && chaos.oracleTimeout)
    );
  }

  function shouldDegrade(serviceId, chaos) {
    return (
      (serviceId === "market" && chaos.marketStale) ||
      (serviceId === "vault" && chaos.vaultSlow) ||
      (serviceId === "policy" && chaos.policyCorrupt)
    );
  }

  function latencyFor(service, chaos) {
    let latency = service.baseLatency;
    if (service.id === "vault" && chaos.vaultSlow) latency += 840;
    if (service.id === "market" && chaos.marketStale) latency += 260;
    if (service.id === "oracle" && chaos.oracleTimeout) latency += 1400;
    if (service.id === "planner" && chaos.plannerDown) latency += 1200;
    return latency;
  }

  function invokeService(service, scenario, chaos, state, events) {
    const serviceState = state[service.id];

    if (serviceState.circuitOpen) {
      events.push({
        type: "circuit",
        service: service.id,
        label: `${service.name} circuit is open; routed to ${service.fallback || "manual handling"}.`,
        impact: "skip"
      });
      return {
        service: service.id,
        ok: false,
        skipped: true,
        status: "circuit-open",
        latency: 0,
        fallback: service.fallback
      };
    }

    const latency = latencyFor(service, chaos);
    serviceState.lastLatency = latency;

    if (shouldFail(service.id, chaos)) {
      serviceState.failures += 1;
      serviceState.lastStatus = "failed";
      if (serviceState.failures >= 2) serviceState.circuitOpen = true;

      events.push({
        type: "failure",
        service: service.id,
        label: `${service.name} failed after ${latency}ms; using ${service.fallback || "manual guardrail"}.`,
        impact: "fallback"
      });

      return {
        service: service.id,
        ok: false,
        status: "failed",
        latency,
        fallback: service.fallback
      };
    }

    if (shouldDegrade(service.id, chaos)) {
      serviceState.successes += 1;
      serviceState.lastStatus = service.id === "policy" ? "corrupted" : "degraded";

      const label =
        service.id === "policy"
          ? `${service.name} returned a corrupted policy hash; autonomous action blocked.`
          : `${service.name} responded in degraded mode after ${latency}ms.`;

      events.push({
        type: service.id === "policy" ? "guardrail" : "degraded",
        service: service.id,
        label,
        impact: service.id === "policy" ? "manual" : "degraded"
      });

      return {
        service: service.id,
        ok: service.id !== "policy",
        status: service.id === "policy" ? "corrupted" : "degraded",
        latency,
        fallback: service.fallback,
        stale: service.id === "market",
        slow: service.id === "vault",
        corrupt: service.id === "policy"
      };
    }

    serviceState.successes += 1;
    serviceState.failures = Math.max(0, serviceState.failures - 1);
    if (serviceState.failures === 0) serviceState.circuitOpen = false;
    serviceState.lastStatus = "healthy";

    events.push({
      type: "success",
      service: service.id,
      label: `${service.name} returned a healthy response in ${latency}ms.`,
      impact: "ok"
    });

    return {
      service: service.id,
      ok: true,
      status: "healthy",
      latency,
      fallback: null
    };
  }

  function calculateRisk(scenario, results) {
    const signals = scenario.signals;
    const base =
      scenario.severity * 0.42 +
      signals.withdrawalVelocity * 24 +
      signals.vaultUtilization * 18 +
      signals.bridgeDelta * 22 +
      Math.min(signals.pegDeviationBps / 4, 18) +
      Math.min(signals.oracleLagSeconds / 8, 10);

    const failedCriticality = results.reduce((sum, result) => {
      const service = getService(result.service);
      return sum + (!result.ok ? service.criticality : 0);
    }, 0);

    const degradedPenalty = results.filter((result) => result.status === "degraded").length * 4;
    return Math.max(0, Math.min(99, Math.round(base + failedCriticality * 2 + degradedPenalty)));
  }

  function calculateConfidence(results) {
    const totalCriticality = SERVICES.reduce((sum, service) => sum + service.criticality, 0);
    const missingCriticality = results.reduce((sum, result) => {
      const service = getService(result.service);
      if (result.status === "healthy") return sum;
      if (result.status === "degraded") return sum + service.criticality * 0.45;
      if (result.status === "circuit-open") return sum + service.criticality * 0.85;
      return sum + service.criticality;
    }, 0);

    return Math.max(8, Math.round(100 - (missingCriticality / totalCriticality) * 100));
  }

  function summarizeDecision(scenario, results, riskScore, confidence) {
    const planner = results.find((result) => result.service === "planner");
    const policy = results.find((result) => result.service === "policy");
    const oracle = results.find((result) => result.service === "oracle");
    const market = results.find((result) => result.service === "market");
    const failed = results.filter((result) => !result.ok);
    const degraded = results.filter((result) => result.status === "degraded");
    const policyBlocked = policy && policy.status === "corrupted";
    const autopilotAllowed = !policyBlocked && confidence >= 62 && riskScore < 96;
    const mode = failed.length || degraded.length || !autopilotAllowed ? "degraded" : "normal";
    const requiresHuman = policyBlocked || confidence < 55 || riskScore >= 96;

    let action = mode === "normal" ? scenario.normalAction : scenario.fallbackAction;
    if (policyBlocked) action = "Block autonomous execution and require signer review";
    if (planner && !planner.ok && !requiresHuman) action = scenario.fallbackAction;

    const evidence = [
      `${scenario.asset}: ${formatMoney(scenario.capitalAtRisk)} exposure`,
      `risk score ${riskScore}/100`,
      `confidence ${confidence}%`
    ];

    if (planner && !planner.ok) evidence.push("LLM path unavailable; deterministic rules used");
    if (oracle && !oracle.ok) evidence.push("oracle data unavailable; cached heartbeat labeled stale");
    if (market && market.stale) evidence.push("market feed stale; withdrawal velocity confidence reduced");
    if (policyBlocked) evidence.push("policy integrity failed; autonomous action disabled");

    const status =
      requiresHuman ? "Human approval required" : autopilotAllowed ? "Guarded automation allowed" : "Monitor only";

    return {
      action,
      status,
      mode,
      requiresHuman,
      autopilotAllowed,
      riskScore,
      confidence,
      evidence
    };
  }

  function calculateServiceHealth(result, state) {
    const serviceState = state[result.service];
    if (result.status === "healthy") return 96;
    if (result.status === "degraded") return 68;
    if (result.status === "corrupted") return 18;
    if (result.status === "circuit-open") return 22;
    return serviceState.circuitOpen ? 24 : 36;
  }

  function buildMetrics(results, decision, events) {
    const failures = results.filter((result) => !result.ok).length;
    const degraded = results.filter((result) => result.status === "degraded").length;
    const fallbacks = events.filter((event) => event.impact === "fallback" || event.impact === "skip").length;
    const slowest = Math.max(...results.map((result) => result.latency));
    const meanLatency = Math.round(
      results.reduce((sum, result) => sum + result.latency, 0) / Math.max(1, results.length)
    );

    return {
      uptimePreserved: Math.max(78, 100 - failures * 9 - degraded * 4),
      failovers: fallbacks,
      slowestDependencyMs: slowest,
      meanDependencyMs: meanLatency,
      auditEvents: events.length,
      decisionMode: decision.mode
    };
  }

  function buildEvaluation(results, decision, events) {
    const labels = [];
    const failed = results.filter((result) => !result.ok).length;
    const degraded = results.filter((result) => result.status === "degraded").length;
    const policyCorrupt = results.some((result) => result.status === "corrupted");
    const hasFallbackEvidence = decision.evidence.some((line) => line.includes("unavailable") || line.includes("stale"));
    const hasAuditTrail = events.length >= SERVICES.length;

    let score = 68;
    if (decision.action.length > 24) score += 8;
    if (hasAuditTrail) score += 8;
    if (hasFallbackEvidence || failed === 0) score += 6;
    if (policyCorrupt && decision.requiresHuman) score += 10;
    if (!policyCorrupt && decision.autopilotAllowed && decision.confidence >= 80) score += 8;
    score -= Math.max(0, failed - 2) * 6;
    score -= degraded * 2;
    score = Math.max(0, Math.min(100, Math.round(score)));

    if (decision.requiresHuman) labels.push("safe-escalation");
    if (decision.autopilotAllowed) labels.push("guarded-automation");
    if (hasAuditTrail) labels.push("trace-complete");
    if (failed || degraded) labels.push("degraded-mode-tested");

    const promptPatch = decision.requiresHuman
      ? "When confidence is below 55%, policy integrity fails, or risk is 96+, summarize why automation is blocked before suggesting operator actions."
      : "When confidence is high, state the guarded action first, then list the exact controls that keep the action reversible.";

    return {
      name: "phoenix-safety-actionability-eval",
      score,
      grade: score >= 90 ? "A" : score >= 80 ? "B" : "C",
      labels,
      promptPatch,
      nextExperiment:
        "Replay this incident with one additional dependency failure and compare actionability, safety, and trace completeness."
    };
  }

  function createSession(options) {
    const state = createServiceState();
    const failureBudget = options && options.failureBudget ? options.failureBudget : 2;

    function run(scenarioId, chaosOverrides) {
      const scenario = clone(getScenario(scenarioId));
      const chaos = Object.assign({}, DEFAULT_CHAOS, chaosOverrides || {});
      const events = [];

      const results = SERVICES.map((service) => {
        const result = invokeService(service, scenario, chaos, state, events);
        const serviceState = state[service.id];
        if (serviceState.failures >= failureBudget) serviceState.circuitOpen = true;
        return result;
      });

      const riskScore = calculateRisk(scenario, results);
      const confidence = calculateConfidence(results);
      const decision = summarizeDecision(scenario, results, riskScore, confidence);

      const serviceHealth = results.map((result) => ({
        id: result.service,
        name: getService(result.service).name,
        role: getService(result.service).role,
        status: result.status,
        latency: result.latency,
        fallback: result.fallback,
        circuitOpen: state[result.service].circuitOpen,
        health: calculateServiceHealth(result, state)
      }));

      const metrics = buildMetrics(results, decision, events);
      const evaluation = buildEvaluation(results, decision, events);

      return {
        scenario,
        chaos,
        decision,
        serviceHealth,
        events,
        metrics,
        evaluation,
        state: clone(state)
      };
    }

    function reset() {
      const fresh = createServiceState();
      Object.keys(state).forEach((key) => {
        state[key] = fresh[key];
      });
    }

    return {
      run,
      reset,
      state
    };
  }

  return {
    SERVICES,
    SCENARIOS,
    DEFAULT_CHAOS,
    createSession,
    formatMoney
  };
});
