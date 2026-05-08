const readline = require("node:readline");
const CircuitSage = require("../src/resilience-engine.js");

const session = CircuitSage.createSession();

const tools = [
  {
    name: "run_risk_scenario",
    description:
      "Run a DeFi incident scenario and return a safe, auditable operator action.",
    inputSchema: {
      type: "object",
      properties: {
        scenarioId: {
          type: "string",
          enum: CircuitSage.SCENARIOS.map((scenario) => scenario.id)
        },
        chaos: {
          type: "object",
          properties: {
            plannerDown: { type: "boolean" },
            oracleTimeout: { type: "boolean" },
            marketStale: { type: "boolean" },
            vaultSlow: { type: "boolean" },
            policyCorrupt: { type: "boolean" }
          }
        }
      },
      required: ["scenarioId"]
    }
  }
];

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function fail(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

function callTool(name, args) {
  if (name !== "run_risk_scenario") {
    throw new Error(`Unknown tool: ${name}`);
  }

  const scenarioId = args && args.scenarioId;
  const chaos = args && args.chaos ? args.chaos : {};
  const result = session.run(scenarioId, chaos);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            scenario: result.scenario.name,
            asset: result.scenario.asset,
            decision: result.decision,
            evaluation: result.evaluation,
            metrics: result.metrics,
            serviceHealth: result.serviceHealth,
            auditTrail: result.events.map((event) => event.label)
          },
          null,
          2
        )
      }
    ]
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

rl.on("line", (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (error) {
    fail(null, -32700, "Parse error");
    return;
  }

  try {
    if (request.method === "initialize") {
      respond(request.id, {
        protocolVersion: "2024-11-05",
        serverInfo: {
          name: "circuitsage-risk-mcp",
          version: "0.1.0"
        },
        capabilities: {
          tools: {}
        }
      });
      return;
    }

    if (request.method === "tools/list") {
      respond(request.id, { tools });
      return;
    }

    if (request.method === "tools/call") {
      const params = request.params || {};
      respond(request.id, callTool(params.name, params.arguments || {}));
      return;
    }

    fail(request.id, -32601, `Method not found: ${request.method}`);
  } catch (error) {
    fail(request.id, -32000, error.message);
  }
});
