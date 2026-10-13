# ShopPilot AI --- 2-Hour Hackathon MVP Plan

## Goal

Build the smallest convincing version of **ShopPilot AI**, an
AI-assisted CRM for WooCommerce, in **120 minutes** while minimizing
setup time, API usage, and paid credits.

The demo should show one clear workflow:

1.  View sample customers and orders in a CRM-style dashboard.
2.  Select an order that may need attention.
3.  Generate an AI-assisted summary and a customer-email draft.
4.  Review the proposed action before taking it.

> **Scope reality check:** A complete, production-ready WooCommerce CRM
> with reliable live synchronization, webhooks, email sending,
> authentication, and a robust agent is not realistic in two hours. This
> plan prioritizes a working demo. Real WooCommerce connectivity is
> optional and should only be attempted if store credentials already
> exist.

------------------------------------------------------------------------

## Deliverable at the 2-hour mark

### Must have

-   A working local web dashboard.
-   Customer and order tables/cards populated with clearly labelled demo
    data.
-   An order-detail view or selected-order panel.
-   A deterministic "needs attention" rule, such as an order remaining
    in `processing` beyond a demo threshold.
-   An **AI action** button that creates a short investigation summary
    and drafts an email.
-   A review/approval step before any action is treated as approved.
-   A clear note identifying demo data versus live WooCommerce data.

### Nice to have only if ahead of schedule

-   Read-only connection to an existing WooCommerce test store.
-   A small status badge showing whether data is live or demo.
-   A saved activity/audit entry in local state.

### Explicitly out of scope

-   Sending real emails.
-   Automatically refunding, cancelling, or modifying orders.
-   Production authentication and authorization.
-   Webhook infrastructure and guaranteed event processing.
-   Multi-agent architecture, vector databases, and elaborate analytics.
-   Connecting to a real business's private data without permission.

------------------------------------------------------------------------

## Two-hour execution schedule

  ------------------------------------------------------------------------
  Time              Task              Concrete result    Stop condition
  ----------------- ----------------- ------------------ -----------------
  00:00--00:10      Lock scope and    App runs locally;  Do not spend more
                    inspect the       choose the fastest than 10 minutes
                    existing project  available setup    creating a new
                                                         toolchain

  00:10--00:30      Build the CRM     Overview cards,    Use hard-coded
                    dashboard shell   customer list,     sample data if
                                      order list,        API setup is not
                                      selected-order     ready
                                      panel              

  00:30--00:45      Add order         Flag a sample      Use a
                    investigation     order based on     deterministic
                    rules             status/age; show   rule; do not ask
                                      why it was flagged an LLM to
                                                         calculate basic
                                                         facts

  00:45--01:10      Add AI summary    Button produces an Use one model
                    and email draft   investigation      call per
                                      summary and        user-triggered
                                      editable draft     investigation;
                                                         add a fallback if
                                                         unavailable

  01:10--01:25      Add approval and  Draft can be       Approval must not
                    activity log      approved locally;  send an email or
                                      record the         change the
                                      decision in the UI WooCommerce order

  01:25--01:40      Optional          Fetch recent       If not working
                    WooCommerce       orders/customers   after 15 minutes,
                    read-only         from an existing   return to demo
                    integration       test store, if     data
                                      credentials are    
                                      ready              

  01:40--02:00      Test and prepare  Test one happy     Stop adding
                    the demo          path and one       features; fix
                                      failure/fallback   only
                                      path; prepare a    demo-blocking
                                      60-second          issues
                                      walkthrough        
  ------------------------------------------------------------------------

**Important:** The optional WooCommerce integration is conditional. If
you have no store, API keys, or working app already, use the demo
dataset for the two-hour build and demonstrate the intended integration
boundary. Do not claim mock data is live data.

------------------------------------------------------------------------

## Recommended minimal architecture

Use the tools already installed in your project wherever possible.

-   **Frontend:** React
-   **Backend:** Existing Node.js/Express app, if already available
-   **Data:** Small local JavaScript/JSON sample dataset for the first
    demo
-   **Optional persistence:** Existing Supabase project, only if already
    configured
-   **Optional live integration:** WooCommerce REST API, read-only
-   **AI:** One existing model/API provider with tool calling or
    structured JSON output
-   **Email:** Draft-only; no sending in this MVP

### Minimal screens

1.  **Overview:** total demo orders, customers, and orders needing
    attention.
2.  **Orders:** order number, customer, status, date, total, and
    attention flag.
3.  **Customer panel:** customer details and recent orders.
4.  **AI action panel:** reason for flag, summary, suggested next step,
    editable email draft.
5.  **Activity:** "Draft created" and "Approved for follow-up" events.

------------------------------------------------------------------------

