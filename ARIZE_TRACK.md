# Arize Track Strategy

CircuitSage is positioned for the Arize partner track in the Google Cloud Rapid Agent Hackathon.

## Why Arize

The project is an agentic risk workflow where the interesting problem is not a single answer. The winning story is observability:

- Which dependency failed?
- Why did the agent switch from automation to human approval?
- Did the action stay safe when confidence dropped?
- What prompt or policy should be improved after the run?

CircuitSage makes those questions visible in the UI and in trace-style exports.

## Implemented Assets

- `mcp/circuitsage-mcp.js`: MCP-style tool server exposing `run_risk_scenario`.
- `.gemini/settings.json`: Gemini CLI / agent runtime MCP configuration.
- `observability/run-evals.js`: offline replay that emits OpenInference-style trace records.
- `observability/out/eval-summary.json`: generated eval results after running `npm run eval`.
- UI "Phoenix eval" metric: shows actionability/safety score on every run.
- Audit trail self-improvement patch: converts a failed/degraded run into a prompt or policy improvement.

## Demo Story

1. Run a clean stablecoin depeg.
2. Show high confidence and guarded automation.
3. Inject LLM and oracle failures.
4. Show the agent still returns a safe action with lower confidence.
5. Inject policy corruption.
6. Show autonomous execution is blocked.
7. Point to the Phoenix eval score, labels, and self-improvement patch.

## What To Say To Judges

"The agent is not only acting. It is observable. Every decision produces traces, eval scores, dependency health, and a proposed improvement patch. That is the difference between a flashy demo and an agent a risk team could actually operate."
