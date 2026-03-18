# ReActive MVP Implementation Plan

## Objective

Ship the smallest credible ReActive MVP that can ingest CSV data, calculate dormant-customer opportunity, trigger first outreach, attribute recovered revenue, and show financial proof in the dashboard.

## Delivery Strategy

Build in vertical slices that preserve attribution integrity from the start. Do not spend early time on broad settings, visual polish, or CRM-style surfaces.

## Slice 1. App Foundation

### Scope

- Next.js app shell
- TypeScript setup
- Tailwind setup
- basic route structure
- tenant-aware layout shell
- placeholder auth boundary

### Exit Criteria

- app runs locally
- sidebar and top-level pages exist
- protected app area is ready for data wiring

## Slice 2. Import Pipeline

### Scope

- CSV upload screen
- sample file download
- column mapping form
- validation preview
- import job creation
- job status and summary UI

### Back-End Work

- import job persistence
- file parsing service
- row validation
- customer upsert
- order deduplication

### Exit Criteria

- valid rows import successfully
- invalid rows are reported with reason
- import summary persists after completion

## Slice 3. Metrics, Score, And Status

### Scope

- customer metric recalculation service
- repurchase window computation
- priority score computation
- status transitions
- customer list and detail screens showing computed outputs

### Exit Criteria

- impacted customers receive updated metrics after import
- customers can be filtered by status, seller, and score
- score and status are visible in customer detail

## Slice 4. Attribution Engine

### Scope

- first automatic dispatch persistence model
- attribution rule evaluator
- recovered revenue calculation on future imports
- audit event creation for attribution decisions

### Exit Criteria

- orders before first dispatch are not attributed
- orders after first dispatch are attributed once
- first dispatch cannot be overwritten

## Slice 5. Dashboard

### Scope

- KPI cards
- period chart
- status distribution
- priority ranking
- recent operational activity summary

### Exit Criteria

- dashboard reflects latest completed import data
- user can see money recovered and money at risk in the first screen

## Slice 6. Inbox And Handoff

### Scope

- thread list
- conversation view
- seller assignment visibility
- waiting-for-action state
- reply-driven automation pause

### Exit Criteria

- inbound reply creates or updates a thread
- automation pauses for that customer
- responsible seller can identify pending action

## Slice 7. Campaign Templates

### Scope

- template list by status
- create, enable, disable, preview
- max 3 templates per status

### Exit Criteria

- operators can manage the minimum template set for outreach
- UI clearly communicates the MVP limit

## Slice 8. Logs And Hardening

### Scope

- audit log page
- import and dispatch error states
- role checks for sensitive areas
- provider adapter abstraction points

### Exit Criteria

- important events are visible in logs
- system failures leave operationally useful traces

## Suggested Build Order By Week

### Week 1

- scaffold app shell
- establish route structure
- implement import job model and CSV upload UI stub

### Week 2

- complete CSV parsing and validation
- persist customers and orders
- show import result summary

### Week 3

- implement metrics, score, and status calculations
- build customer list and customer detail

### Week 4

- implement first dispatch model and attribution engine
- wire dashboard KPIs to computed data

### Week 5

- implement inbox, reply pause, and seller handoff
- add limited template management

### Week 6

- add logs, focused QA, and pilot readiness checks

## Testing Priorities

### Highest Risk Areas

- CSV row validation and deduplication
- repurchase metric calculation
- status threshold boundaries
- first dispatch immutability
- recovered revenue attribution conditions
- reply-driven automation pause

### Recommended Test Types

- unit tests for score, status, and attribution rules
- integration tests for import pipeline
- UI smoke checks for dashboard, import flow, and customer detail

## Build Constraints

- preserve CSV as source of truth
- do not introduce CRM pipeline concepts
- avoid direct provider coupling in page components
- protect auditability before adding convenience features

## Definition Of MVP Done

The MVP is done when:

- a tenant can import customer and order history from CSV
- the system computes reactivation priority and operational status
- the first automated outreach can be recorded and preserved
- future orders can be attributed as recovered revenue when valid
- dashboard surfaces recovered revenue, revenue at risk, and priority actions
- reply workflow pauses automation and exposes seller handoff

## Immediate Next Build Target

For the first code iteration, build Slices 1 and 2 together with just enough data structure to support Slice 3. This yields the fastest path to a working application skeleton without prematurely committing to provider or campaign complexity.

