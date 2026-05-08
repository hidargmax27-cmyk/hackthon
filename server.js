const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const CircuitSage = require("./src/resilience-engine.js");

const root = __dirname;
const session = CircuitSage.createSession();
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("Request body too large"));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function getAccessToken() {
  if (process.env.GOOGLE_CLOUD_ACCESS_TOKEN) return process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
  if (!process.env.K_SERVICE) return null;

  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!response.ok) return null;
  const token = await response.json();
  return token.access_token;
}

async function callGemini(result) {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const token = await getAccessToken();

  if (!project || !token) {
    return {
      usedGemini: false,
      summary:
        "Gemini summary disabled locally. Deploy on Cloud Run with GOOGLE_CLOUD_PROJECT to enable Vertex AI reasoning."
    };
  }

  const endpoint =
    `https://${location}-aiplatform.googleapis.com/v1/projects/${project}` +
    `/locations/${location}/publishers/google/models/${model}:generateContent`;

  const prompt = [
    "You are CircuitSage, a DeFi risk operations agent.",
    "Summarize the operator action in 4 concise bullets.",
    "Never allow automation if the policy data is corrupted or confidence is low.",
    JSON.stringify({
      scenario: result.scenario.name,
      decision: result.decision,
      evaluation: result.evaluation,
      auditTrail: result.events.map((event) => event.label)
    })
  ].join("\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    return {
      usedGemini: false,
      summary: `Vertex AI returned ${response.status}; deterministic decision remains authoritative.`
    };
  }

  const data = await response.json();
  return {
    usedGemini: true,
    summary: data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini returned no text."
  };
}

function send(response, status, payload, contentType = "application/json; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(typeof payload === "string" ? payload : JSON.stringify(payload, null, 2));
}

async function handleApi(request, response) {
  const body = await readBody(request);
  const input = body ? JSON.parse(body) : {};
  const result = session.run(input.scenarioId || "stablecoin-depeg", input.chaos || {});
  const gemini = await callGemini(result);
  send(response, 200, { ...result, gemini });
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const rawPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(root, rawPath));

  if (!filePath.startsWith(root)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(response, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    send(response, 200, data, types[path.extname(filePath)] || "application/octet-stream");
  });
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/health") {
      send(response, 200, { ok: true });
      return;
    }

    if (request.url === "/api/run-agent" && request.method === "POST") {
      await handleApi(request, response);
      return;
    }

    serveStatic(request, response);
  } catch (error) {
    send(response, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`CircuitSage listening on http://localhost:${port}`);
});
