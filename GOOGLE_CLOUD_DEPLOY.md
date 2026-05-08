# Google Cloud Deployment

CircuitSage is deployment-ready for Cloud Run.

## Cloud Run

```bash
gcloud run deploy circuitsage-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_LOCATION=us-central1,GEMINI_MODEL=gemini-2.5-flash
```

If the Cloud Run service account has Vertex AI permissions and `GOOGLE_CLOUD_PROJECT` is available, `/api/run-agent` will call Vertex AI Gemini for the operator-facing summary while keeping the deterministic safety engine authoritative.

## Local Run

```bash
npm run dev
```

Open:

```text
http://localhost:4173
```

Health check:

```text
http://localhost:4173/health
```

## API

```bash
curl -X POST http://localhost:4173/api/run-agent \
  -H "Content-Type: application/json" \
  -d "{\"scenarioId\":\"bridge-mint\",\"chaos\":{\"plannerDown\":true,\"oracleTimeout\":true,\"policyCorrupt\":true}}"
```

The API returns:

- deterministic decision
- Gemini summary when configured
- Phoenix-style evaluation
- dependency health
- audit trail
