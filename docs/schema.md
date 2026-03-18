# ReActive MVP Schema And Business Logic

## Technical Direction

Default implementation assumptions for the MVP:

- Next.js with TypeScript
- Postgres as the system of record
- multi-tenant-ready schema from day one
- asynchronous import and recalculation jobs
- WhatsApp provider adapter behind application services

## Core Modeling Principles

- CSV import is the source of truth in MVP
- order attribution must be auditable and deterministic
- first automatic dispatch is immutable once created
- customer metrics are derived and recalculated, not manually edited
- reply-driven handoff must preserve seller ownership and operational traceability

## Core Entities

## `tenants`

- `id`
- `name`
- `timezone`
- `status`
- `created_at`
- `updated_at`

Purpose: isolates customer, order, dispatch, and reporting data.

## `users`

- `id`
- `tenant_id`
- `name`
- `email`
- `role`
- `created_at`
- `updated_at`

Purpose: controls access to imports, configuration, audit views, and operations.

## `customers`

- `id`
- `tenant_id`
- `external_customer_id`
- `name`
- `phone`
- `seller_name`
- `seller_email`
- `seller_phone`
- `current_status`
- `priority_score`
- `first_auto_dispatch_at`
- `automation_paused_at`
- `handoff_state`
- `created_at`
- `updated_at`

Constraints:

- unique on `tenant_id + external_customer_id`
- index on `tenant_id + phone`
- index on `tenant_id + seller_name`

Notes:

- `first_auto_dispatch_at` is nullable until first automated outreach happens
- once populated, `first_auto_dispatch_at` cannot be replaced by later automated dispatches

## `orders`

- `id`
- `tenant_id`
- `external_order_id`
- `customer_id`
- `order_date`
- `order_value`
- `import_job_id`
- `is_recovered_revenue`
- `recovered_revenue_amount`
- `recovered_after_dispatch_at`
- `created_at`

Constraints:

- unique on `tenant_id + external_order_id`
- index on `tenant_id + customer_id + order_date`

Notes:

- original order facts remain immutable
- attribution flags are derived from order date compared to first dispatch

## `customer_metrics`

- `customer_id`
- `tenant_id`
- `last_purchase_at`
- `days_since_last_purchase`
- `average_interval_days`
- `repurchase_window_days`
- `last_3_orders_value`
- `historical_frequency_score`
- `window_proximity_score`
- `priority_score`
- `score_band`
- `status`
- `computed_at`

Constraints:

- one current row per `tenant_id + customer_id` for MVP
- index on `tenant_id + status`
- index on `tenant_id + priority_score`

Purpose: keeps query-ready operational metrics separate from raw order history.

## `message_templates`

- `id`
- `tenant_id`
- `status_trigger`
- `name`
- `body`
- `is_active`
- `created_at`
- `updated_at`

Constraints:

- maximum of 3 active templates per `tenant_id + status_trigger` in MVP

## `message_dispatches`

- `id`
- `tenant_id`
- `customer_id`
- `template_id`
- `dispatch_type`
- `provider`
- `provider_message_id`
- `dispatched_at`
- `delivery_status`
- `is_first_automatic_dispatch`
- `stopped_by_reply_at`
- `created_at`

Constraints:

- index on `tenant_id + customer_id + dispatched_at`
- index on `tenant_id + delivery_status`

Notes:

- exactly one dispatch per customer may carry `is_first_automatic_dispatch = true`
- if a first automatic dispatch is created, `customers.first_auto_dispatch_at` must match it

## `inbox_threads`

- `id`
- `tenant_id`
- `customer_id`
- `assigned_seller`
- `waiting_for_action`
- `last_inbound_at`
- `last_outbound_at`
- `created_at`
- `updated_at`

Constraints:

- unique on `tenant_id + customer_id`

## `inbox_messages`

- `id`
- `thread_id`
- `tenant_id`
- `direction`
- `body`
- `provider_message_id`
- `sent_at`
- `received_at`

Constraints:

- index on `tenant_id + thread_id`
- index on `tenant_id + provider_message_id`

## `import_jobs`

- `id`
- `tenant_id`
- `uploaded_by_user_id`
- `import_type`
- `file_name`
- `started_at`
- `finished_at`
- `status`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `error_report_path`

Constraints:

- index on `tenant_id + status`
- index on `tenant_id + started_at`

## `audit_events`

- `id`
- `tenant_id`
- `actor_user_id`
- `event_type`
- `entity_type`
- `entity_id`
- `payload_json`
- `created_at`

