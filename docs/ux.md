# ReActive MVP UX And Information Architecture

## UX Principle

ReActive must feel like a focused revenue operations product. Every primary screen should help the user answer one of two questions:

- how much revenue was recovered or is at risk
- which customers require action next

The interface should feel financial and operational, not like a generic CRM or spreadsheet wrapper.

## Primary Navigation

Top-level navigation:

- Dashboard
- Importar CSV
- Clientes
- Inbox
- Campanhas
- Relatorios
- Configuracoes
- Logs

Navigation stays shallow. Customer detail lives under `Clientes` and inbox threads live under `Inbox`.

## Global Layout

### Desktop

- left sidebar for primary navigation
- top bar for tenant context, period filter, and user menu
- content area with clear page title, KPI strip when relevant, and single dominant primary action

### Mobile

- collapsible navigation drawer
- stacked KPI cards
- filters inside a collapsible sheet
- tables converted into cards or horizontally scrollable blocks when necessary

## Visual Direction

Base palette:

- primary: `#0B62A4`
- success: `#28A745`
- attention: `#FF7A00`
- danger: `#D64545`
- background: `#F5F7FA`
- text secondary: `#9AA3B2`

Visual hierarchy should prioritize:

- money values
- status chips
- trend deltas
- priority scores

Use motion only to clarify state changes such as import progress, KPI refresh, and inbox assignment updates. Respect reduced-motion preferences.

## Key Screens

## 1. Dashboard

### User Goal

Understand current financial impact and identify the next customers most likely to recover revenue.

### Primary Blocks

- KPI row with `Receita Recuperada`, `Receita em Risco`, `Clientes Reativados`, `Taxa de Resposta`
- period chart showing recovered revenue and dispatch trend
- status distribution card
- top priority customer ranking
- recent dispatch and reply activity summary

### Primary Action

- `Importar novo CSV`

### Key Interactions

- date range filter
- seller filter
- status filter
- click-through from ranking into customer detail

### Acceptance Notes

- first viewport must expose money recovered and money at risk without scrolling on desktop
- the ranking must show status, score, seller, and expected urgency

## 2. Importar CSV

### User Goal

Bring new customer and order data into the system safely and understand what was accepted or rejected.

### Flow

1. drag-and-drop upload
2. file preview
3. column mapping
4. validation preview
5. async processing state
6. completion summary

### Required Elements

- upload area
- sample CSV download
- mapping form with required-field warnings
- invalid row preview with reasons
- processing progress state
- summary card with total, valid, invalid, created, updated, and imported counts

### Primary Action

- `Processar importacao`

### Acceptance Notes

- invalid rows must be visible before final confirmation
- import summary must remain accessible after completion

## 3. Clientes

### User Goal

Scan the customer base by risk and priority, then drill into the best recovery opportunities.

### List Columns

- customer name
- status
- priority score
- days since last purchase
- repurchase window
- last 3 orders value
- responsible seller
- last dispatch

### Filters

- status
- score band
- seller
- recency
- value range
- with reply waiting

### Row Actions

- view detail
- open inbox thread when available
- manual operational flag when needed

### Acceptance Notes

- status and score must remain visible on mobile cards
- default sort should favor highest priority opportunity

## 4. Perfil do Cliente

### User Goal

Understand one customer's revenue history, current risk, automation state, and attribution timeline.

### Above The Fold

- customer name and seller
- status chip
- priority score
- days since last purchase
- repurchase window
- last 3 orders value

### Sections

- purchase history timeline
- score explanation
- automation timeline
- first dispatch metadata
- inbox and handoff state
- recovered revenue summary

### Acceptance Notes

- first dispatch timestamp must be prominent and clearly immutable
- attribution-related order history must be easy to audit

## 5. Inbox

### User Goal

Handle customers who replied and now need seller action.

### Layout

- thread list on the left or top
- conversation panel
- customer context panel with status, score, and seller

### Thread List Fields

- customer
- status
- latest inbound snippet
- latest outbound snippet
- assigned seller
- waiting-for-action marker

### Primary Actions

- assign or confirm seller ownership
- mark follow-up state

### Acceptance Notes

- inbox must stay operational and intentionally shallow
- this screen should not become a full CRM workspace

## 6. Campanhas

### User Goal

Configure the minimum message set required to trigger outreach by status.

### Structure

- grouped by status
- up to 3 templates per status
- template preview
- enable or disable controls

### Acceptance Notes

- keep configuration simple
- avoid visual complexity that implies advanced journey building

## 7. Relatorios

### User Goal

Inspect attributed results by period, seller, and campaign with export support.

### Core Views

- recovered revenue by period
- reactivated customers by period
- response and dispatch performance
- recovered revenue by seller

## 8. Configuracoes

### User Goal

Adjust only the minimum tenant-level settings required for operations.

### Allowed Areas In MVP

- tenant basics
- score weights if enabled later
- status thresholds if explicitly changed later
- notification preferences
- provider configuration placeholders

## 9. Logs

### User Goal

Audit imports, dispatches, replies, and important system events.

### Must Show

- event type
- related entity
- actor when relevant
- timestamp
- compact payload summary

## Cross-Screen Interaction Rules

- one primary action per page
- filters must update the view without heavy navigation
- toasts should confirm import, dispatch, pause, and assignment outcomes
- destructive or trust-sensitive actions must require explicit confirmation

## Design Constraints For Build

- prioritize desktop scanning speed
- preserve mobile operability for list and inbox workflows
- use cards for KPIs and summaries, not dense dashboard clutter
- keep empty states actionable and tied to import or outreach setup
- never hide attribution-critical timestamps behind deep drill-downs

## Validation Checklist

- dashboard answers revenue recovered and next money to recover
- import flow makes invalid data visible before processing
- customer detail makes attribution auditable
- inbox supports seller handoff without CRM expansion
- campaigns stay constrained to MVP template management

