# ReActive MVP PRD

## Product Summary

ReActive is a revenue recovery platform for B2B distributors. The MVP identifies customers who are outside their expected repurchase window, triggers the first automated WhatsApp outreach, pauses automation when the customer replies, and proves recovered revenue from later orders that happen after that first dispatch.

The MVP must not expand into a generic CRM, chatbot, or deep ERP integration project. CSV import is the source of truth in the initial version.

## Goal

Within 90 days, validate that dormant and at-risk customers can be reactivated through fast, automated outreach and that the platform can attribute measurable recovered revenue from those actions.

## Target Users

- commercial managers who need visibility into revenue at risk and recovered revenue
- operators who import data, monitor jobs, and keep the system running
- sellers who take over after customer replies

## MVP Scope

### Included

- tenant and user baseline
- CSV upload with column mapping
- import validation and import result summary
- customer and order normalization
- purchase-history consolidation per customer
- customer metrics recalculation on relevant imports
- priority score and operational status calculation
- first automatic WhatsApp dispatch tracking
- automation pause on inbound reply
- seller handoff workflow
- recovered revenue attribution on future order imports
- dashboard with financial KPIs and priority ranking
- lightweight operational inbox
- limited message template configuration with up to 3 templates per status
- audit logs for imports, dispatches, replies, and key configuration changes

### Explicitly Out of Scope

- full CRM pipeline or opportunity management
- chatbot-style conversational automation
- SKU recommendation engine
- deep ERP or bi-directional integrations
- unlimited automation rules
- complex campaign builder
- broad analytics beyond revenue recovery proof and core operations

## Core User Flows

### 1. Import and Compute

1. Operator uploads a CSV file.
2. Operator maps input columns to required fields.
3. System validates rows and reports invalid entries.
4. System imports valid data and recalculates only impacted customers.
5. System computes repurchase window, days since last purchase, score, and status.

### 2. First Automated Outreach

1. System identifies customers eligible for outreach.
2. System sends the first automated WhatsApp template.
3. System stores the first dispatch timestamp immutably for attribution.
4. Delivery status is updated through the provider adapter.

### 3. Reply and Handoff

1. Customer replies to the automated message.
2. System pauses automation for that customer.
3. System routes the thread to the responsible seller.
4. Seller sees the customer in the inbox with waiting-for-action state.

### 4. Recovered Revenue Attribution

1. Future orders are imported through CSV.
2. System compares each order date against the customer's first automatic dispatch timestamp.
3. If the order happens after the first automatic dispatch, the order can count as recovered revenue.
4. If the order happens before or at the first automatic dispatch, the order is not attributed to the platform.
5. Dashboard and reports update on the next recalculation.

## Required Inputs

The MVP requires support for these fields, with UI-based column mapping:

- `cliente_id`
- `nome`
- `telefone`
- `vendedor_responsavel`
- `data_compra`
- `valor_compra`
- `pedido_id`

## Business Rules

### Attribution Integrity

- recovered revenue only counts when a new order occurs after the first automatic dispatch
- orders before or exactly at the first automatic dispatch do not count as recovered
- only the first automatic dispatch starts the attribution timeline
- first automatic dispatch must remain immutable after being set
- the same imported order must never be attributed twice

### Seller Ownership

- seller ownership must come from imported data or explicit manual assignment
- reply handoff must route to the responsible seller

### Recalculation

- status, score, and financial KPIs must be recalculated on each relevant import
- derived customer metrics must preserve computation timestamps for auditability

## Customer Metrics

The system must compute and persist at least:

- last purchase date
- average interval between purchases
- average repurchase window
- days since last purchase
- total value of the last 3 purchases
- purchase frequency summary
- priority score
- score components when needed for explainability

## Status Logic

Default operational status rules:

- `Atencao`: after the repurchase window is crossed and up to 15 days beyond it
- `Em risco`: more than 15 days and up to 45 days beyond the repurchase window
- `Inativo`: more than 45 days beyond the repurchase window

## Priority Score

The score is a 0-100 ranking intended to surface the next best revenue recovery opportunities. It should favor:

1. value of the last 3 purchases
2. historical repurchase frequency
3. closeness to the ideal repurchase window

The score must remain explainable enough for operators and managers to understand why one customer ranks above another.

## Functional Requirements

### Import Pipeline

- upload CSV file
- map source columns to required fields
- validate row-level data before import
- store import job metadata and summary
- report invalid rows and reason for rejection

### Customer Processing

- deduplicate customers by tenant and external customer identifier
- deduplicate orders by tenant and external order identifier
- consolidate order history per customer
- update current status and priority score after import

### Automation

- support status-based message templates
- support up to 3 templates per status in MVP
- trigger the first dispatch based on configured operational rule
- store provider metadata and delivery state
- stop automation when a reply is received

### Inbox

- list customers with inbound reply awaiting action
- show last outbound message
- show inbound message
- show responsible seller
- show waiting-for-action state

### Dashboard

- show recovered revenue
- show estimated revenue at risk
- show reactivated customers
- show dispatch count
- show response rate
- show customer counts by status
- show period evolution
- show a high-priority customer ranking

### Auditability

- log imports
- log first dispatch creation
- log replies that paused automation
- log attribution decisions
- preserve traceability from imported order to recovered revenue KPI

## Non-Functional Requirements

- support CSV imports up to 100k rows with asynchronous processing
- keep dashboard fast by relying on precomputed metrics when needed
- preserve multi-tenant-ready boundaries in the schema
- keep the UI operational on desktop and mobile
- respect reduced-motion preferences
- protect sensitive data with standard secure transport and storage practices

## Acceptance Criteria

### Import

- a user can upload a CSV, map columns, validate rows, and complete an import with a visible success or error summary
- invalid rows are rejected with reasons and do not block valid row import

### Scoring and Status

- after import, impacted customers have updated repurchase metrics, priority score, and status
- status transitions follow the configured default thresholds unless explicitly changed later

### First Dispatch

- when the system sends the first automated outreach, the customer receives a persisted first automatic dispatch timestamp
- that timestamp cannot be overwritten by later automated dispatches

### Reply and Handoff

- when a customer replies, automation pauses for that customer
- the inbox shows the customer assigned to the responsible seller with waiting-for-action status

### Attribution

- when a future order is imported after the first automatic dispatch, the order is marked as recovered revenue
- when an order is imported before or at the first automatic dispatch, the order is not marked as recovered revenue
- duplicate imports of the same order do not create duplicate attribution

### Dashboard

- dashboard KPIs reflect the latest completed imports and attribution logic
- users can identify both money already recovered and the next customers with highest recovery potential

## Risks And Guardrails

- poor CSV quality can distort score and attribution, so validation and error reporting are mandatory
- ambiguous seller ownership breaks handoff, so seller assignment must come from import or explicit action
- allowing attribution edits would undermine trust, so attribution-start events must stay immutable
- adding CRM-style features too early would slow validation and dilute the product proof

## Open Product Decisions For Later

- exact outreach trigger timing inside the `Atencao` window
- tenant-level score weight customization
- which WhatsApp provider is used first
- whether seller notifications are email, in-app, or both

