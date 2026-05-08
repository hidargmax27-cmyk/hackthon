# 90-Second Demo Script

## 0:00 - 0:12

"CircuitSage is a Gemini-ready DeFi risk agent for the Google Cloud Rapid Agent Hackathon. The point is simple: during a protocol incident, teams need a safe action in seconds, not ten disconnected dashboards."

## 0:12 - 0:28

"Here is a stablecoin depeg scenario. In the clean path, the agent checks market data, oracle heartbeat, vault exposure, policy rules, and the LLM planner. It produces a safe action, confidence score, and audit trail."

## 0:28 - 0:48

"Now I turn on a primary LLM outage. The agent opens a circuit breaker, routes away from the failed planner, and falls back to deterministic risk rules. It still returns a decision and clearly marks the run as degraded."

## 0:48 - 1:07

"Now the oracle MCP is timing out too. The agent labels stale data, lowers confidence, and shifts from automated execution to guarded mitigation."

## 1:07 - 1:24

"The most important case is corrupted policy data. CircuitSage refuses to auto-execute. It escalates to human signers and preserves a full audit trail, so operators know exactly why the agent stopped."

## 1:24 - 1:42

"For the Arize track, every run also produces a Phoenix-style eval score, trace labels, and a self-improvement patch. The agent is not just answering; it is observable and improving."

## 1:42 - 1:50

"This is the difference between a passive dashboard and an action-oriented agent: safe fallbacks, visible reasoning, and fewer expensive incident-response mistakes."
