# ReActive Iteration Notes

## Current State

The repository now contains:

- product definition documents for PRD, UX, schema, and implementation plan
- a Next.js app baseline with route structure and initial product-facing screens
- static mock data that matches the MVP story and navigation

## What Is Still Missing

- runtime validation of the Next.js scaffold
- package installation
- real import pipeline
- persistence layer
- score and status computation
- first dispatch and attribution logic
- inbox reply ingestion

## Recommended Next Iteration

Implement the first real functional slice across UI and server boundaries:

1. create the import job domain types
2. create a CSV parsing and validation service contract
3. add a temporary local mock repository for customers, orders, and import jobs
4. replace static import screen placeholders with a step-based import state flow
5. wire dashboard and customer list to derived mock metrics generated from imported records

## Why This Slice Comes Next

- it preserves the MVP boundary around CSV-as-source-of-truth
- it unlocks score, status, and attribution work without waiting for provider integration
- it gives the product its first auditable operational workflow

## Known Verification Gap

This codebase has not been run locally because `node` and `npm` are not available in the current environment. Any runtime or dependency issues remain unverified until a JavaScript toolchain is installed.