## AI-credit and cost control

The exact cost depends on the model/provider, current prices, and the
size of the prompt. Do not assume that a free tier is available or that
a particular amount of credit will be granted.

### Suggested budget

-   **Build and UI work:** no model API calls required.
-   **Manual testing:** aim for **3--5 model calls total**.
-   **Per investigation:** one compact request containing only the
    selected order and necessary customer context.
-   **Fallback:** if no API credit is available, use a clearly labelled
    deterministic template so the demo still works.

### Keep usage low

1.  Do not call the model automatically on every page load or for every
    order.
2.  Add an explicit **Investigate order** button.
3.  Send only the selected order's relevant fields; avoid sending the
    entire order history.
4.  Ask for a compact structured response, such as:
    -   `reason`
    -   `summary`
    -   `recommended_next_step`
    -   `email_subject`
    -   `email_body`
    -   `requires_human_review`
5.  Do not repeatedly retry failed model requests. Show an error and use
    the fallback.
6.  Cache the result for the selected order during the demo.
7.  Never place API keys in frontend code or commit them to Git.
8.  Set a provider-side usage limit if the provider supports one.

### Example compact model instruction

> Review this order using only the supplied data. Do not invent shipping
> or delivery facts. Explain why it may need attention, recommend a safe
> next step, and draft a polite email. Return the requested JSON fields.
> Do not send the email or modify the order.

### Credit-spending guardrail

Set a hard cap before the demo: **no more than five model requests**
unless you deliberately choose to spend more. If credit availability or
pricing is uncertain, start with one test request and inspect usage
before making further calls.

------------------------------------------------------------------------

## Demo data

Use fictional customers and orders. Example records:

  ----------------------------------------------------------------------------
  Order      Customer    Status          Age in demo          Total Demo rule
  ---------- ----------- ------------ -------------- -------------- ----------
  #1042      Maya        Processing           4 days         ₹2,499 Flag for
             Fernandes                                              review

  #1043      Arjun Naik  Completed             1 day           ₹899 No action
                                                                    needed

  #1044      Sara        On hold              2 days         ₹1,799 Flag for
             D'Souza                                                review
  ----------------------------------------------------------------------------

These are **illustrative records, not real WooCommerce data**. The "age"
values are deliberately supplied demo fields. In a live integration,
calculate age from the order timestamp and use a configurable policy; do
not assume that `processing` automatically means delayed or that it
proves a delivery problem.

------------------------------------------------------------------------

## Optional WooCommerce integration checklist

Attempt this only if a WooCommerce test store and API credentials
already exist.

1.  Create **read-only** REST API credentials for the test store where
    possible.
2.  Keep credentials in backend environment variables.
3.  Use the store's HTTPS URL.
4.  Fetch a small, bounded set of recent orders and customers.
5.  Handle pagination, API errors, missing customer IDs, and guest
    checkout.
6.  Label the dashboard **LIVE TEST STORE** only after a successful API
    response; otherwise label it **DEMO DATA**.
7.  Do not expose keys, customer personal data, or full API responses in
    browser logs.

Useful official documentation: - WooCommerce REST API:
https://woocommerce.github.io/woocommerce-rest-api-docs/ - WooCommerce
webhooks: https://woocommerce.com/document/webhooks/

Webhooks are intentionally deferred in this two-hour plan. They require
additional validation, duplicate-event handling, and failure recovery.

------------------------------------------------------------------------

## Acceptance checklist

Before calling the MVP complete, verify:

-   [ ] The app launches and the main dashboard renders.
-   [ ] Sample orders and customers are visibly labelled as demo data.
-   [ ] An order can be selected.
-   [ ] The app explains why an order was flagged.
-   [ ] The AI button returns a summary and email draft, or a visible
    fallback is used.
-   [ ] The email can be reviewed/edited before approval.
-   [ ] No real email is sent and no order is changed.
-   [ ] Model/API errors do not crash the app.
-   [ ] API keys are not present in frontend code or committed files.
-   [ ] The demo script does not claim mock data is live.

------------------------------------------------------------------------

## 60-second presentation script

1.  "ShopPilot AI brings customer and order context into one CRM-style
    view."
2.  Open order #1042 and show the reason it was flagged by the demo
    policy.
3.  Click **Investigate order**.
4.  Show the concise summary, recommended next step, and drafted
    customer email.
5.  Edit or review the draft, then approve the follow-up locally.
6.  Show the activity entry and explain that live WooCommerce read-only
    sync is an optional integration if credentials are configured.

### Honest positioning

Present this as a **two-hour proof of concept**. Explain that the next
development stage would add verified WooCommerce webhooks, durable
database storage, authenticated users, real communication-provider
integration, retries, reconciliation, and stronger audit controls.