Constraints:

- index on `tenant_id + event_type + created_at`

Purpose: supports trust and forensic checks on imports, dispatches, replies, and settings changes.

## Import Processing Logic

### Inputs

Required mapped fields:

- `cliente_id`
- `nome`
- `telefone`
- `vendedor_responsavel`
- `data_compra`
- `valor_compra`
- `pedido_id`

### Import Steps

1. create `import_jobs` record with status `pending`
2. upload file and parse in chunks
3. validate each row
4. reject invalid rows with reason tracking
5. upsert customers by `tenant_id + external_customer_id`
6. insert new orders only when `tenant_id + external_order_id` is new
7. mark job summary counts
8. recalculate metrics only for impacted customers
9. recompute dashboard aggregates
10. append audit event

## Metrics And Status Logic

### Derived Metrics

For each impacted customer, compute:

- latest purchase date
- average interval between purchases
- repurchase window days
- days since last purchase
- total value of last 3 orders
- purchase frequency consistency

### Default Status Rule

- if the customer has not crossed the repurchase window yet, they are not in the reactivation target set
- once `days_since_last_purchase > repurchase_window_days`, status enters `Atencao`
- if `days_since_last_purchase <= repurchase_window_days + 15`, status remains `Atencao`
- if `days_since_last_purchase > repurchase_window_days + 15` and `<= repurchase_window_days + 45`, status becomes `Em risco`
- if `days_since_last_purchase > repurchase_window_days + 45`, status becomes `Inativo`

### Priority Score

Reference formula:

- `value_component * 0.45`
- `frequency_component * 0.35`
- `timing_component * 0.20`

Where:

- `value_component` favors value from the last 3 orders
- `frequency_component` favors consistent repurchase behavior
- `timing_component` peaks near the ideal repurchase window and decays as the delay gets too long

Store score inputs or summarized components when needed for explainability.

## Automation Logic

### Trigger Eligibility

A customer can be evaluated for the first automatic dispatch when:

- they belong to the active tenant
- they have a valid phone
- they are inside the operational target status
- automation is not paused
- `first_auto_dispatch_at` is null

### First Dispatch Rule

1. select the active template for the current status
2. send through the provider adapter
3. create `message_dispatches` row
4. if this is the first successful automatic dispatch, set:
   - `message_dispatches.is_first_automatic_dispatch = true`
   - `customers.first_auto_dispatch_at = dispatched_at`
5. emit audit event

Guardrail:

- later dispatches must never overwrite `customers.first_auto_dispatch_at`

### Reply Handling

When an inbound reply is received:

1. find or create the customer's inbox thread
2. create inbound `inbox_messages` row
3. set `customers.automation_paused_at`
4. set `message_dispatches.stopped_by_reply_at` for the relevant dispatch chain when applicable
5. route to the responsible seller
6. set thread `waiting_for_action = true`
7. emit audit event

## Attribution Logic

For each imported order:

1. find the customer
2. read `customers.first_auto_dispatch_at`
3. if no first dispatch exists, mark order as not recovered
4. if `order_date <= first_auto_dispatch_at`, mark order as not recovered
5. if `order_date > first_auto_dispatch_at`, mark order as recovered
6. set `recovered_revenue_amount = order_value` for MVP
7. store `recovered_after_dispatch_at = first_auto_dispatch_at`
8. prevent duplicate attribution through the unique order key

## Dashboard Aggregation Logic

Precompute or efficiently query:

- recovered revenue total by period
- recovered revenue by seller
- estimated revenue at risk
- reactivated customer count
- dispatch count
- response rate
- customers by status
- top-priority ranking

## Audit Requirements

The system must be able to answer:

- when the first automatic dispatch was sent
- which template triggered it
- when the customer replied
- which seller received the handoff
- which imported order counted as recovered revenue
- which user uploaded the related file

## Recommended Indexes

- `customers (tenant_id, external_customer_id)`
- `customers (tenant_id, seller_name)`
- `orders (tenant_id, external_order_id)`
- `orders (tenant_id, customer_id, order_date)`
- `customer_metrics (tenant_id, status, priority_score)`
- `message_dispatches (tenant_id, customer_id, dispatched_at)`
- `import_jobs (tenant_id, status, started_at)`
- `audit_events (tenant_id, event_type, created_at)`

## Validation Checklist

- no order can be attributed twice
- first dispatch remains immutable after creation
- recalculation updates only impacted customers
- reply pauses automation and creates seller-visible handoff
- dashboard figures can be traced back to imports and dispatches

