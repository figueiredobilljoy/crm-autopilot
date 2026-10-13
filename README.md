# ShopPilot AI - WooCommerce CRM Copilot

ShopPilot AI is an AI-assisted CRM dashboard for WooCommerce merchants. It helps operators review order risk, understand customer context, draft customer updates, and keep an auditable record of decisions.

## What it does

1. **CRM Overview**: View customer and order context in a merchant-friendly dashboard.
2. **SLA Sentinel**: Automatically evaluates orders against fulfillment benchmarks, including orders in `processing` beyond the 48-hour SLA.
3. **AI Investigation Hub**: Generates concise root-cause summaries, actionable store recommendations, and ready-to-edit customer emails.
4. **Human Review & Safe Approval**: An operator reviews and approves proposed email drafts locally; approved actions are recorded to the Activity Log with zero risk of unauthorized email dispatch.
5. **Built-In Fallback Engine**: Includes deterministic draft generation with optional support for Groq, Google Gemini, and OpenAI when API keys are configured.
6. **WooCommerce Read-Only Connector**: Optional test connection and sync for stores with REST API credentials.

## Running the App

### Install dependencies

```bash
npm install
```

### Build the frontend

```bash
npm run build
```

### Start the server

```bash
npm start
```
The server serves both the Express API and the built React frontend at **`http://localhost:3001`**.

### Development Mode (with Hot Reloading)

```bash
npm run dev:server   # in one terminal (port 3001)
npm run dev:client   # in another terminal (port 5173 with proxy)
```

## Review Flow

1. Open **`http://localhost:3001`**.
2. Review the metric cards and active order queue.
3. Select order **#1042** (Maya Fernandes) from the list.
4. Review the **SLA Alert Triggered** card explaining why the order was flagged: `Processing for 4 days (SLA threshold is 2 days)`.
5. Click **Investigate Order** to run the AI engine.
6. Inspect the structured diagnosis, situation summary, recommended next steps, and customer email draft.
7. Edit the subject or body as desired, then click **Approve Follow-up Draft**.
8. Click **Activity Log** in the header to view the timestamped audit record.
