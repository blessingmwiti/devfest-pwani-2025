# AI DevOps Assistant - Production-Ready Implementation

**DevFest Pwani 2025**

A practical AI assistant that queries production logs to help debug issues. Built with Firebase Genkit, Vertex AI (Gemini 2.5), and Cloud Log Analytics.

---

## FEATURES

- ✓ Natural language queries to system logs
- ✓ AI-generated SQL queries for BigQuery
- ✓ Real-time log analysis with Gemini 2.5
- ✓ Mock data mode for local development
- ✓ Production-ready with cost controls
- ✓ Streaming responses (backend ready)
- ✓ Beautiful, responsive UI
- ✓ Cloud Run deployment ready
- ✓ Comprehensive error handling

---

## QUICK START (Local Development)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend (.env)

```env
GCP_PROJECT_ID=demo-project
USE_MOCK_DATA=true
GOOGLE_GENAI_API_KEY=your-key
PORT=3400
```

### 3. Configure frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3400
```

### 4. Start backend

```bash
cd backend && npm run dev
```

### 5. Start frontend

```bash
cd frontend && npm run dev
```

### 6. Open browser

Navigate to: http://localhost:3000

---

## PRODUCTION DEPLOYMENT

1. Complete GCP setup (see `GCP_SETUP_GUIDE.txt`)
2. Deploy backend to Cloud Run (see `DEPLOYMENT_GUIDE.txt`)
3. Update frontend `.env.local` with Cloud Run URL
4. Deploy frontend to Firebase App Hosting or Vercel

---

## TECHNOLOGY STACK

### Backend
- Firebase Genkit (AI orchestration)
- Google AI / Vertex AI (Gemini 2.5 Flash)
- BigQuery (Log Analytics)
- Express.js (HTTP server)
- TypeScript

### Frontend
- Next.js (React framework)
- Tailwind CSS (Styling)
- React Markdown (Formatted responses)
- TypeScript

### Infrastructure
- Cloud Run (Serverless compute)
- Cloud Logging (Log Analytics)
- BigQuery (SQL queries)
- Artifact Registry (Container storage)

---

## KEY CONCEPTS

### 1. AGENTIC WORKFLOWS
The AI doesn't just chat - it uses TOOLS to query real data.

### 2. FEW-SHOT PROMPTING
We teach the AI the BigQuery schema with examples in the system prompt. This prevents hallucination.

### 3. TOOL CALLING
Genkit's `defineTool` makes functions callable by the AI. The AI decides when to use them.

### 4. COST OPTIMIZATION
- Use Gemini 2.5 Flash (10x cheaper than Pro)
- Enforce LIMIT 50 on all queries
- Cloud Run scales to zero when idle

### 5. DUAL MODE OPERATION
- `USE_MOCK_DATA=true`: Local development, no GCP needed
- `USE_MOCK_DATA=false`: Production with real logs

---

## SAMPLE QUERIES

Try these in the chat interface:

1. "Show me recent errors in the system"
2. "Find checkout failures in the last 30 minutes"
3. "Why is the payment service slow?"
4. "Check for authentication errors"
5. "What's the most common error in the last hour?"
6. "Show me all errors with trace ID xyz123"

---

## ARCHITECTURE

```
User Query
    ↓
Frontend (Next.js)
    ↓ HTTP POST
Backend (Genkit + Express)
    ↓
Gemini 2.5 Flash
    ↓ (decides to use tool)
querySystemLogs Tool
    ↓ SQL Query
BigQuery (Log Analytics)
    ↓ Results
Gemini 2.5 Flash (interprets)
    ↓
User-friendly Response
    ↓
Frontend Display
```

---

## SECURITY CONSIDERATIONS

- ✓ Service account has read-only BigQuery access
- ✓ No write permissions to logs or infrastructure
- ✓ Query size limits enforced (max 50 rows)
- ✓ CORS configured for specific origins
- ✓ API keys stored in environment variables
- ✓ No sensitive data in frontend
- ✓ PII redaction should be configured in Log Analytics

---

## COST ESTIMATION

### Per 1000 queries (assuming 1000 tokens per query)

**Gemini 2.5 Flash:**
- Input: 1M tokens = $0.075
- Output: 1M tokens = $0.30
- Total: ~$0.375 per 1000 queries

**BigQuery:**
- $6.25 per TB scanned
- With LIMIT 50, ~1KB per query
- Total: ~$0.006 per 1000 queries

**Cloud Run:**
- $0.00002400 per vCPU-second
- $0.00000250 per GiB-second
- ~$0.05 per 1000 queries (1s each)

**TOTAL:** ~$0.43 per 1000 queries = $0.00043 per query

**For 10,000 queries/month:** ~$4.30/month

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| "Cannot find module 'genkit'" | `npm install` in backend directory |
| "Failed to fetch" | Check backend is running, check CORS, check API URL |
| "Table not found" | Log Analytics takes ~1 hour to populate after upgrade |
| "Permission denied" | Check IAM roles (bigquery.jobUser, logging.viewer) |
| "API key not valid" | Get new key from makersuite.google.com/app/apikey |
| Port already in use | `lsof -ti:3400 \| xargs kill -9` |

See `QUICK_START_GUIDE.txt` for more troubleshooting.

---

## EXTENDING THE SYSTEM

### Add more tools
- Query metrics (Cloud Monitoring)
- Query traces (Cloud Trace)
- Restart services (Cloud Run API)
- Scale resources (Compute Engine API)
- Create incidents (PagerDuty API)

### Improve the AI
- Add more few-shot examples
- Fine-tune on your specific log format
- Add conversation memory
- Implement follow-up questions

### Enhance the UI
- Add charts for error trends
- Show SQL queries being generated
- Add export to CSV/JSON
- Implement user authentication

---

## RESOURCES

- [Firebase Genkit](https://firebase.google.com/docs/genkit)
- [Gemini API](https://ai.google.dev/)
- [Cloud Log Analytics](https://cloud.google.com/logging/docs/log-analytics)
- [BigQuery](https://cloud.google.com/bigquery/docs)

---

## LICENSE & CREDITS

Built for **DevFest Pwani 2025**  
Feel free to use, modify, and share!

Based on Google Cloud's modern AI stack:
- Firebase Genkit
- Vertex AI (Gemini 2.5)
- Cloud Log Analytics

