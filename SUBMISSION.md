# Devpost Submission Draft

## Project Name

CircuitSage

## Tagline

A Gemini-ready DeFi risk agent that turns market chaos into safe, auditable incident actions.

## Inspiration

DeFi protocol teams face a very specific pain: critical risk signals arrive from too many places at once. During a stablecoin depeg, bridge mint anomaly, or liquidation cascade, operators are forced to scan market feeds, oracle heartbeats, vault exposure, policy rules, and governance payloads under time pressure.

CircuitSage was built for that pressure window as an action-oriented risk agent. It gives teams a fast, explainable risk decision while staying cautious about automation.

## What It Does

CircuitSage simulates a production DeFi incident response agent. Judges can inject dependency failures in real time:

- primary LLM outage
- oracle MCP timeout
- market MCP stale response
- vault indexer degradation
- policy source corruption

The agent keeps working through circuit breakers, fallback routes, deterministic policy rules, cached data labels, and human approval gates. Every run produces a decision, a confidence score, a dependency-health map, and a step-by-step audit trail.

The same decision engine is also exposed through a dependency-free MCP-style JSON-RPC tool server so it can be connected to a Gemini / Google Cloud Agent Builder workflow. For the Arize partner track, every run emits a Phoenix-style evaluation score, trace labels, and a self-improvement prompt patch.

## How We Built It

The project is a static browser app backed by a reusable JavaScript risk-and-resilience engine. The engine models service dependencies, health scoring, retry/failover behavior, circuit breaker state, degraded-mode decisioning, and compliance guardrails.

The UI makes the resilience behavior visible instead of hiding it behind a chat box. A judge can toggle failures, rerun the same incident, and immediately see which services failed, which fallbacks were used, and whether the final action is allowed to execute automatically.

For the agent layer, `mcp/circuitsage-mcp.js` exposes `run_risk_scenario` as a tool contract. A Gemini agent can call that tool, summarize the evidence, and return the recommended operator action. The Cloud Run server also exposes `/api/run-agent`, which can call Vertex AI Gemini when Google Cloud credentials are configured.

## Technical Highlights

- Stateful circuit breakers for repeated dependency failures.
- Degraded-mode decisions that label stale or missing data.
- Policy corruption detection that blocks unsafe autonomous action.
- Deterministic fallback rules for risk classification when the LLM path is unavailable.
- Full audit timeline for every agent run.
- Local-first demo with no API keys, wallets, RPC endpoints, or network dependencies.

## Google Cloud Rapid Agent Fit

Google Cloud Rapid Agent asks for agents that do more than chat: they should reason over tools, take useful actions, and show how they could run in a real workflow. CircuitSage fits that theme directly.

Instead of making analysts manually jump across market dashboards, oracle monitors, bridge explorers, vault reports, and policy docs, CircuitSage consolidates the incident workflow into one agent action surface with explainable recommendations and audit history.

## Arize Partner Track Fit

CircuitSage makes agent observability part of the product, not an afterthought. The demo shows dependency traces, safety/actionability eval scores, labels like `safe-escalation` and `trace-complete`, and a self-improvement patch after each run. This creates a tight loop: observe the incident decision, evaluate safety and actionability, then improve the agent policy.

## What Is Next

- Add real MCP servers for on-chain data, vault positions, and governance policies.
- Deploy the agent service behind a TrueFoundry workflow with health probes and autoscaling.
- Connect to testnet DeFi protocols for replayable incident drills.
- Export audit logs to protocol risk committees and security operations teams.

## Built With

JavaScript, HTML, CSS, Node.js, deterministic simulation, circuit breakers, fallback routing, DeFi risk modeling, MCP-style tool contracts, Arize/Phoenix-style evaluations, Vertex AI Gemini-ready Cloud Run service.
