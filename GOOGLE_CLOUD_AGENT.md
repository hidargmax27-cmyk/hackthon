# Google Cloud Agent Setup Notes

Use this file to recreate the Rapid Agent version of CircuitSage inside Google Cloud Agent Builder or another Gemini-based agent runtime.

## Agent Identity

Name:

```text
CircuitSage
```

System instruction:

```text
You are CircuitSage, a DeFi risk operations agent. Your job is to convert fragmented protocol incident signals into safe, auditable operator actions. When tool confidence is low, oracle data is stale, policy data is corrupted, or the risk score is extreme, you must block autonomous execution and require human approval. Always cite the evidence returned by the risk tool and include the audit trail summary.
```

## Tool

Connect the local tool server:

```bash
npm run mcp
```

Tool name:

```text
run_risk_scenario
```

Example tool input:

```json
{
  "scenarioId": "bridge-mint",
  "chaos": {
    "plannerDown": true,
    "oracleTimeout": true,
    "policyCorrupt": true
  }
}
```

Expected agent response shape:

```text
Decision:
Block autonomous execution and require signer review.

Why:
- Policy integrity failed.
- Oracle data is unavailable.
- LLM path is unavailable, so deterministic rules were used.

Operator action:
Escalate to bridge guardians, pause automated mint route, and attach the audit trail to the incident ticket.
```

## Google Cloud Deployment Path

1. Push this repository to GitHub.
2. Build the Dockerfile with Cloud Build or directly deploy it to Cloud Run.
3. Use the browser demo URL as the public prototype link.
4. Use the MCP server contract in `mcp/circuitsage-mcp.js` as the tool layer for the Gemini agent.

The static app is intentionally local-first for judging reliability. The agent/tool contract is separate so the same engine can power a Gemini workflow without changing the demo UI.
