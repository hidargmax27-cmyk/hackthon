const session = CircuitSage.createSession();

const scenarioList = document.querySelector("#scenarioList");
const runBtn = document.querySelector("#runBtn");
const resetBtn = document.querySelector("#resetBtn");
const chaosInputs = Array.from(document.querySelectorAll("[data-chaos]"));
const canvas = document.querySelector("#meshCanvas");
const ctx = canvas.getContext("2d");

let activeScenario = CircuitSage.SCENARIOS[0].id;
let latestResult = null;
let animationFrame = 0;

const serviceLayout = {
  planner: { x: 0.48, y: 0.24 },
  market: { x: 0.22, y: 0.58 },
  oracle: { x: 0.38, y: 0.72 },
  vault: { x: 0.62, y: 0.68 },
  policy: { x: 0.78, y: 0.45 },
  cache: { x: 0.52, y: 0.48 }
};

function money(value) {
  return CircuitSage.formatMoney(value);
}

function getChaos() {
  return chaosInputs.reduce((chaos, input) => {
    chaos[input.dataset.chaos] = input.checked;
    return chaos;
  }, {});
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function renderScenarioButtons() {
  scenarioList.innerHTML = CircuitSage.SCENARIOS.map((scenario) => {
    const active = scenario.id === activeScenario ? " active" : "";
    return `
      <button class="scenario-button${active}" type="button" data-scenario="${scenario.id}">
        <strong>${scenario.name}</strong>
        <span>${scenario.asset} · ${money(scenario.capitalAtRisk)} exposed</span>
      </button>
    `;
  }).join("");

  scenarioList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeScenario = button.dataset.scenario;
      renderScenarioButtons();
      runAgent();
    });
  });
}

function renderDecision(result) {
  const { scenario, decision, metrics } = result;
  setText("#scenarioAsset", scenario.asset);
  setText("#scenarioTitle", scenario.name);
  setText("#decisionAction", decision.action);
  setText("#decisionStatus", decision.status);
  setText("#riskScore", decision.riskScore);
  setText("#confidenceMetric", `${decision.confidence}%`);
  setText("#exposureMetric", money(scenario.capitalAtRisk));
  setText("#failoverMetric", metrics.failovers);
  setText("#uptimeMetric", `${metrics.uptimePreserved}%`);
  setText("#evalMetric", `${result.evaluation.score}`);
  setText("#evalGrade", `Phoenix eval ${result.evaluation.grade}`);
  setText("#pegSignal", `${scenario.signals.pegDeviationBps} bps`);
  setText("#oracleSignal", `${scenario.signals.oracleLagSeconds}s`);
  setText("#velocitySignal", `${Math.round(scenario.signals.withdrawalVelocity * 100)}%`);
  setText("#latencyBadge", `Mean ${metrics.meanDependencyMs}ms`);
  setText("#auditCount", `${metrics.auditEvents} events`);

  const modePill = document.querySelector("#modePill");
  modePill.textContent = decision.requiresHuman ? "Manual Gate" : decision.mode === "normal" ? "Normal" : "Degraded";
  modePill.className = "mode-pill";
  if (decision.requiresHuman) modePill.classList.add("manual");
  else if (decision.mode !== "normal") modePill.classList.add("degraded");

  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (decision.riskScore / 100) * circumference;
  document.querySelector("#riskArc").style.strokeDashoffset = offset.toFixed(2);

  document.querySelector("#evidenceList").innerHTML = decision.evidence
    .concat([`Arize-style eval: ${result.evaluation.name} scored ${result.evaluation.score}/100`])
    .map((line) => `<li>${line}</li>`)
    .join("");
}

function renderServices(result) {
  const grid = document.querySelector("#serviceGrid");
  grid.innerHTML = result.serviceHealth
    .map((service) => {
      const circuit = service.circuitOpen ? " · circuit open" : "";
      return `
        <article class="service-tile" data-status="${service.status}">
          <header>
            <strong>${service.name}</strong>
            <i class="status-dot" aria-hidden="true"></i>
          </header>
          <span>${service.status.replace("-", " ")}${circuit}</span>
          <footer>
            <b>${service.health}%</b>
            <em>${service.latency}ms</em>
          </footer>
        </article>
      `;
    })
    .join("");
}

function renderAudit(result) {
  const list = document.querySelector("#auditList");
  list.innerHTML = result.events
    .concat([
      {
        label: `Self-improvement patch: ${result.evaluation.promptPatch}`,
        impact: "degraded"
      }
    ])
    .map((event, index) => {
      return `
        <li data-step="${index + 1}" data-impact="${event.impact}">
          <p>${event.label}</p>
        </li>
      `;
    })
    .join("");
}

function drawMesh(result) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const center = { x: width / 2, y: height / 2 };
  const nodes = result.serviceHealth.map((service) => ({
    ...service,
    x: serviceLayout[service.id].x * width,
    y: serviceLayout[service.id].y * height
  }));

  ctx.lineWidth = 2;
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(node.x, node.y);
    ctx.strokeStyle =
      node.status === "healthy"
        ? "rgba(20, 162, 117, 0.46)"
        : node.status === "degraded"
          ? "rgba(223, 154, 25, 0.56)"
          : "rgba(240, 92, 68, 0.58)";
    ctx.stroke();
  });

  const pulse = 1 + Math.sin(animationFrame / 18) * 0.08;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 32 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = result.decision.requiresHuman ? "#f05c44" : result.decision.mode === "normal" ? "#14a275" : "#df9a19";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AGENT", center.x, center.y + 4);

  nodes.forEach((node) => {
    const color =
      node.status === "healthy"
        ? "#14a275"
        : node.status === "degraded"
          ? "#df9a19"
          : "#f05c44";

    ctx.beginPath();
    ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = "#17201c";
    ctx.font = "800 10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    const label = node.id.toUpperCase();
    ctx.fillText(label, node.x, node.y + 4);
  });
}

function animate() {
  animationFrame += 1;
  if (latestResult) drawMesh(latestResult);
  requestAnimationFrame(animate);
}

function runAgent() {
  latestResult = session.run(activeScenario, getChaos());
  renderDecision(latestResult);
  renderServices(latestResult);
  renderAudit(latestResult);
  drawMesh(latestResult);
}

runBtn.addEventListener("click", runAgent);
resetBtn.addEventListener("click", () => {
  session.reset();
  runAgent();
});

chaosInputs.forEach((input) => {
  input.addEventListener("change", runAgent);
});

window.addEventListener("resize", () => {
  if (latestResult) drawMesh(latestResult);
});

renderScenarioButtons();
runAgent();
animate();
