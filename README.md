# CircuitSage

CircuitSage is an action-oriented DeFi risk agent built for the Google Cloud Rapid Agent Hackathon. It turns chaotic protocol incidents into safe, auditable actions that operators can understand in seconds.

The painful problem: DeFi teams see fragmented alerts from markets, oracles, bridges, vaults, and governance systems. When a stablecoin depegs or bridge mint looks suspicious, teams need a fast answer that is useful, cautious, and explainable.

CircuitSage keeps the demo judge-friendly:

- one live browser app
- one core risk engine
- one MCP-style tool server for agent integration
- repeatable incident scenarios
- deterministic safety decisions
- a complete audit trail for every recommendation

## Why This Should Score

Rapid Agent rewards agents that can take useful action, integrate tools, and show a working prototype. CircuitSage maps directly to that rubric:

- Action: converts fragmented DeFi incident signals into "allow", "hold", or "human approval required" decisions.
- Technical depth: circuit breakers, dependency-health modeling, stale-data labeling, and policy integrity checks.
- Tool integration: exposes the risk engine as an MCP-style JSON-RPC tool for Gemini / Google Cloud Agent Builder workflows.
- Operational impact: helps protocol teams avoid bad automated action during high-value incidents.
- UX: a live command-center interface designed for a 2-5 minute demo.
- Presentation: one tight story from market panic to safe operator decision.

This is not just a dashboard. The engine models dependency health, failure modes, recovery paths, and policy compliance.

## Run Locally

Open `index.html` directly in a browser, or run a small static server:

```bash
npm run dev
```

Then open:

```text
http://localhost:4173
```

## Test

```bash
npm test
```

## MCP Tool Server

```bash
npm run mcp
```

The server exposes one tool:

```text
run_risk_scenario
```

It accepts a scenario id plus optional chaos flags and returns a decision, confidence score, service health, and audit trail.

## Arize-Style Evaluations

```bash
npm run eval
```

This replays five incidents and writes OpenInference-style trace records plus an eval summary to `observability/out`.

## Demo Flow

1. Start on "Stablecoin depeg liquidity run".
2. Run the clean scenario.
3. Enable "Primary LLM outage" and run again.
4. Enable "Oracle MCP timeout" and run again.
5. Switch to "Bridge mint anomaly".
6. Enable "Policy source corrupted" and run.
7. Point to the audit trail: the agent refuses unsafe automation and escalates to human signers.

## Project Files

- `index.html` - submit-ready static demo
- `styles.css` - responsive product UI
- `app.js` - browser interaction and canvas visualization
- `src/resilience-engine.js` - core engine shared by browser and tests
- `mcp/circuitsage-mcp.js` - dependency-free MCP-style tool endpoint
- `.gemini/settings.json` - Gemini MCP server config for CircuitSage and Arize Phoenix
- `observability/run-evals.js` - replay/eval trace generator
- `tests/engine.test.js` - deterministic behavior tests
- `SUBMISSION.md` - Rapid Agent/Devpost-ready project copy
- `DEMO_SCRIPT.md` - short recording script
- `SUBMIT_CHECKLIST.md` - exact submit checklist for Devpost
- `GOOGLE_CLOUD_AGENT.md` - Google Cloud Agent Builder setup notes
- `GOOGLE_CLOUD_DEPLOY.md` - Cloud Run deployment notes
- `ARIZE_TRACK.md` - Arize partner-track positioning
- `ARCHITECTURE.md` - architecture and judging notes

## Positioning

CircuitSage is built for protocol teams, risk desks, and DeFi operators who want AI agents in production without accepting silent failure as the default mode.
