# Google Cloud Rapid Agent Submit Checklist

## Hackathon

- Hackathon: Google Cloud Rapid Agent Hackathon
- Platform: Devpost
- Link: https://rapid-agent.devpost.com/
- Live window: May 1, 2026 to June 11, 2026
- Eligibility: not student-only. Participants must be above the legal age of majority and from eligible countries/territories listed by Devpost.

## What To Submit

- Project name: CircuitSage
- Tagline: A Gemini-ready DeFi risk agent that turns market chaos into safe, auditable incident actions.
- Repo: upload this folder to a public GitHub repository.
- Demo video: record `index.html` or `http://localhost:4173` using the flow in `DEMO_SCRIPT.md`.
- Project description: copy from `SUBMISSION.md`.
- Built with: JavaScript, HTML, CSS, deterministic simulation, circuit breakers, MCP-style tool contract, DeFi risk modeling.
- Partner track: Arize

## Suggested Tracks

- Rapid Agent main track
- Google Cloud / Gemini agent workflow
- MCP tool integration

## Recording Checklist

1. Open the app.
2. Show the stablecoin depeg scenario with no chaos toggles.
3. Toggle Primary LLM outage and run again.
4. Toggle Oracle MCP timeout and run again.
5. Switch to Bridge mint anomaly.
6. Toggle Policy source corrupted.
7. End on the audit trail and say why the agent blocks unsafe automation.

## Submission Claims To Emphasize

- Real pain: DeFi teams need fast decisions during fragmented protocol incidents.
- Wow factor: judges can inject failures live and watch the decision mode change.
- Technical depth: the resilience engine is separate from the UI, exposed as a tool server, and covered by tests.
- Arize fit: show Phoenix-style eval score, trace labels, and self-improvement patch in the demo.
- Business value: saves analyst time and avoids unsafe automation when millions in TVL may be at risk.
- Practicality: static app, no API keys, no wallet setup, no network dependency for judging.
